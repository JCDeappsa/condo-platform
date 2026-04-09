import { Sequelize } from 'sequelize';
import { env } from './env';

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
    ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
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
