import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { Session, takeUniqueOrThrow, User, users } from "@/lib/db/schema"
import { ApiResponse } from "@/lib/api-utils"
import { EncryptUser } from "@/lib/encrypt-user"
import { withAuth } from "@/lib/with-auth"
import { AES } from "@/lib/aes"
import { BasicEncryptUser } from "@/lib/basic-encrypt-user"

// GET /api/users - Get all users
export const GET = withAuth(async (request: NextRequest, context: { user: User; session: Session }) => {
  const encryptUser = new EncryptUser()
  await encryptUser.initialize()

  try {
    const allUsers = await db.select().from(users)
    const dataUsers = allUsers.map((user) => {
      const { password, ...rest } = user
      const decodedUser = encryptUser.decodeSensitiveFields(rest)
      return decodedUser
    })

    if (context.session.encryptionMode === "client") {
      const encryptedAESKey = context.session.encryptedAESKey
      if (!encryptedAESKey) return ApiResponse.error("AES key not found", 401)
      const userAESKey = encryptUser.aes?.decrypt(encryptedAESKey)

      const encryptUserAESKey = new BasicEncryptUser(new AES(userAESKey))
      const reEncyptDataUsers = dataUsers.map((user) => encryptUserAESKey.encodeSensitiveFields(user))
      return ApiResponse.success(reEncyptDataUsers)
    }

    return ApiResponse.success(dataUsers)
  } catch (error) {
    return ApiResponse.error("Failed to fetch users")
  }
})

// POST /api/users - Create a new user
export const POST = withAuth(async (request: NextRequest, context: { user: User; session: Session }) => {
  try {
    const body = await request.json()

    // Basic validation
    if (!body.name || !body.email) {
      return ApiResponse.error("Name and email are required", 400)
    }

    const encryptUser = new EncryptUser()
    await encryptUser.initialize()

    const encodedFields = encryptUser.encodeSensitiveFields(body)
    const newUser = await db
      .insert(users)
      .values({
        name: body.name,
        email: body.email,
        ...encodedFields
      })
      .returning({ id: users.id })
      .then(takeUniqueOrThrow)

    return ApiResponse.success(newUser, 201)
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) return ApiResponse.error("Email already exists", 409)
    return ApiResponse.error("Failed to create user")
  }
})
