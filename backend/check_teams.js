const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const count = await prisma.team.count();
    console.log('Team count:', count);
    const teams = await prisma.team.findMany();
    console.log('Teams:', JSON.stringify(teams, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
