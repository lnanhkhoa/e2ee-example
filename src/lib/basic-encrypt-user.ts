import { rsaInstance } from "@/utils/rsa-instance"
import { AES } from "./aes"

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

  async rsaEncryptFields(publicKeyPem: string, user: any) {
    return {
      ...user,
      dateOfBirth: user.dateOfBirth
        ? await rsaInstance.serverEncryptWithPublicKey(publicKeyPem, user.dateOfBirth)
        : null,
      salary: user.salary ? await rsaInstance.serverEncryptWithPublicKey(publicKeyPem, user.salary) : null,
      phoneNumber: user.phoneNumber
        ? await rsaInstance.serverEncryptWithPublicKey(publicKeyPem, user.phoneNumber)
        : null,
      address: user.address ? await rsaInstance.serverEncryptWithPublicKey(publicKeyPem, user.address) : null
    }
  }

  async rsaDecryptFields(privateKeyPem: string, user: any) {
    return {
      ...user,
      dateOfBirth: user.dateOfBirth ? await rsaInstance.decryptWithPrivateKey(privateKeyPem, user.dateOfBirth) : null,
      salary: user.salary ? await rsaInstance.decryptWithPrivateKey(privateKeyPem, user.salary) : null,
      phoneNumber: user.phoneNumber ? await rsaInstance.decryptWithPrivateKey(privateKeyPem, user.phoneNumber) : null,
      address: user.address ? await rsaInstance.decryptWithPrivateKey(privateKeyPem, user.address) : null
    }
  }
}
