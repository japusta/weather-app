// backend/src/services/ApiKeyAuth.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';

export class ApiKeyAuth {
  // Сразу «обрезаем» пробелы и невидимые символы
  private key = (process.env.API_KEY || '').trim();

  /** middleware для проверки x-api-key */
  public get middleware(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Прочитаем заголовок и сразу тоже «обрежем» лишние пробелы
      const incoming = req.header('x-api-key')?.trim() || '';

      console.log('👉 Incoming x-api-key:', `"${incoming}"`);

      // Сравниваем уже «чистые» строки
      if (incoming !== this.key) {
        console.log('   ❌ API key mismatch (expected:', `"${this.key}"`, 'got:', `"${incoming}"`) ;
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      next();
    };
  }
}
