import dotenv from 'dotenv';
dotenv.config();

function get(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) return '';
  return value;
}

export const env = {
  nodeEnv: get('NODE_ENV', 'development'),
  port: parseInt(get('PORT', '4000'), 10),
  databaseUrl: get('DATABASE_URL'),
  jwtSecret: get('JWT_SECRET'),
  jwtRefreshSecret: get('JWT_REFRESH_SECRET'),
  encryptionKey: get('ENCRYPTION_KEY'),
  frontendUrl: get('FRONTEND_URL', 'http://localhost:5173'),
  jwtAccessExpiry: '15m',
  jwtRefreshExpiry: '30d',
  isDev: get('NODE_ENV', 'development') === 'development',
};

export function validateEnv(): void {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'ENCRYPTION_KEY',
  ] as const;

  const missing = required.filter((k) => !process.env[k]);

  if (missing.length > 0) {
    console.error('\n❌ Variabili d\'ambiente mancanti:');
    missing.forEach((k) => console.error(`   - ${k}`));
    console.error('\nConfigura queste variabili nella dashboard del tuo servizio di hosting.\n');
    process.exit(1);
  }

  if (env.encryptionKey.length < 32) {
    console.error('❌ ENCRYPTION_KEY deve essere di almeno 32 caratteri');
    process.exit(1);
  }
}
