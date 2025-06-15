import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import * as schema from "./schema"
import { sql } from "drizzle-orm"
import bcryptjs from "bcryptjs"
import KMS from "../kms"
import crypto from "crypto"
import { AES } from "../aes"

const sqlite = new Database("local.db")
const db = drizzle(sqlite, { schema })
export type Role = "admin" | "user"

// Create tables if they don't exist
const initDb = async () => {
  const queries = [
    sql`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )`,
    sql`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      date_of_birth TEXT, -- sensitive field
      salary TEXT, -- sensitive field
      phone_number TEXT, -- sensitive field
      address TEXT, -- sensitive field
      role_id INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`,
    sql`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      revoked INTEGER NOT NULL DEFAULT 0,
      public_key TEXT,
      encryption_mode TEXT NOT NULL DEFAULT 'server',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`,
    sql`
      CREATE TABLE IF NOT EXISTS aes_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        encrypted_key TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `,
    sql`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)
    `,
    sql`
      CREATE INDEX IF NOT EXISTS idx_users_role_id ON users (role_id)
    `,
  ].forEach((query) => db.run(query))
}

initDb().catch(console.error)

const seedDb = async () => {
  // 1. insert roles
  const roles = await db.select().from(schema.roles)
  if (roles.length > 0) return
  await db.insert(schema.roles).values([{ name: "admin" }, { name: "user" }])

  // 2. insert aes key
  const kms = new KMS()
  const privateKey = crypto.randomBytes(32).toString("hex")
  const encryptedKey = await kms.encryptDataKey(privateKey)
  await db.insert(schema.aes_keys).values([{ encryptedKey }])
  const aes = new AES(privateKey)

  // 3. insert users
  const users = await db.select().from(schema.users)
  if (users.length > 0) return
  const defaultPassword = bcryptjs.hashSync("1234", 10)
  await db.insert(schema.users).values([
    {
      name: "Admin",
      email: "admin@example.com",
      password: defaultPassword,
      role_id: 1,
      dateOfBirth: aes.encrypt("1990-01-01"),
      salary: aes.encrypt("1000"),
      phoneNumber: aes.encrypt("1234567890"),
      address: aes.encrypt("Master Street"),
    },
  ])

  const seedingUsers = new Array(1000).fill(1).map((_, index) => ({
    name: "Normal User " + (index + 1),
    email: `user${index + 1}@example.com`,
    password: defaultPassword,
    role_id: 2,
    dateOfBirth: aes.encrypt("1994-04-01"),
    salary: aes.encrypt(String(100 + index)),
    phoneNumber: aes.encrypt("1234567890"),
    address: aes.encrypt(`${index + 1} Main St`),
  }))
  await db.insert(schema.users).values(seedingUsers)
}

initDb()
  .then(() => {
    seedDb().catch(console.error)
  })
  .catch(console.error)

export { db }
