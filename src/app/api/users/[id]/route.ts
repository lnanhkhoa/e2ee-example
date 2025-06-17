import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { takeUniqueOrThrow, Session, User, users } from "@/lib/db/schema"
import { ApiResponse } from "@/lib/api-utils"
import { eq } from "drizzle-orm"
import { EncryptUser } from "@/lib/encrypt-user"
import { withAuth } from "@/lib/with-auth"

// Native
function pick(object: any, keys: string[]) {
  return keys.reduce((obj: any, key: string) => {
    if (object && object.hasOwnProperty(key)) {
      obj[key] = object[key]
    }
    return obj
  }, {})
}

type Context = {
  params: Promise<{ id: string }>
  user: User
  session: Session
}

// PUT /api/users/[id] - Replace a user
export const PUT = withAuth(async (request: NextRequest, context: Context) => {
  const id = (await context.params).id
  try {
    const userId = parseInt(id)
    if (isNaN(userId)) return ApiResponse.error("Invalid user ID", 400)

    const body = await request.json()

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(takeUniqueOrThrow)
    if (!existingUser) return ApiResponse.notFound()

    const encryptUser = new EncryptUser()
    await encryptUser.initialize()

    // Update user
    const encodedFields = encryptUser.encodeSensitiveFields(body)
    const updatedUser = await db
      .update(users)
      .set({
        name: body.name || existingUser.name,
        email: body.email || existingUser.email,
        ...encodedFields,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning({ id: users.id })
      .then(takeUniqueOrThrow)

    return ApiResponse.success(updatedUser)
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) return ApiResponse.error("Email already exists", 409)
    return ApiResponse.error("Failed to update user")
  }
})

// PATCH /api/users/[id] - Partially update a user
export const PATCH = withAuth(async (request: NextRequest, context: Context) => {
  try {
    const userId = parseInt((await context.params).id)
    if (isNaN(userId)) return ApiResponse.error("Invalid user ID", 400)

    const body = await request.json()

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(takeUniqueOrThrow)
    if (!existingUser) {
      return ApiResponse.notFound()
    }

    // Only update the fields that are provided in the request
    const updateData: any = pick(body, ["name", "email", "dateOfBirth", "salary", "phoneNumber", "address"])

    // Encode sensitive fields
    const encryptUser = new EncryptUser()
    await encryptUser.initialize()
    const encodedFields = encryptUser.encodeSensitiveFields(updateData)

    // Update user
    const updatedUser = await db
      .update(users)
      .set(encodedFields)
      .where(eq(users.id, userId))
      .returning({ id: users.id })
      .then(takeUniqueOrThrow)

    return ApiResponse.success(updatedUser)
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) return ApiResponse.error("Email already exists", 409)
    return ApiResponse.error("Failed to update user")
  }
})

// DELETE /api/users/[id] - Delete a user
export const DELETE = withAuth(async (request: NextRequest, context: Context) => {
  const id = (await context.params).id
  try {
    const userId = parseInt(id)
    if (isNaN(userId)) return ApiResponse.error("Invalid user ID", 400)

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(takeUniqueOrThrow)
    if (!existingUser) return ApiResponse.notFound()

    // Delete user
    await db.delete(users).where(eq(users.id, userId))

    return ApiResponse.success({ message: "User deleted successfully" })
  } catch (error) {
    return ApiResponse.error("Failed to delete user")
  }
})
