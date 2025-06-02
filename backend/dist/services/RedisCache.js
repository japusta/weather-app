"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCache = void 0;
const redis_1 = require("redis");
class RedisCache {
    constructor(redisUrl) {
        this.client = (0, redis_1.createClient)({ url: redisUrl });
        this.client.on('error', (err) => console.error('Redis Error', err));
        // Подключаемся синхронно в конструкторе
        this.client.connect().catch((e) => console.error('Redis Connect Error', e));
    }
    async get(key) {
        const raw = await this.client.get(key);
        if (!raw)
            return null;
        try {
            return JSON.parse(raw);
        }
        catch (e) {
            console.warn('RedisCache: failed to parse JSON for key', key, e);
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        const str = JSON.stringify(value);
        // SET ключ с EX = ttlSeconds
        await this.client.set(key, str, { EX: ttlSeconds });
    }
}
exports.RedisCache = RedisCache;
