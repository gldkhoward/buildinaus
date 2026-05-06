/**
 * Entity embedder. Generates a single embedding per entity via the AI SDK
 * `embed()` (routed through Vercel AI Gateway), stored in the `embeddings`
 * table for cross-entity semantic search.
 *
 * Called from the `promote()` server action AFTER an entity has been
 * inserted, and from any manual edit that materially changes the source
 * fields (name / tagline / bio).
 */

import { embed } from "ai"
import { gateway } from "@ai-sdk/gateway"
import { embeddings, eq, getDb, sql } from "@buildinaus/database"

const EMBED_MODEL = "openai/text-embedding-3-large"

export type EmbeddingEntityKind =
  | "company"
  | "founder"
  | "job"
  | "event"
  | "atlas_section"
  | "atlas_entry"

interface EmbedEntityInput {
  kind: EmbeddingEntityKind
  entityId: number
  /**
   * Concatenated text the embedder ingests. Convention: weight name/title
   * first, then short summary, then long form. Fields used should be passed
   * in `sourceFields` so a future re-embed can recreate the same string.
   */
  sourceText: string
  sourceFields: string[]
}

export async function embedEntity(input: EmbedEntityInput): Promise<void> {
  const { embedding } = await embed({
    model: gateway.textEmbeddingModel(EMBED_MODEL),
    value: input.sourceText,
  })

  const db = getDb()
  // Upsert by (entity_kind, entity_id). The unique index on
  // (entity_kind, entity_id) makes ON CONFLICT trivial.
  await db
    .insert(embeddings)
    .values({
      entityKind: input.kind,
      entityId: input.entityId,
      embedding,
      sourceText: input.sourceText,
      sourceFields: input.sourceFields,
      model: EMBED_MODEL,
    })
    .onConflictDoUpdate({
      target: [embeddings.entityKind, embeddings.entityId],
      set: {
        embedding,
        sourceText: input.sourceText,
        sourceFields: input.sourceFields,
        model: EMBED_MODEL,
        generatedAt: new Date(),
      },
    })
}

/**
 * Cosine-similarity nearest neighbours across one or more entity kinds.
 * The pgvector `<=>` operator returns distance; we expose `1 - distance`
 * as `score` (higher = closer) to match the rest of the search pipeline.
 */
export async function findSimilar(args: {
  kinds: EmbeddingEntityKind[]
  query: string
  limit?: number
}): Promise<Array<{ kind: EmbeddingEntityKind; entityId: number; score: number }>> {
  const { embedding } = await embed({
    model: gateway.textEmbeddingModel(EMBED_MODEL),
    value: args.query,
  })

  const db = getDb()
  const limit = args.limit ?? 20
  const rows = await db.execute<{
    entity_kind: EmbeddingEntityKind
    entity_id: number
    score: number
  }>(sql`
    SELECT entity_kind,
           entity_id,
           1 - (embedding <=> ${embedding}::vector) AS score
    FROM   ${embeddings}
    WHERE  entity_kind = ANY(${args.kinds})
    ORDER  BY embedding <=> ${embedding}::vector
    LIMIT  ${limit}
  `)
  return rows.rows.map((r) => ({
    kind: r.entity_kind,
    entityId: Number(r.entity_id),
    score: Number(r.score),
  }))
}

/** Convenience: drop an embedding (e.g. when an entity is rejected). */
export async function deleteEmbedding(
  kind: EmbeddingEntityKind,
  entityId: number,
): Promise<void> {
  const db = getDb()
  await db
    .delete(embeddings)
    .where(
      sql`${embeddings.entityKind} = ${kind} AND ${embeddings.entityId} = ${entityId}`,
    )
}
