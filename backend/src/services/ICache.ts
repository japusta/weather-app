/**
 * ICache — минимальная абстракция для кэша (Redis или in-memory).
 * Кэш хранит объекты типа T по ключу (строкам) с TTL (в секундах).
 */
 export interface ICache<T> {
    /**
     * Получает значение из кэша по ключу.
     * Если нет (или просрочено), возвращает null.
     */
    get(key: string): Promise<T | null>;
  
    /**
     * Помещает в кэш (key → value) с TTL в секундах.
     */
    set(key: string, value: T, ttlSeconds: number): Promise<void>;
  }
  