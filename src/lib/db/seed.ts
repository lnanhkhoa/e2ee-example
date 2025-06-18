import * as schema from "./schema"
import bcryptjs from "bcryptjs"
import KMS from "../kms"
import crypto from "crypto"
import { AES } from "../aes"
import { db } from "./index"

export type Role = "admin" | "user"

const seedDb = async () => {
  // 1. insert roles
  console.log("Inserting roles...")
  let roles = await db.select().from(schema.roles)
  if (roles.length > 0) return
  await db.insert(schema.roles).values([{ name: "admin" }, { name: "user" }])
  roles = await db.select().from(schema.roles)

  // 2. insert aes key
  console.log("Inserting aes key...")
  const kms = new KMS()
  const privateKey = crypto.randomBytes(32).toString("hex")
  const encryptedKey = await kms.encryptDataKey(privateKey)
  await db.insert(schema.aes_keys).values([{ encryptedKey }])
  const aes = new AES(privateKey)

  // 3. insert users
  console.log("Inserting users...")
  const users = await db.select().from(schema.users)
  if (users.length > 0) return
  const defaultPassword = bcryptjs.hashSync("1234", 10)
  await db.insert(schema.users).values([
    {
      name: "Admin",
      email: "admin@example.com",
      password: defaultPassword,
      role_id: roles.find((role) => role.name === "admin")!.id,
      dateOfBirth: aes.encrypt("1990-01-01"),
      salary: aes.encrypt("1000"),
      phoneNumber: aes.encrypt("1234567890"),
      address: aes.encrypt("Master Street")
    }
  ])

  console.log("Inserting seeding users...")
  const seedingUsers = new Array(1000).fill(1).map((_, index) => ({
    name: "Normal User " + (index + 1),
    email: `user${index + 1}@example.com`,
    password: defaultPassword,
    role_id: roles.find((role) => role.name === "user")!.id,
    dateOfBirth: aes.encrypt("1994-04-01"),
    salary: aes.encrypt(String(100 + index)),
    phoneNumber: aes.encrypt("1234567890"),
    address: aes.encrypt(`${index + 1} Main St`)
  }))
  await db.insert(schema.users).values(seedingUsers)
  console.log("Seeding users inserted successfully")
}

seedDb()
  .catch(console.error)
  .finally(() => {
    console.log("Seeding completed")
    process.exit(0)
  })
