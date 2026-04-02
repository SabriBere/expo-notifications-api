import { PrismaClient } from "@prisma/client";
import { notificationsHistory } from "../mocks/mockUpsAlert";

const prisma = new PrismaClient();

async function main() {
  await prisma.alert.deleteMany();

  await prisma.alert.createMany({
    data: notificationsHistory,
  });
}

main()
  .catch((error) => {
    console.error("Error seeding alerts", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
