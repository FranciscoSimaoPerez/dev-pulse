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
    const email = process.env.SEED_EMAIL || "admin@devpulse.local";
    const password = process.env.SEED_PASSWORD || "devpulse123";
    const name = process.env.SEED_NAME || "Admin";

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
    console.log(`Password: ${password}`);
    console.log(`\nYou can now sign in at /login`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
