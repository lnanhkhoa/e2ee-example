import { sql } from "drizzle-orm"
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  dateOfBirth: text("date_of_birth"),
  salary: text("salary"),
  phoneNumber: text("phone_number"),
  address: text("address"),

  role_id: integer("role_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export const roles = sqliteTable("roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
})

export type Role = typeof roles.$inferSelect
export type NewRole = typeof roles.$inferInsert

export const sessions = sqliteTable("user_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  publicKey: text("public_key"),
  encryptionMode: text("encryption_mode", { enum: ["server", "client"] })
    .notNull()
    .default("server"),
  revoked: integer({ mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
})

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert

export const aes_keys = sqliteTable("aes_keys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  encryptedKey: text("encrypted_key").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
})

export type AESKey = typeof aes_keys.$inferSelect
export type NewAESKey = typeof aes_keys.$inferInsert

export const takeUniqueOrThrow = <T extends any[]>(values: T): T[number] => {
  if (values.length !== 1) throw new Error("Found non unique or inexistent value")
  return values[0]!
}
