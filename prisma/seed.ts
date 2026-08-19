import { PrismaClient } from "@prisma/client";
import { demoNotifications } from "../mocks/demoNotifications";

const prisma = new PrismaClient();

async function main() {
  await prisma.demoNotification.deleteMany();

  await prisma.demoNotification.createMany({
    data: demoNotifications,
  });
}

main()
  .catch((error) => {
    console.error("Error seeding demo notifications", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
