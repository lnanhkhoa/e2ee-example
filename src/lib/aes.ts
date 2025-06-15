import crypto from "crypto"

export class AES {
  private masterKey: string
  private privateKey: Buffer
  private ivLength: number = 16 // For AES-256, this is usually 16 bytes
  private algorithm: string = "aes-256-cbc"

  constructor(masterKey?: string) {
    this.masterKey = masterKey ?? crypto.randomBytes(32).toString("hex")
    this.privateKey = crypto.createHash("sha256").update(this.masterKey).digest()
  }

  getMasterKey(): string {
    return this.masterKey
  }

  getPrivateKey(): string {
    return this.privateKey.toString("hex")
  }

  encrypt(plainText: string): string {
    const t0 = performance.now()
    const iv = crypto.randomBytes(this.ivLength)
    const cipher = crypto.createCipheriv(this.algorithm, this.privateKey, iv)
    let encrypted = cipher.update(plainText, "utf8", "base64")
    encrypted += cipher.final("base64")
    // Prepend IV for use in decryption
    const ivBase64 = iv.toString("base64")
    const t1 = performance.now()
    // console.log(`Encryption took ${t1 - t0} milliseconds`)
    return ivBase64 + ":" + encrypted
  }

  decrypt(encryptedText: string): string {
    const t0 = performance.now()
    const [ivBase64, encrypted] = encryptedText.split(":")
    if (!ivBase64 || !encrypted) throw new Error("Invalid encrypted text format")
    const iv = Buffer.from(ivBase64, "base64")
    const decipher = crypto.createDecipheriv(this.algorithm, this.privateKey, iv)
    let decrypted = decipher.update(encrypted, "base64", "utf8")
    decrypted += decipher.final("utf8")
    const t1 = performance.now()
    // console.log(`Decryption took ${t1 - t0} milliseconds`)
    return decrypted
  }
}
