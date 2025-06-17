import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { Session, User, users } from "@/lib/db/schema"
import { ApiResponse } from "@/lib/api-utils"
import { EncryptUser } from "@/lib/encrypt-user"
import { withAuth } from "@/lib/with-auth"

// GET /api/users - Get all users
export const GET = withAuth(async (request: NextRequest, context: { user: User; session: Session }) => {
  const encryptUser = new EncryptUser()
  await encryptUser.init()

  try {
    const allUsers = await db.select().from(users)
    const dataUsers = allUsers.map((user) => {
      const { password, ...rest } = user
      const decodedUser = encryptUser.decodeSensitiveFields(rest)
      return decodedUser
    })

    if (context.session.encryptionMode === "client") {
      const publicKey = context.session.publicKey
      if (!publicKey) return ApiResponse.error("Public key not found", 401)
      for (let i = 0; i < dataUsers.length; i++) {
        const reEncyptDataUser = await encryptUser.rsaEncryptFields(publicKey, dataUsers[i])
        dataUsers[i] = reEncyptDataUser
      }
      return ApiResponse.success(dataUsers)
    }

    return ApiResponse.success(dataUsers)
  } catch (error) {
    console.error("Error fetching users:", error)
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
    await encryptUser.init()
    const encodedFields = encryptUser.encodeSensitiveFields(body)
    const newUser = await db
      .insert(users)
      .values({
        name: body.name,
        email: body.email,
        ...encodedFields
      })
      .returning()

    return ApiResponse.success(encryptUser.decodeSensitiveFields(newUser[0]), 201)
  } catch (error: any) {
    console.error("Error creating user:", error)
    if (error.message.includes("UNIQUE constraint failed")) {
      return ApiResponse.error("Email already exists", 409)
    }
    return ApiResponse.error("Failed to create user")
  }
})
