import { AES } from "@/lib/aes"
import KMS from "./kms"
import { Cache } from "./redis"
import { db } from "./db"
import { aes_keys, takeUniqueOrThrow } from "./db/schema"
import { BasicEncryptUser } from "./basic-encrypt-user"

export class EncryptUser extends BasicEncryptUser {
  async init() {
    const kms = new KMS()
    const cache = new Cache()
    const aesKey = await db.select().from(aes_keys).limit(1).then(takeUniqueOrThrow)
    const encryptedKey = aesKey.encryptedKey
    if (!encryptedKey) throw new Error("AES key not found")
    let encryptKey = await cache.get(encryptedKey)

    if (!encryptKey) {
      const masterKey = await kms.decryptDataKey(encryptedKey)
      await cache.set(encryptedKey, masterKey)
      encryptKey = masterKey
    }
    this.aes = new AES(encryptKey)
  }
}
