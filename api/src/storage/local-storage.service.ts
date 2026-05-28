import fs from 'node:fs/promises'
import path from 'node:path'
import { normalizeFolderName, supplierFolderName } from './path-utils'

export type SupplierFolderInput = {
  ruc: string
  businessName: string
}

export type ContractFolderInput = SupplierFolderInput & {
  contractNumber: string
}

export type EquipmentFolderInput = SupplierFolderInput & {
  code: string
}

export type ValuationFolderInput = ContractFolderInput & {
  valuationNumber: string
}

export class LocalVisibleStorageService {
  constructor(private readonly rootPath = process.env.LOCAL_STORAGE_ROOT ?? 'E:/ISEM_ARCHIVOS') {}

  getRootPath() {
    return path.resolve(this.rootPath)
  }

  async ensureRoot() {
    await fs.mkdir(this.getRootPath(), { recursive: true })
    return this.getRootPath()
  }

  async ensureSupplierFolders(input: SupplierFolderInput) {
    const supplierRoot = path.join(
      await this.ensureRoot(),
      'proveedores',
      supplierFolderName(input.ruc, input.businessName),
    )

    await Promise.all([
      fs.mkdir(path.join(supplierRoot, 'ficha'), { recursive: true }),
      fs.mkdir(path.join(supplierRoot, 'contratos'), { recursive: true }),
      fs.mkdir(path.join(supplierRoot, 'equipos'), { recursive: true }),
    ])

    return supplierRoot
  }

  async ensureEquipmentFolders(input: EquipmentFolderInput) {
    const supplierRoot = await this.ensureSupplierFolders(input)
    const equipmentRoot = path.join(supplierRoot, 'equipos', normalizeFolderName(input.code))

    await Promise.all([
      fs.mkdir(path.join(equipmentRoot, 'documentos'), { recursive: true }),
      fs.mkdir(path.join(equipmentRoot, 'fotos'), { recursive: true }),
    ])

    return equipmentRoot
  }

  async ensureContractFolders(input: ContractFolderInput) {
    const supplierRoot = await this.ensureSupplierFolders(input)
    const contractRoot = path.join(
      supplierRoot,
      'contratos',
      normalizeFolderName(input.contractNumber),
    )

    await Promise.all([
      fs.mkdir(path.join(contractRoot, 'contrato'), { recursive: true }),
      fs.mkdir(path.join(contractRoot, 'orden-servicio'), { recursive: true }),
      fs.mkdir(path.join(contractRoot, 'valorizaciones'), { recursive: true }),
    ])

    return contractRoot
  }

  async ensureValuationFolders(input: ValuationFolderInput) {
    const contractRoot = await this.ensureContractFolders(input)
    const valuationRoot = path.join(
      contractRoot,
      'valorizaciones',
      normalizeFolderName(input.valuationNumber),
    )

    await Promise.all([
      fs.mkdir(path.join(valuationRoot, 'valorizacion-proveedor'), { recursive: true }),
      fs.mkdir(path.join(valuationRoot, 'factura'), { recursive: true }),
      fs.mkdir(path.join(valuationRoot, 'comprobante-pago'), { recursive: true }),
      fs.mkdir(path.join(valuationRoot, 'otros'), { recursive: true }),
    ])

    return valuationRoot
  }

  async saveUploadedFile(input: {
    tempPath: string
    destinationFolder: string
    originalName: string
  }) {
    await fs.mkdir(input.destinationFolder, { recursive: true })
    const parsed = path.parse(input.originalName)
    const safeBaseName = normalizeFolderName(parsed.name) || 'ARCHIVO'
    const extension = parsed.ext.toLowerCase()
    const fileName = `${safeBaseName}-${Date.now()}${extension}`
    const destinationPath = path.join(input.destinationFolder, fileName)

    await fs.copyFile(input.tempPath, destinationPath)
    await fs.unlink(input.tempPath).catch(() => undefined)

    return destinationPath
  }
}

export const localVisibleStorage = new LocalVisibleStorageService()
