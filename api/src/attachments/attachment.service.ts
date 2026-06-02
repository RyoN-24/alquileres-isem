import path from 'node:path'
import { AttachmentEntityType } from '@prisma/client'
import { prisma } from '../db/prisma'
import { HttpError } from '../http/errors'
import { documentStorage } from '../storage/document-storage.service'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])

type UploadAttachmentInput = {
  entityType: AttachmentEntityType
  entityId: string
  category: string
  file: Express.Multer.File
  userId?: string
}

function normalizeCategory(category: string) {
  return category.trim().toUpperCase()
}

async function resolveDestination(input: {
  entityType: AttachmentEntityType
  entityId: string
  category: string
}) {
  if (input.entityType === 'INVOICE' || input.entityType === 'PAYMENT') {
    const invoice = await prisma.invoice.findUnique({
      where: { id: input.entityId },
      include: { supplier: true, valuation: true },
    })
    if (!invoice?.folderPath) {
      throw new HttpError(404, 'INVOICE_FOLDER_NOT_FOUND', 'No se encontro la carpeta de la factura')
    }

    const category = normalizeCategory(input.category)
    const subfolder =
      category === 'FACTURA'
        ? 'factura'
        : category === 'VALORIZACION_PROVEEDOR'
          ? 'valorizacion-proveedor'
          : category === 'COMPROBANTE_PAGO'
            ? 'comprobante-pago'
            : 'otros'

    return {
      folder: path.join(invoice.folderPath, subfolder),
      supplierId: invoice.supplierId,
      relatedEntityId: invoice.id,
    }
  }

  if (input.entityType === 'VALUATION') {
    const valuation = await prisma.valuation.findUnique({
      where: { id: input.entityId },
      include: { contract: true },
    })
    if (!valuation?.folderPath) {
      throw new HttpError(404, 'VALUATION_FOLDER_NOT_FOUND', 'No se encontro la carpeta de la valorizacion')
    }

    return {
      folder: path.join(valuation.folderPath, 'valorizacion-proveedor'),
      supplierId: undefined,
      relatedEntityId: valuation.id,
    }
  }

  if (input.entityType === 'EQUIPMENT') {
    const equipment = await prisma.equipment.findUnique({ where: { id: input.entityId } })
    if (!equipment?.folderPath) {
      throw new HttpError(404, 'EQUIPMENT_FOLDER_NOT_FOUND', 'No se encontro la carpeta del equipo')
    }

    const subfolder = normalizeCategory(input.category) === 'FOTO' ? 'fotos' : 'documentos'
    return {
      folder: path.join(equipment.folderPath, subfolder),
      supplierId: equipment.supplierId,
      relatedEntityId: equipment.id,
    }
  }

  if (input.entityType === 'CONTRACT') {
    const contract = await prisma.contract.findUnique({ where: { id: input.entityId } })
    if (!contract?.folderPath) {
      throw new HttpError(404, 'CONTRACT_FOLDER_NOT_FOUND', 'No se encontro la carpeta del contrato')
    }

    const category = normalizeCategory(input.category)
    const subfolder = category === 'ORDEN_SERVICIO' ? 'orden-servicio' : 'contrato'
    return {
      folder: path.join(contract.folderPath, subfolder),
      supplierId: contract.supplierId,
      relatedEntityId: contract.id,
    }
  }

  const supplier = await prisma.supplier.findUnique({ where: { id: input.entityId } })
  if (!supplier?.folderPath) {
    throw new HttpError(404, 'SUPPLIER_FOLDER_NOT_FOUND', 'No se encontro la carpeta del proveedor')
  }

  return {
    folder: path.join(supplier.folderPath, 'ficha'),
    supplierId: supplier.id,
    relatedEntityId: supplier.id,
  }
}

export async function uploadAttachment(input: UploadAttachmentInput) {
  const category = normalizeCategory(input.category)
  if (!allowedMimeTypes.has(input.file.mimetype)) {
    throw new HttpError(422, 'INVALID_FILE_TYPE', 'Solo se permiten PDF o imagenes')
  }

  if (input.file.size > MAX_FILE_SIZE_BYTES) {
    throw new HttpError(422, 'FILE_TOO_LARGE', 'El archivo no debe superar 10 MB')
  }

  const destination = await resolveDestination(input)
  const latestAttachment = await prisma.attachment.findFirst({
    where: {
      entityType: input.entityType,
      entityId: destination.relatedEntityId,
      category,
    },
    orderBy: { version: 'desc' },
  })
  const version = (latestAttachment?.version ?? 0) + 1
  const storagePath = await documentStorage.saveUploadedFile({
    tempPath: input.file.path,
    destinationFolder: destination.folder,
    originalName: input.file.originalname,
    mimeType: input.file.mimetype,
  })

  const attachment = await prisma.attachment.create({
    data: {
      entityType: input.entityType,
      entityId: destination.relatedEntityId,
      supplierId: destination.supplierId,
      fileName: input.file.originalname,
      fileType: input.file.mimetype,
      fileSizeBytes: input.file.size,
      storagePath,
      category,
      version,
      uploadedById: input.userId,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      entityType: input.entityType,
      entityId: destination.relatedEntityId,
      action: 'UPLOAD_ATTACHMENT',
      metadata: {
        category,
        fileName: input.file.originalname,
        storagePath,
        version,
      },
    },
  })

  return attachment
}

export async function listAttachments(params: {
  entityType?: AttachmentEntityType
  entityId?: string
}) {
  return prisma.attachment.findMany({
    where: {
      entityType: params.entityType,
      entityId: params.entityId,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getAttachmentForDownload(id: string) {
  const attachment = await prisma.attachment.findUnique({ where: { id } })
  if (!attachment) {
    throw new HttpError(404, 'ATTACHMENT_NOT_FOUND', 'Adjunto no encontrado')
  }

  try {
    const target = await documentStorage.getDownloadTarget(attachment.storagePath)
    return { attachment, target }
  } catch {
    throw new HttpError(404, 'ATTACHMENT_FILE_NOT_FOUND', 'El archivo ya no existe en la carpeta visible')
  }
}
