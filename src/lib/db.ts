import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const prismaClientSingleton = () => {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.warn("[Prisma] DATABASE_URL not set");
        return new PrismaClient();
    }

    // Use PrismaPg adapter which satisfies the 'client' engine requirement
    // that seems enforced in this environment/version
    const pool = new pg.Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);

    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
};

export const db = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = db;
}

export default db;
