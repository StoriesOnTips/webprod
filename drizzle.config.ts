import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import * as dotenv  from 'dotenv'


dotenv.config({
    path: './.env.local'
})
if (typeof process.env.DATABASE_URL !== 'string' || !process.env.DATABASE_URL.trim()) {
    throw new Error('please set your database url')
}

export default defineConfig({
  out: './drizzle',
  schema: './config/schema.tsx',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});