import { DATABASE_URL } from "@/utils/config"

import { drizzle } from "drizzle-orm/node-postgres"
export const db = drizzle(DATABASE_URL!)
