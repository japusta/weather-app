"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryCache = void 0;
/**
 * in-memory реализация ICache
 * Хранит данные в объекте и очищает по TTL через setTimeout
 */
class MemoryCache {
    constructor() {
        this.store = new Map();
    }
    async get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            //удалить устаревшую запись
            this.store.delete(key);
            return null;
        }
        return entry.value;
    }
    async set(key, value, ttlSeconds) {
        const expiresAt = Date.now() + ttlSeconds * 1000;
        this.store.set(key, { value, expiresAt });
    }
}
exports.MemoryCache = MemoryCache;
