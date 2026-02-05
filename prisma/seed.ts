import { PrismaClient, PetSize } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const main = async (consoleMessage: () => void) => {
  // 1) WorkShift: Monday(1) -> Saturday(6) | Hours: 09:00 - 18:30
  for (let day = 1; day <= 6; day++) {
    await prisma.workShift.upsert({
      where: { dayOfWeek: day },
      update: { startTime: '09:00', endTime: '18:30', enabled: true },
      create: {
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '18:30',
        enabled: true,
      },
    });
  }

  // 2) Services
  const services = [
    { name: 'bano_simple' },
    { name: 'bano_medicado' },
    { name: 'bano_corte' },
    { name: 'desparacitacion' },
    { name: 'vacuna' },
  ];

  for (const s of services) {
    await prisma.service.upsert({
      where: { name: s.name },
      update: { enabled: true },
      create: { name: s.name, enabled: true },
    });
  }

  // 3) Duration rules (minutes)
  // simple/medicated bath: small=50, med=90, large=120
  // cut: small=30, med=40, large=60
  // vaccine: small=15, med=15, large=15
  const rules: Array<{ service: string; size: PetSize; minutes: number }> = [
    { service: 'bano_simple', size: 'SMALL', minutes: 60 },
    { service: 'bano_simple', size: 'MEDIUM', minutes: 60 },
    { service: 'bano_simple', size: 'LARGE', minutes: 120 },

    { service: 'bano_medicado', size: 'SMALL', minutes: 60 },
    { service: 'bano_medicado', size: 'MEDIUM', minutes: 60 },
    { service: 'bano_medicado', size: 'LARGE', minutes: 120 },

    { service: 'bano_corte', size: 'SMALL', minutes: 90 },
    { service: 'bano_corte', size: 'MEDIUM', minutes: 120 },
    { service: 'bano_corte', size: 'LARGE', minutes: 0 },

    { service: 'vacuna', size: 'SMALL', minutes: 15 },
    { service: 'vacuna', size: 'MEDIUM', minutes: 15 },
    { service: 'vacuna', size: 'LARGE', minutes: 15 },

    { service: 'desparacitacion', size: 'SMALL', minutes: 15 },
    { service: 'desparacitacion', size: 'MEDIUM', minutes: 15 },
    { service: 'desparacitacion', size: 'LARGE', minutes: 15 },
  ];

  const svc = await prisma.service.findMany({
    select: { id: true, name: true },
  });
  const svcByName = Object.fromEntries(svc.map((s) => [s.name, s.id]));

  for (const r of rules) {
    await prisma.durationRule.upsert({
      where: {
        serviceId_size: { serviceId: svcByName[r.service], size: r.size },
      },
      update: { minutes: r.minutes, enabled: true },
      create: {
        serviceId: svcByName[r.service],
        size: r.size,
        minutes: r.minutes,
        enabled: true,
      },
    });
  }

  // 4) Business Rules
  // BANO_CORTE: max 2 per day
  // LARGE: max 2 pets per day

  // First, try to find or create the service limit rule
  const serviceRule = await prisma.businessRule.findFirst({
    where: {
      ruleType: 'DAILY_SERVICE_LIMIT',
      serviceId: svcByName['bano_corte'],
      size: null,
    },
  });

  if (serviceRule) {
    await prisma.businessRule.update({
      where: { id: serviceRule.id },
      data: { maxPerDay: 2, enabled: true },
    });
  } else {
    await prisma.businessRule.create({
      data: {
        ruleType: 'DAILY_SERVICE_LIMIT',
        serviceId: svcByName['bano_corte'],
        maxPerDay: 2,
        enabled: true,
      },
    });
  }

  // Size limit rule
  const sizeRule = await prisma.businessRule.findFirst({
    where: {
      ruleType: 'DAILY_SIZE_LIMIT',
      serviceId: null,
      size: 'LARGE',
    },
  });

  if (sizeRule) {
    await prisma.businessRule.update({
      where: { id: sizeRule.id },
      data: { maxPerDay: 2, enabled: true },
    });
  } else {
    await prisma.businessRule.create({
      data: {
        ruleType: 'DAILY_SIZE_LIMIT',
        size: 'LARGE',
        maxPerDay: 2,
        enabled: true,
      },
    });
  }

  // Console message on seeding completion
  consoleMessage();
};

const consoleMessage = () => {
  console.log('\n');
  console.log(
    '╔════════════════════════════════════════════════════════════════╗'
  );
  console.log(
    '║                                                                ║'
  );
  console.log(
    '║              ✨  DATABASE SEEDING COMPLETED  ✨                ║'
  );
  console.log(
    '║                                                                ║'
  );
  console.log(
    '║  ✓ Work Shifts    → 6 days configured (Mon-Sat)                ║'
  );
  console.log(
    '║  ✓ Services       → 5 services created                         ║'
  );
  console.log(
    '║  ✓ Duration Rules → 15 rules configured                        ║'
  );
  console.log(
    '║  ✓ Business Rules → 2 rules configured                         ║'
  );
  console.log(
    '║                                                                ║'
  );
  console.log(
    '║              🚀  Ready to start scheduling!  🚀                ║'
  );
  console.log(
    '║                                                                ║'
  );
  console.log(
    '╚════════════════════════════════════════════════════════════════╝'
  );
  console.log('\n');
};

main(consoleMessage)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
