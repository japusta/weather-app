// backend/src/controllers/WeatherController.ts
import { Express, Request, Response, NextFunction, Router } from 'express';
import { IAuthMiddleware } from '../services/IAuthMiddleware';
import { ICache } from '../services/ICache';
import { IGeoService } from '../services/IGeoService';
import { IWeatherApi } from '../services/IWeatherApi';
import { MemoryCache } from '../services/MemoryCache';
import { OpenMeteoGeoService } from '../services/OpenMeteoGeoService';
import { OpenMeteoWeatherService } from '../services/OpenMeteoWeatherService';
import { RedisCache } from '../services/RedisCache';
import { WeatherService } from '../services/WeatherService';

export class WeatherController {
  public readonly router = Router();
  private readonly geoService: IGeoService;
  private readonly weatherApi: IWeatherApi;
  private readonly cache: ICache<{ time: string[]; temperature_2m: number[] }>;
  private readonly weatherService: WeatherService;

  constructor(private auth: IAuthMiddleware) {
    this.geoService = new OpenMeteoGeoService();
    this.weatherApi = new OpenMeteoWeatherService();

    // Если Redis запускается на дефолтном порту 6379, то:
    // 1) либо в .env у вас REDIS_URL=redis://localhost:6379
    // 2) либо используем MemoryCache для быстрого теста без Redis
    //this.cache = new RedisCache<{ time: string[]; temperature_2m: number[] }>(process.env.REDIS_URL!);
    this.cache = new MemoryCache<{ time: string[]; temperature_2m: number[] }>();

    const ttl = parseInt(process.env.CACHE_TTL_SEC || '900', 10);
    this.weatherService = new WeatherService(this.geoService, this.weatherApi, this.cache, ttl);

    // **Очень важно**: здесь мы НЕ убираем auth.middleware!
    this.router.get(
      '/weather',
      this.auth.middleware,
      this.handleGetForecast.bind(this)
    );
  }

  private async handleGetForecast(req: Request, res: Response, next: NextFunction): Promise<void> {
    const city = (req.query.city as string)?.trim();
    if (!city) {
      res.status(400).json({ error: 'City is required' });
      return;
    }

    try {
      const result = await this.weatherService.getForecastByCity(city);
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  }

  public register(app: Express): void {
    // Префикс '/api' и затем '/weather'
    app.use('/api', this.router);
  }
}
