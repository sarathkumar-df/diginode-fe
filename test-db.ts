import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    try {
        console.log("Setting up adapter...");
        const connectionString = process.env.DATABASE_URL;
        const pool = new pg.Pool({ connectionString });
        const adapter = new PrismaPg(pool);

        console.log("Initializing Prisma Client with adapter...");
        const prisma = new PrismaClient({ adapter });

        console.log("Attempting to connect...");
        const userCount = await prisma.user.count();
        console.log(`Connection successful! Found ${userCount} users.`);

        await prisma.$disconnect();
        await pool.end();
    } catch (error) {
        console.error("Connection failed:", error);
        process.exit(1);
    }
}

main();
