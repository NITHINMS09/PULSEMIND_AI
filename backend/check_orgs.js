const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const orgs = await prisma.organization.findMany();
    console.log('Orgs:', JSON.stringify(orgs, null, 2));
    const teams = await prisma.team.findMany();
    console.log('Teams Org IDs:', teams.map(t => t.organizationId));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
