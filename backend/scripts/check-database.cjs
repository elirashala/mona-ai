const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { PrismaService } = require('../dist/services/prisma.service');

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
    abortOnError: false,
  });
  try {
    const prisma = app.get(PrismaService);
    const result = await prisma.$queryRaw`
      SELECT current_database() AS database, current_user AS username,
             current_setting('server_version') AS version
    `;
    console.log('Database connectivity check passed:', result);
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error('Database connectivity check failed:', error.message);
  process.exitCode = 1;
});
