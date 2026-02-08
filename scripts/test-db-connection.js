/**
 * Quick test: can we connect to PostgreSQL with DATABASE_URL from .env?
 * Run: node scripts/test-db-connection.js
 */
const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    });
}
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Testing connection to:", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));
  try {
    await prisma.$connect();
    console.log("OK — Connected successfully.");
    const r = await prisma.$queryRaw`SELECT current_database(), current_user`;
    console.log("Database:", r[0]);
  } catch (e) {
    console.error("Connection failed:", e.message);
    if (e.code === "P1000") {
      console.error("\nP1000 = Invalid credentials. Check:");
      console.error("  1. Username and password in .env match your PostgreSQL server.");
      console.error("  2. If password has @ or #, it must be URL-encoded (@ → %40, # → %23).");
      console.error("  3. Try connecting with pgAdmin or: psql -U postgres -h localhost");
    }
  } finally {
    await prisma.$disconnect();
  }
}
main();
