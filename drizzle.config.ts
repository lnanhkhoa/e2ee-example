// drizzle.config.ts
import { Config } from "drizzle-kit"

const config: Config = {
  schema: "./src/lib/db/schema.ts", // path to your schema file(s)
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! }
}

export default config
