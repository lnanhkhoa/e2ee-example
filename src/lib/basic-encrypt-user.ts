import { AES } from "./aes"
import crypto from "crypto"

export class BasicEncryptUser {
  aes: AES | null = null

  setAES(aes: AES) {
    this.aes = aes
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
      address: user.address ? this.aes.decrypt(user.address) : null,
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
      address: user.address ? this.aes.encrypt(user.address) : null,
    }
  }

  rsaEncryptFields(user: any, rsaPublicKey: string) {
    return {
      ...user,
      dateOfBirth: user.dateOfBirth
        ? crypto.publicEncrypt(rsaPublicKey, Buffer.from(user.dateOfBirth)).toString("base64")
        : null,
      salary: user.salary
        ? crypto.publicEncrypt(rsaPublicKey, Buffer.from(user.salary)).toString("base64")
        : null,
      phoneNumber: user.phoneNumber
        ? crypto.publicEncrypt(rsaPublicKey, Buffer.from(user.phoneNumber)).toString("base64")
        : null,
      address: user.address
        ? crypto.publicEncrypt(rsaPublicKey, Buffer.from(user.address)).toString("base64")
        : null,
    }
  }

  rsaDecryptFields(user: any, rsaPrivateKey: string) {
    return {
      ...user,
      dateOfBirth: user.dateOfBirth
        ? crypto.privateDecrypt(rsaPrivateKey, Buffer.from(user.dateOfBirth)).toString("base64")
        : null,
      salary: user.salary
        ? crypto.privateDecrypt(rsaPrivateKey, Buffer.from(user.salary)).toString("base64")
        : null,
      phoneNumber: user.phoneNumber
        ? crypto.privateDecrypt(rsaPrivateKey, Buffer.from(user.phoneNumber)).toString("base64")
        : null,
      address: user.address
        ? crypto.privateDecrypt(rsaPrivateKey, Buffer.from(user.address)).toString("base64")
        : null,
    }
  }
}
