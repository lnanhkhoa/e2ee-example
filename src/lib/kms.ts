// import { KMSClient } from "@aws-sdk/client-kms"

import { AES } from "@/lib/aes"
import { KMS_KEY_ID } from "@/utils/config"

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

class KMS {
  client: AES
  constructor() {
    this.client = new AES(KMS_KEY_ID)
    // this.client = new KMSClient({
    //   region: "us-east-1",
    //   credentials: {
    //     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    //   },
    // })
  }

  /**
   *  We assume that the data is encrypted by KMS in production
   */
  async encryptDataKey(rawData: string) {
    await sleep(500)
    return this.client.encrypt(rawData)
    // return this.client.encrypt({
    //   KeyId: KMS_KEY_ID,
    //   Plaintext: Buffer.from(""),
    // })
  }

  /**
   *  We assume that the data is encrypted by KMS in production
   */
  async decryptDataKey(ciphertext: string) {
    await sleep(500)
    return this.client.decrypt(ciphertext)
    // return this.client.decrypt({
    //   CiphertextBlob: Buffer.from(""),
    // })
  }
}

export default KMS
