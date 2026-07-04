import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3(
  { url: "file:prisma/dev.sqlite" },
  { timestampFormat: "unixepoch-ms" }
);
const prisma = new PrismaClient({ adapter });

async function checkData() {
  const sets = await prisma.optionSet.findMany();
  console.log(JSON.stringify(sets, null, 2));
  process.exit(0);
}

checkData();
