import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { LocalVisibleStorageService } from '../src/storage/local-storage.service'
import { normalizeFolderName, supplierFolderName } from '../src/storage/path-utils'

describe('storage path helpers', () => {
  it('normalizes folder names for visible server folders', () => {
    expect(normalizeFolderName('Maquinarias Ándinas S.A.C.')).toBe('MAQUINARIAS-ANDINAS-S.A.C.')
    expect(supplierFolderName('20604578123', 'Maquinarias Ándinas S.A.C.')).toBe(
      '20604578123-MAQUINARIAS-ANDINAS-S.A.C.',
    )
  })

  it('creates the supplier, contract and valuation folder tree', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'isem-storage-'))
    const storage = new LocalVisibleStorageService(tempRoot)

    const valuationRoot = await storage.ensureValuationFolders({
      ruc: '20604578123',
      businessName: 'Maquinarias Andinas SAC',
      contractNumber: 'ISEM-2026-0001',
      valuationNumber: 'VAL-0001',
    })

    await expect(fs.stat(path.join(valuationRoot, 'valorizacion-proveedor'))).resolves.toBeTruthy()
    await expect(fs.stat(path.join(valuationRoot, 'factura'))).resolves.toBeTruthy()
    await expect(fs.stat(path.join(valuationRoot, 'comprobante-pago'))).resolves.toBeTruthy()
    await expect(fs.stat(path.join(valuationRoot, 'otros'))).resolves.toBeTruthy()
  })

  it('creates visible folders for an equipment file', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'isem-equipment-storage-'))
    const storage = new LocalVisibleStorageService(tempRoot)

    const equipmentRoot = await storage.ensureEquipmentFolders({
      ruc: '20604578123',
      businessName: 'Maquinarias Andinas SAC',
      code: 'EXC-320',
    })

    await expect(fs.stat(path.join(equipmentRoot, 'documentos'))).resolves.toBeTruthy()
    await expect(fs.stat(path.join(equipmentRoot, 'fotos'))).resolves.toBeTruthy()
  })
})
