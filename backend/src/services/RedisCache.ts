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
    console.log(`[RedisCache] GET key="${key}"`);

    if (!data) {
      console.log(`[RedisCache] MISS for key="${key}"`);
      return null;
    }
    // Парсим JSON
    try {
      const parsed = JSON.parse(data) as T;
      console.log(`[RedisCache] HIT for key="${key}"`);
      return parsed;
    } catch {
      console.log(`[RedisCache] ERROR parsing data for key="${key}", returning null`);
      return null;
    }
  }

  public async set(key: string, value: T, ttlSeconds: number): Promise<void> {
    console.log(`[RedisCache] SET key="${key}" (ttl=${ttlSeconds}s)`);
    const str = JSON.stringify(value);
    await this.client.set(key, str, { EX: ttlSeconds });
  }
}
