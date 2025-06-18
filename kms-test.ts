// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config()

import { KMSClient, GenerateDataKeyCommand, DecryptCommand, EncryptCommand } from "@aws-sdk/client-kms"

async function generateDataKey() {
  const client = new KMSClient({
    region: "ap-southeast-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
  })
  const command = new GenerateDataKeyCommand({ KeyId: process.env.KMS_KEY_ID!, KeySpec: "AES_256" })
  const response = await client.send(command)
  if (!response.Plaintext || !response.CiphertextBlob) throw new Error("Failed to generate data key")
  console.log(Buffer.from(response.Plaintext).toString("base64"))
  console.log(Buffer.from(response.CiphertextBlob).toString("base64"))
  // console.log("Key ID:", response)
}

async function encryptExample() {
  const plainText = "Hello World"
  const client = new KMSClient({
    region: "ap-southeast-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
  })

  const t0 = performance.now()

  const response = await client.send(
    new EncryptCommand({ KeyId: process.env.KMS_KEY_ID!, Plaintext: Buffer.from(plainText) })
  )
  if (!response.CiphertextBlob) throw new Error("Failed to encrypt data")
  const encryptedText = Buffer.from(response.CiphertextBlob).toString("base64")
  console.log("Encrypted Text:", encryptedText)

  const t1 = performance.now()
  console.log(`Encryption took ${t1 - t0} milliseconds`)

  const decryptedResponse = await client.send(
    new DecryptCommand({ CiphertextBlob: Buffer.from(encryptedText, "base64") })
  )
  if (!decryptedResponse.Plaintext) throw new Error("Failed to decrypt data")
  console.log("Decrypted Text:", Buffer.from(decryptedResponse.Plaintext).toString("utf-8"))

  const t2 = performance.now()
  console.log(`Decryption took ${t2 - t1} milliseconds`)
}

// encryptExample();

async function multiRequestsExample() {
  const client = new KMSClient({
    region: "ap-southeast-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
  })

  const t0 = performance.now()

  const requests = Array.from(
    { length: 1000 },
    () => new EncryptCommand({ KeyId: process.env.KMS_KEY_ID!, Plaintext: Buffer.from("Hello World") })
  )
  const responses = await Promise.all(requests.map((request) => client.send(request)))
  const t1 = performance.now()
  console.log(`Multi requests took ${t1 - t0} milliseconds`)

  const decryptRequests = responses.map((response) => new DecryptCommand({ CiphertextBlob: response.CiphertextBlob }))
  const decryptedResponses = await Promise.all(decryptRequests.map((request) => client.send(request)))
  const t2 = performance.now()
  console.log(`Multi decrypt took ${t2 - t1} milliseconds`)
}

multiRequestsExample()
