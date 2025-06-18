// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config()

export const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379/0"
export const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/e2ee"

export const AES_SECRET = process.env.AES_SECRET || "your_aes_secret_here"
export const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here"
export const KMS_KEY_ID = process.env.KMS_KEY_ID || "your_kms_key_id_here"
