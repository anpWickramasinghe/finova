import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

async function test() {
  const dbUrl = process.env.DATABASE_URL;
  console.log("URL:", dbUrl);
  const dbName = dbUrl.split("/").pop()?.split("?")[0];
  console.log("DB Name:", dbName);
  
  const postgresUrl = dbUrl.replace(`/${dbName}`, "/postgres");
  console.log("Postgres URL:", postgresUrl);

  const tempPool = new pg.Pool({
    connectionString: postgresUrl,
  });

  try {
    const res = await tempPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );
    console.log("Exists:", res.rowCount > 0);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await tempPool.end();
  }
}

test();
