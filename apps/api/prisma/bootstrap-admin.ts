import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";

class BootstrapConfigurationError extends Error {}

const prisma = new PrismaClient();

async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254
  ) {
    throw new BootstrapConfigurationError(
      "Configure a valid BOOTSTRAP_ADMIN_EMAIL in the hosting dashboard",
    );
  }
  if (
    !password ||
    password.length < 12 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    throw new BootstrapConfigurationError(
      "BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters and at most 72 UTF-8 bytes",
    );
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== UserRole.ADMIN) {
      throw new BootstrapConfigurationError(
        "Bootstrap email is already used by a non-admin account; choose a new email in the hosting dashboard",
      );
    }
    console.log("Admin account already exists; credentials unchanged");
    return;
  }
  await prisma.user.create({
    data: {
      email,
      name: "BrewLite Manager",
      role: UserRole.ADMIN,
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
  console.log("Initial administrator created; credentials were not logged");
}

main()
  .catch((error: unknown) => {
    // Never print the Prisma query/error object: it may contain credential data.
    console.error(
      error instanceof BootstrapConfigurationError
        ? error.message
        : "Administrator bootstrap failed",
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
