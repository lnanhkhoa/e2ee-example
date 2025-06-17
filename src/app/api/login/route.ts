import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, sessions, takeUniqueOrThrow } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcryptjs from "bcryptjs"
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "@/utils/config"
import { AES } from "@/lib/aes"
import { rsaInstance } from "@/utils/rsa-instance"
import { EncryptUser } from "@/lib/encrypt-user"

export async function POST(request: Request) {
  try {
    const { email, password, publicKey } = await request.json()

    if (!email || !password || !publicKey) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = await db.select().from(users).where(eq(users.email, email)).limit(1).then(takeUniqueOrThrow)
    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })

    if (!bcryptjs.compareSync(password, user.password)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const encryptUser = new EncryptUser()
    await encryptUser.initialize()

    const aes = new AES()
    const newUserKey = aes.getMasterKey()
    const encryptedAESKey = await encryptUser.aes?.encrypt(newUserKey)
    const rsaEncryptedAESKey = await rsaInstance.serverEncryptWithPublicKey(publicKey, newUserKey)

    const session = await db
      .insert(sessions)
      .values({ userId: user.id, publicKey, encryptedAESKey })
      .returning({ id: sessions.id })
      .then(takeUniqueOrThrow)
    const payload = { userId: user.id, sessionId: session.id }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" })

    return NextResponse.json({ user, token, encryptedAESKey: rsaEncryptedAESKey })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
