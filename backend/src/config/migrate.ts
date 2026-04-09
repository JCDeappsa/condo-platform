import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import fs from 'fs';
import path from 'path';
import { sequelize } from './database';

async function migrate(): Promise<void> {
  const migrationsDir = path.join(__dirname, '..', 'migrations');

  // Create migrations tracking table if not exists
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const [existing] = await sequelize.query(
      'SELECT name FROM _migrations WHERE name = $1',
      { bind: [file] }
    );

    if ((existing as any[]).length > 0) {
      console.log(`Ya ejecutada: ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    console.log(`Ejecutando migración: ${file}`);

    await sequelize.query(sql);
    await sequelize.query(
      'INSERT INTO _migrations (name) VALUES ($1)',
      { bind: [file] }
    );

    console.log(`Completada: ${file}`);
  }

  console.log('Todas las migraciones ejecutadas.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Error en migración:', err);
  process.exit(1);
});
