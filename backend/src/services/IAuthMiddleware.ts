
import { RequestHandler } from 'express';

/**
 * интерфейс middleware-а для авторизации по API-ключу
 * возвращает RequestHandler (req, res, next) => void
 */
export interface IAuthMiddleware {
  middleware: RequestHandler;
}
