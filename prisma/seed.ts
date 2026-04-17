import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { hashSync } from "bcryptjs";

function createPrisma() {
  const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

async function main() {
  const prisma = createPrisma();

  try {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Refusing to run seed script in production.");
    }

    const email = process.env.SEED_EMAIL;
    const password = process.env.SEED_PASSWORD;
    const name = process.env.SEED_NAME || "Admin";

    if (!email || !password) {
      throw new Error(
        "SEED_EMAIL and SEED_PASSWORD must be set to run the seed script."
      );
    }
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      console.log(`User ${email} already exists — skipping seed.`);
      return;
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashSync(password, 12),
        name,
        settings: {
          create: {},
        },
      },
    });

    console.log(`Created user: ${user.email} (id: ${user.id})`);
    console.log(`\nYou can now sign in at /login`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
