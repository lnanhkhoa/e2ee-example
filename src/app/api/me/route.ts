import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { aes_keys, Session, sessions, takeUniqueOrThrow, users } from "@/lib/db/schema"
import { ApiResponse } from "@/lib/api-utils"
import { and, eq } from "drizzle-orm"
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "@/utils/config"
import { EncryptUser } from "@/lib/encrypt-user"
import { withAuth } from "@/lib/with-auth"

type TokenPayload = {
  userId: number
  sessionId: number
}

// GET /api/me - Get current user
export const GET = withAuth(async (request: NextRequest, context: { user: any; session: Session }) => {
  try {
    const { user, session } = context
    if (!user || !session) {
      return ApiResponse.error("Unauthorized", 401)
    }

    const encryptUser = new EncryptUser()
    await encryptUser.init()

    const decodedUser = encryptUser.decodeSensitiveFields(user)

    const { password, ...rest } = decodedUser
    const dataUser = {
      ...rest,
      encryptionMode: session.encryptionMode
    }

    if (session.encryptionMode === "client") {
      const publicKey = session.publicKey
      if (!publicKey) return ApiResponse.error("Public key not found", 401)
      const reEncyptDataUser = await encryptUser.rsaEncryptFields(publicKey, dataUser)
      return ApiResponse.success(reEncyptDataUser)
    }

    return ApiResponse.success(dataUser)
  } catch (error) {
    console.error("Error fetching user:", error)
    return ApiResponse.error("Failed to fetch user")
  }
})


export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return ApiResponse.error("Unauthorized", 401)
    }

    const decodedToken = jwt.verify(token, JWT_SECRET) as TokenPayload
    const session = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, decodedToken.sessionId), eq(sessions.revoked, false)))
      .limit(1)
      .then(takeUniqueOrThrow)
    if (!session) return ApiResponse.error("Session not found", 401)

    const body = await request.json()
    const { encryptionMode = session.encryptionMode, publicKey = session.publicKey } = body
    const params = {
      encryptionMode: encryptionMode,
      publicKey: publicKey,
    }

    await db.update(sessions).set(params).where(eq(sessions.id, session.id))

    return ApiResponse.success({ message: "Session Updated successfully" })
  } catch (error) {
    console.error("Error updating session:", error)
    return ApiResponse.error("Failed to update session")
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return ApiResponse.error("Unauthorized", 401)
    }

    const decodedToken = jwt.verify(token, JWT_SECRET) as TokenPayload
    const session = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, decodedToken.sessionId), eq(sessions.revoked, false)))
      .limit(1)
      .then(takeUniqueOrThrow)
    if (!session) return ApiResponse.error("Session not found", 401)

    await db.update(sessions).set({ revoked: true }).where(eq(sessions.id, session.id))

    return ApiResponse.success({ message: "Session revoked successfully" })
  } catch (error) {
    console.error("Error revoking session:", error)
    return ApiResponse.error("Failed to revoke session")
  }
}
