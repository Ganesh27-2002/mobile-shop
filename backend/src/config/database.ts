import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

// Load backend .env regardless of working directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // fallback

const dbName = process.env.DB_NAME || 'mobile_shop';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'postgres';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
const isProduction = process.env.NODE_ENV === 'production';

export const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'postgres',
  logging: isProduction ? false : (msg) => console.log(`[Sequelize] ${msg}`),
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
  },
});

export const authenticateDatabase = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    console.log(`Database connected successfully to PostgreSQL (${dbHost}:${dbPort}/${dbName})`);
    return true;
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown database connection error';
    console.error(`Database connection failed: ${errorMsg}`);
    return false;
  }
};
