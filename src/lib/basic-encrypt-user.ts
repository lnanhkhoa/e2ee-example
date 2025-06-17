import { rsaInstance } from "@/utils/rsa-instance"
import { AES } from "./aes"

export class BasicEncryptUser {
  aes: AES | null = null

  constructor(aes?: AES) {
    if (aes) {
      this.aes = aes
    }
  }

  decodeSensitiveFields(user: any) {
    if (!this.aes) {
      throw new Error("AES instance not initialized")
    }
    return {
      ...user,
      dateOfBirth: user.dateOfBirth ? this.aes.decrypt(user.dateOfBirth) : null,
      salary: user.salary ? this.aes.decrypt(user.salary) : null,
      phoneNumber: user.phoneNumber ? this.aes.decrypt(user.phoneNumber) : null,
      address: user.address ? this.aes.decrypt(user.address) : null
    }
  }

  encodeSensitiveFields(user: any) {
    if (!this.aes) {
      throw new Error("AES instance not initialized")
    }

    return {
      ...user,
      dateOfBirth: user.dateOfBirth ? this.aes.encrypt(user.dateOfBirth) : null,
      salary: user.salary ? this.aes.encrypt(user.salary) : null,
      phoneNumber: user.phoneNumber ? this.aes.encrypt(user.phoneNumber) : null,
      address: user.address ? this.aes.encrypt(user.address) : null
    }
  }
}
