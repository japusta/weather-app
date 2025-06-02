// backend/src/services/RedisCache.ts

import { createClient, RedisClientType } from 'redis';
import { ICache } from './ICache';

export class RedisCache<T> implements ICache<T> {
  private client: RedisClientType;

  constructor(redisUrl: string) {
    // Создаём клиента
    this.client = createClient({ url: redisUrl });
    this.client.on('error', (err) => console.error('Redis Client Error', err));
    // подключаемся асинхронно
    this.client.connect().catch((err) => console.error('Redis Connect Error', err));
  }

  public async get(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) return null;
    // Парсим JSON
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  public async set(key: string, value: T, ttlSeconds: number): Promise<void> {
    const str = JSON.stringify(value);
    // Устанавливаем с TTL
    await this.client.set(key, str, { EX: ttlSeconds });
  }
}
