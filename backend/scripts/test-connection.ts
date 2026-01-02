import { db } from "../config/db.js";
import { sql } from "drizzle-orm";

async function main() {
    try {
        console.log("Testing database connection...");
        const result = await db.execute(sql`SELECT NOW()`);
        console.log("Connection successful:", result.rows[0]);
        process.exit(0);
    } catch (error) {
        console.error("Connection failed:", error);
        process.exit(1);
    }
}

main();
