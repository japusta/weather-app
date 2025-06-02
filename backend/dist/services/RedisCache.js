"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCache = void 0;
const redis_1 = require("redis");
class RedisCache {
    constructor(redisUrl) {
        // Создаём клиента
        this.client = (0, redis_1.createClient)({ url: redisUrl });
        this.client.on('error', (err) => console.error('Redis Client Error', err));
        // подключаемся асинхронно
        this.client.connect().catch((err) => console.error('Redis Connect Error', err));
    }
    async get(key) {
        const data = await this.client.get(key);
        console.log(`[RedisCache] GET key="${key}"`);
        if (!data) {
            console.log(`[RedisCache] MISS for key="${key}"`);
            return null;
        }
        // Парсим JSON
        try {
            const parsed = JSON.parse(data);
            console.log(`[RedisCache] HIT for key="${key}"`);
            return parsed;
        }
        catch {
            console.log(`[RedisCache] ERROR parsing data for key="${key}", returning null`);
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        console.log(`[RedisCache] SET key="${key}" (ttl=${ttlSeconds}s)`);
        const str = JSON.stringify(value);
        await this.client.set(key, str, { EX: ttlSeconds });
    }
}
exports.RedisCache = RedisCache;
