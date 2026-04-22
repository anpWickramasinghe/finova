import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./index.js";
import path from "path";
import pg from "pg";

async function ensureDatabaseExists() {
  const dbName = process.env.DATABASE_URL!.split("/").pop()?.split("?")[0];
  if (!dbName) return;

  // Create a temporary connection to 'postgres' database to check/create the target DB
  const tempPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL!.replace(`/${dbName}`, "/postgres"),
  });

  try {
    const res = await tempPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (res.rowCount === 0) {
      console.log(`📡 Database "${dbName}" does not exist. Creating...`);
      // CREATE DATABASE cannot be run in a transaction, and pg doesn't allow it with params sometimes
      await tempPool.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created.`);
    }
  } catch (error) {
    console.error("❌ Error checking/creating database:", error);
  } finally {
    await tempPool.end();
  }
}

export async function initializeDatabase() {
  await ensureDatabaseExists();
  
  console.log("⏳ Initializing database schema...");
  try {
    await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
    console.log("✅ Database schema initialized successfully.");
  } catch (error) {
    console.error("❌ Error initializing database schema:", error);
    throw error;
  }
}
