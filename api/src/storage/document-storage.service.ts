import fs from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env'
import { HttpError } from '../http/errors'
import { localVisibleStorage } from './local-storage.service'
import { normalizeFolderName } from './path-utils'
import type {
  ContractFolderInput,
  EquipmentFolderInput,
  SupplierFolderInput,
  ValuationFolderInput,
} from './local-storage.service'

type SaveUploadedFileInput = {
  tempPath: string
  destinationFolder: string
  originalName: string
  mimeType?: string
}

type SaveBufferInput = {
  buffer: Buffer
  destinationFolder: string
  fileName: string
  mimeType: string
}

function toStorageKey(value: string) {
  return value
    .replace(/\\/g, '/')
    .split('/')
    .map((part) => normalizeFolderName(part) || part)
    .filter(Boolean)
    .join('/')
}

function fileNameFor(originalName: string) {
  const parsed = path.parse(originalName)
  const safeBaseName = normalizeFolderName(parsed.name) || 'ARCHIVO'
  const extension = parsed.ext.toLowerCase()
  return `${safeBaseName}-${Date.now()}${extension}`
}

class DocumentStorageService {
  private supabase =
    env.FILE_STORAGE_MODE === 'CLOUD_STORAGE'
      ? createClient(env.SUPABASE_URL ?? '', env.SUPABASE_SERVICE_ROLE_KEY ?? '')
      : null

  isCloudStorage() {
    return env.FILE_STORAGE_MODE === 'CLOUD_STORAGE'
  }

  async ensureRoot() {
    if (!this.isCloudStorage()) return localVisibleStorage.ensureRoot()
    return env.SUPABASE_STORAGE_BUCKET
  }

  async ensureSupplierFolders(input: SupplierFolderInput) {
    if (!this.isCloudStorage()) return localVisibleStorage.ensureSupplierFolders(input)
    return toStorageKey(`proveedores/${input.ruc}-${input.businessName}`)
  }

  async ensureEquipmentFolders(input: EquipmentFolderInput) {
    if (!this.isCloudStorage()) return localVisibleStorage.ensureEquipmentFolders(input)
    const supplierRoot = await this.ensureSupplierFolders(input)
    return toStorageKey(`${supplierRoot}/equipos/${input.code}`)
  }

  async ensureContractFolders(input: ContractFolderInput) {
    if (!this.isCloudStorage()) return localVisibleStorage.ensureContractFolders(input)
    const supplierRoot = await this.ensureSupplierFolders(input)
    return toStorageKey(`${supplierRoot}/contratos/${input.contractNumber}`)
  }

  async ensureValuationFolders(input: ValuationFolderInput) {
    if (!this.isCloudStorage()) return localVisibleStorage.ensureValuationFolders(input)
    const contractRoot = await this.ensureContractFolders(input)
    return toStorageKey(`${contractRoot}/valorizaciones/${input.valuationNumber}`)
  }

  async saveUploadedFile(input: SaveUploadedFileInput) {
    if (!this.isCloudStorage()) {
      return localVisibleStorage.saveUploadedFile(input)
    }

    const fileName = fileNameFor(input.originalName)
    const storagePath = toStorageKey(`${input.destinationFolder}/${fileName}`)
    const content = await fs.readFile(input.tempPath)
    await fs.unlink(input.tempPath).catch(() => undefined)
    await this.uploadBuffer(storagePath, content, input.mimeType)
    return storagePath
  }

  async saveBuffer(input: SaveBufferInput) {
    const storagePath = this.isCloudStorage()
      ? toStorageKey(`${input.destinationFolder}/${input.fileName}`)
      : path.join(input.destinationFolder, input.fileName)

    if (!this.isCloudStorage()) {
      await fs.mkdir(input.destinationFolder, { recursive: true })
      await fs.writeFile(storagePath, input.buffer)
      return storagePath
    }

    await this.uploadBuffer(storagePath, input.buffer, input.mimeType)
    return storagePath
  }

  async getDownloadTarget(storagePath: string) {
    if (!this.isCloudStorage()) {
      await fs.access(storagePath)
      return { type: 'local' as const, path: storagePath }
    }

    if (!this.supabase) {
      throw new HttpError(500, 'SUPABASE_NOT_CONFIGURED', 'Supabase Storage no esta configurado')
    }

    const { data, error } = await this.supabase.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .createSignedUrl(storagePath, 60)

    if (error || !data?.signedUrl) {
      throw new HttpError(404, 'ATTACHMENT_FILE_NOT_FOUND', 'El archivo ya no existe en Supabase Storage')
    }

    return { type: 'signed-url' as const, url: data.signedUrl }
  }

  async deleteFile(storagePath: string) {
    if (!this.isCloudStorage()) {
      await fs.unlink(storagePath).catch(() => undefined)
      return
    }

    if (!this.supabase) {
      throw new HttpError(500, 'SUPABASE_NOT_CONFIGURED', 'Supabase Storage no esta configurado')
    }

    const { error } = await this.supabase.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .remove([storagePath])

    if (error) {
      throw new HttpError(500, 'SUPABASE_DELETE_FAILED', `No se pudo eliminar el archivo anterior en Supabase: ${error.message}`)
    }
  }

  createReadStream(storagePath: string) {
    return createReadStream(storagePath)
  }

  private async uploadBuffer(storagePath: string, buffer: Buffer, mimeType = 'application/octet-stream') {
    if (!this.supabase) {
      throw new HttpError(500, 'SUPABASE_NOT_CONFIGURED', 'Supabase Storage no esta configurado')
    }

    const { error } = await this.supabase.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      })

    if (error) {
      throw new HttpError(500, 'SUPABASE_UPLOAD_FAILED', `No se pudo guardar el archivo en Supabase: ${error.message}`)
    }
  }
}

export const documentStorage = new DocumentStorageService()
