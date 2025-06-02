"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyAuth = void 0;
class ApiKeyAuth {
    constructor() {
        // обрезаемпробелы и невидимые символы
        this.key = (process.env.API_KEY || '').trim();
    }
    /** middleware для проверки x-api-key */
    get middleware() {
        return (req, res, next) => {
            //читаем заголовок и обрежем лишние пробелы
            const incoming = req.header('x-api-key')?.trim() || '';
            console.log('Incoming x-api-key:', `"${incoming}"`);
            // cравниваем  строки
            if (incoming !== this.key) {
                console.log('API key mismatch (expected:', `"${this.key}"`, 'got:', `"${incoming}"`);
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            next();
        };
    }
}
exports.ApiKeyAuth = ApiKeyAuth;
