import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, sessions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcryptjs from "bcryptjs"
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "@/utils/config"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find user by email
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1)

    if (!user.length) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })

    if (!bcryptjs.compareSync(password, user[0].password)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const { password: _, ...userWithoutPassword } = user[0]

    const session = await db.insert(sessions).values({ userId: userWithoutPassword.id }).returning()

    const payload = { userId: userWithoutPassword.id, sessionId: session[0].id }
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "1d",
    })

    return NextResponse.json({ user: userWithoutPassword, token })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
