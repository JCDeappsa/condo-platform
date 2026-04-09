import { Sequelize } from 'sequelize';
import dns from 'dns';
import { env } from './env';

// Force IPv4 globally — Render free tier can't reach Supabase over IPv6
dns.setDefaultResultOrder('ipv4first');

export const sequelize = new Sequelize(env.databaseUrl, {
  dialect: 'postgres',
  logging: env.nodeEnv === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    ssl: { rejectUnauthorized: false },
    connectTimeout: 30000,
  },
});

export async function testConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('Base de datos conectada correctamente.');
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    throw error;
  }
}
