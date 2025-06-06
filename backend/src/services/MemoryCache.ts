import { ICache } from './ICache';

/**
 * in-memory реализация ICache
 * Хранит данные в объекте и очищает по TTL через setTimeout
 */
export class MemoryCache<T> implements ICache<T> {
  private store = new Map<string, { value: T; expiresAt: number }>();

  public async get(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      //удалить устаревшую запись
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  public async set(key: string, value: T, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }
}
