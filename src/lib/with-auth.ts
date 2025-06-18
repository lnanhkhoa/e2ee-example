import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { sessions, takeUniqueOrThrow, users } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "@/utils/config"

type TokenPayload = {
  userId: string
  sessionId: string
}

type Handler = (req: NextRequest, context: { user: any; session: any; params: any }) => Promise<Response>

export function withAuth(handler: Handler): Handler {
  return async (req, context) => {
    const token = req.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    }

    // If authenticated, call the original handler
    const tokenPayload = jwt.verify(token, JWT_SECRET) as TokenPayload
    const session = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, tokenPayload.sessionId), eq(sessions.revoked, false)))
      .limit(1)
      .then(takeUniqueOrThrow)
    context.session = session

    if (!session || session.revoked) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    }

    const user = await db.select().from(users).where(eq(users.id, session.userId)).limit(1).then(takeUniqueOrThrow)
    context.user = user

    return handler(req, context)
  }
}
