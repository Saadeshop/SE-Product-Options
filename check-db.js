import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkData() {
  const sets = await prisma.optionSet.findMany();
  console.log(JSON.stringify(sets, null, 2));
  process.exit(0);
}

checkData();
