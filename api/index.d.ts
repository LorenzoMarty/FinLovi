import * as express_serve_static_core from 'express-serve-static-core';

declare const app: express_serve_static_core.Express;

declare const env: {
    AUTH_ENABLED: boolean;
    NODE_ENV: string;
    PORT: number;
    DB_HOST: string;
    DB_PORT: number;
    DB_NAME: string;
    DB_USER: string;
    DB_PASS: string;
    WEB_ORIGIN: string;
    RATE_LIMIT_WINDOW: number;
    RATE_LIMIT_MAX: number;
    AUTH_EMAIL?: string | undefined;
    AUTH_PASSWORD?: string | undefined;
    JWT_SECRET?: string | undefined;
    JWT_REFRESH_SECRET?: string | undefined;
};

export { app, env };
