import crypto from "crypto"
export class RSA {
  publicKey?: string
  privateKey?: string
  name = "RSA-OAEP"
  hash = "SHA-256"

  fromPem(pem: string) {
    const base64 = pem.replace(/\n/g, "").replace(/-----BEGIN.*?-----|-----END.*?-----/g, "")
    const binaryDer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    return binaryDer
  }

  toPem(buffer: ArrayBuffer, label: string) {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
    const lines = base64.match(/.{1,64}/g) || []
    return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`
  }

  async importPrivateKey(pem: string) {
    const privateKeyBuffer = this.fromPem(pem)
    const privateKey = await window.crypto.subtle.importKey(
      "pkcs8",
      privateKeyBuffer,
      { name: this.name, hash: this.hash },
      true,
      ["decrypt"]
    )
    this.privateKey = pem
    return privateKey
  }

  async generateKeyPair() {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: this.name,
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: this.hash
      },
      true, // extractable
      ["encrypt", "decrypt"]
    )

    const spki = await window.crypto.subtle.exportKey("spki", keyPair.publicKey)
    const pkcs8 = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey)

    const publicKeyPem = this.toPem(spki, "PUBLIC KEY")
    const privateKeyPem = this.toPem(pkcs8, "PRIVATE KEY")

    this.publicKey = publicKeyPem
    this.privateKey = privateKeyPem
    return publicKeyPem
  }

  async decryptWithPrivateKey(privateKeyPem: string, base64Encrypted: string): Promise<string | null> {
    if (!base64Encrypted) return null
    // convert pem to buffer
    const privateKey = await this.importPrivateKey(privateKeyPem)

    const encryptedBuffer = Uint8Array.from(atob(base64Encrypted), (c) => c.charCodeAt(0))
    const decrypted = await window.crypto.subtle.decrypt({ name: this.name }, privateKey, encryptedBuffer)
    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  }

  async serverEncryptWithPublicKey(publicKeyPem: string, rawData: string) {
    if (!publicKeyPem || !rawData) return null

    const encryptedData = crypto.publicEncrypt(
      {
        key: publicKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256"
      },
      Buffer.from(rawData)
    )
    return encryptedData.toString("base64")
  }
}
