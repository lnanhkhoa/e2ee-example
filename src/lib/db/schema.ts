import { sql } from "drizzle-orm"
import { pgTable, text, integer, timestamp, boolean } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  dateOfBirth: text("date_of_birth"),
  salary: text("salary"),
  phoneNumber: text("phone_number"),
  address: text("address"),

  role_id: text("role_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow()
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export const roles = pgTable("roles", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique()
})

export type Role = typeof roles.$inferSelect
export type NewRole = typeof roles.$inferInsert

export const sessions = pgTable("user_sessions", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  publicKey: text("public_key"),
  encryptedAESKey: text("encrypted_aes_key"),
  encryptionMode: text("encryption_mode", { enum: ["server", "client"] })
    .notNull()
    .default("server"),
  revoked: boolean("revoked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow()
})

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert

export const aes_keys = pgTable("aes_keys", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  encryptedKey: text("encrypted_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow()
})

export type AESKey = typeof aes_keys.$inferSelect
export type NewAESKey = typeof aes_keys.$inferInsert

export const takeUniqueOrThrow = <T extends any[]>(values: T): T[number] => {
  if (values.length !== 1) throw new Error("Found non unique or inexistent value")
  return values[0]!
}
