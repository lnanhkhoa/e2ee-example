import { REDIS_URL } from "@/utils/config"
import IORedis from "ioredis"

export class Cache {
  client: IORedis
  constructor() {
    this.client = new IORedis(REDIS_URL)
    this.client.on("error", (err) => {
      console.error("Redis error:", err)
    })
  }

  async get(key: string) {
    return this.client.get(key)
  }

  async set(key: string, value: string) {
    return this.client.set(key, value)
  }

  async del(key: string) {
    return this.client.del(key)
  }

  async flush() {
    return this.client.flushdb()
  }
}
