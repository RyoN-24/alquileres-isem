import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/auth/password'
import { DEFAULT_CONTRACT_TEMPLATE } from '../src/settings/contract-template'
import { documentStorage } from '../src/storage/document-storage.service'

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

  const contractTemplate = await prisma.appSetting.findUnique({ where: { key: 'contracts.template' } })
  const shouldRefreshLegacyTemplate =
    !contractTemplate ||
    (
      contractTemplate.value.includes('Conste por el presente documento el contrato de servicio de alquiler que celebran') &&
      !contractTemplate.value.includes('RESPONSABILIDAD OPERATIVA')
    ) ||
    (
      contractTemplate.value.includes('RESPONSABILIDAD OPERATIVA') &&
      contractTemplate.value.includes('Vehiculo') &&
      contractTemplate.value.includes('terminos pactados')
    )

  if (shouldRefreshLegacyTemplate) {
    await prisma.appSetting.upsert({
      where: { key: 'contracts.template' },
      update: { value: DEFAULT_CONTRACT_TEMPLATE },
      create: { key: 'contracts.template', value: DEFAULT_CONTRACT_TEMPLATE },
    })
  }

  await documentStorage.ensureRoot()
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
