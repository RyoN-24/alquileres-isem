import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/auth/password'
import { localVisibleStorage } from '../src/storage/local-storage.service'

const prisma = new PrismaClient()

async function main() {
  const company = await prisma.company.upsert({
    where: { ruc: '20220199968' },
    update: {},
    create: {
      legalName: 'INDUSTRIAS Y SERVICIOS ELECTRO-MECANICOS SRL',
      ruc: '20220199968',
      country: 'Peru',
      timezone: 'America/Lima',
      baseCurrency: 'PEN',
    },
  })

  await prisma.user.upsert({
    where: { email: 'admin@isem.local' },
    update: {},
    create: {
      companyId: company.id,
      name: 'Administrador ISEM',
      email: 'admin@isem.local',
      passwordHash: await hashPassword('Admin12345!'),
      role: 'ADMIN',
    },
  })

  await prisma.user.upsert({
    where: { email: 'operativo@isem.local' },
    update: {},
    create: {
      companyId: company.id,
      name: 'Operativo ISEM',
      email: 'operativo@isem.local',
      passwordHash: await hashPassword('Operativo12345!'),
      role: 'OPERATIVO',
    },
  })

  const officialSites = ['Toquepala', 'Cuajone', 'Tacna', 'Lima', 'Otros']

  await Promise.all(
    officialSites.map((name) =>
      prisma.site.upsert({
        where: { id: `seed-${name.toLowerCase().replace(/\s+/g, '-')}` },
        update: { name, isActive: true },
        create: {
          id: `seed-${name.toLowerCase().replace(/\s+/g, '-')}`,
          companyId: company.id,
          name,
          isActive: true,
        },
      }),
    ),
  )

  await prisma.site.updateMany({
    where: {
      id: { in: ['seed-taller-central', 'seed-obra-norte', 'seed-obra-sur'] },
    },
    data: { isActive: false },
  })

  await Promise.all(
    ['Maquinaria pesada', 'Vehiculo liviano', 'Otro'].map((name) =>
      prisma.equipmentType.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  )

  await localVisibleStorage.ensureRoot()
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
