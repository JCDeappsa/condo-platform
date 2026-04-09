import { Sequelize } from 'sequelize';
import dns from 'dns';
import { env } from './env';

// Force IPv4 globally — Render free tier can't reach Supabase over IPv6
dns.setDefaultResultOrder('ipv4first');

// Support both DATABASE_URL and individual DB_ env vars
const sequelizeOptions: any = {
  dialect: 'postgres' as const,
  logging: env.nodeEnv === 'development' ? console.log : false,
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  dialectOptions: {
    ssl: { rejectUnauthorized: false },
    connectTimeout: 30000,
  },
};

const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;

export const sequelize = dbHost
  ? new Sequelize(dbName || 'postgres', dbUser || 'postgres', dbPass || '', {
      ...sequelizeOptions,
      host: dbHost,
      port: parseInt(dbPort || '6543', 10),
    })
  : new Sequelize(env.databaseUrl, sequelizeOptions);

export async function testConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('Base de datos conectada correctamente.');
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    throw error;
  }
}
