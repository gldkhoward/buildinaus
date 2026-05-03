import { getDb } from "."
import { curatedConfigs, startups, users } from "./schema"

async function main() {
  const db = getDb()

  const [luke] = await db
    .insert(users)
    .values({
      slug: "luke-howard",
      name: "Luke Howard",
      email: "luke@buildinaus.dev",
      role: "founder",
      city: "sydney",
      headline: "Building BuildinAus",
    })
    .returning()

  await db.insert(startups).values({
    slug: "buildinaus",
    name: "BuildinAus",
    domain: "buildinaus.dev",
    description: "The home of the Australian startup ecosystem.",
    city: "sydney",
    industry: ["devtools", "community"],
    founderIds: [luke!.id],
    trustScore: 78,
    domainAgeDays: 14,
    verified: false,
  })

  await db.insert(curatedConfigs).values({
    userId: luke!.id,
    blocks: ["vc-map", "blackbird-grants", "events-feed", "founder-leaderboard"],
    layout: "grid",
  })

  console.log("seeded.")
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
