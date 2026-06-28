import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless';
import pkg from 'pg';
const { Pool: PgPool } = pkg;
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isNeon = process.env.DATABASE_URL.includes("neon.tech");

export const pool = isNeon
  ? new NeonPool({ connectionString: process.env.DATABASE_URL })
  : new PgPool({ connectionString: process.env.DATABASE_URL });

if (isNeon) {
  neonConfig.webSocketConstructor = ws;
}

export const db = isNeon
  ? neonDrizzle({ client: pool as NeonPool, schema })
  : pgDrizzle({ client: pool as any, schema });