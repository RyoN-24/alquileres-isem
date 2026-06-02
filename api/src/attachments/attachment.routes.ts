import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { AttachmentEntityType } from '@prisma/client'
import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { requireAuth, requireRole } from '../auth/middleware'
import { asyncHandler } from '../http/async-handler'
import { HttpError } from '../http/errors'
import { getAttachmentForDownload, listAttachments, uploadAttachment } from './attachment.service'

const tempFolder = path.join(os.tmpdir(), 'isem-uploads')
const upload = multer({
  dest: tempFolder,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
})

const uploadSchema = z.object({
  entityType: z.nativeEnum(AttachmentEntityType),
  entityId: z.string().min(1),
  category: z.string().min(1),
})

const listSchema = z.object({
  entityType: z.nativeEnum(AttachmentEntityType).optional(),
  entityId: z.string().optional(),
})

export const attachmentRouter = Router()

attachmentRouter.use(requireAuth)

attachmentRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = listSchema.parse(req.query)
    res.json({ data: await listAttachments(query) })
  }),
)

attachmentRouter.get(
  '/:id/download',
  asyncHandler(async (req, res) => {
    const attachment = await getAttachmentForDownload(String(req.params.id))
    if (attachment.target.type === 'signed-url') {
      res.redirect(attachment.target.url)
      return
    }
    res.download(attachment.target.path, attachment.attachment.fileName)
  }),
)

attachmentRouter.post(
  '/',
  requireRole('ADMIN', 'OPERATIVO'),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    await fs.mkdir(tempFolder, { recursive: true })
    const file = req.file
    if (!file) {
      throw new HttpError(422, 'FILE_REQUIRED', 'Debe adjuntar un archivo')
    }

    const input = uploadSchema.parse(req.body)
    const attachment = await uploadAttachment({
      ...input,
      file,
      userId: req.user?.id,
    })

    res.status(201).json(attachment)
  }),
)
