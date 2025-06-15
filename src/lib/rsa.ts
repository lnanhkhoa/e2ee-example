export class RSA {
  publicKey?: CryptoKey
  privateKey?: CryptoKey

  async generateKeyPair() {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true, // extractable
      ["encrypt", "decrypt"],
    )

    this.publicKey = keyPair.publicKey
    this.privateKey = keyPair.privateKey
    return keyPair
  }

  async exportPublicKeyToPEM() {
    const spki = await window.crypto.subtle.exportKey("spki", this.publicKey!)
    const b64 = window.btoa(String.fromCharCode(...new Uint8Array(spki)))
    const pem = `-----BEGIN PUBLIC KEY-----\n${b64
      .match(/.{1,64}/g)
      ?.join("\n")}\n-----END PUBLIC KEY-----`

    return pem
  }

  async decryptWithPrivateKey(privateKey: CryptoKey, encryptedData: string): Promise<string> {
    // encryptedData is base64
    const encryptedBytes = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0))
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedBytes,
    )

    const decoder = new TextDecoder()
    return decoder.decode(decryptedBuffer)
  }
}
