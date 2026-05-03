import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: text("name").notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  role: varchar("role", { length: 32 }).notNull(),
  city: varchar("city", { length: 32 }).notNull(),
  headline: text("headline"),
  linkedinUrl: text("linkedin_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const startups = pgTable("startups", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: text("name").notNull(),
  domain: varchar("domain", { length: 255 }).notNull(),
  description: text("description").notNull(),
  city: varchar("city", { length: 32 }).notNull(),
  industry: jsonb("industry").$type<string[]>().notNull().default([]),
  founderIds: jsonb("founder_ids").$type<number[]>().notNull().default([]),
  trustScore: integer("trust_score").notNull().default(0),
  domainAgeDays: integer("domain_age_days").notNull().default(0),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const curatedConfigs = pgTable("curated_configs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  blocks: jsonb("blocks").$type<string[]>().notNull().default([]),
  layout: varchar("layout", { length: 16 }).notNull().default("grid"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Startup = typeof startups.$inferSelect
export type NewStartup = typeof startups.$inferInsert
export type CuratedConfig = typeof curatedConfigs.$inferSelect
export type NewCuratedConfig = typeof curatedConfigs.$inferInsert
