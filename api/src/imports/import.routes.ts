import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { requireAuth, requireRole } from '../auth/middleware'
import { asyncHandler } from '../http/async-handler'
import { HttpError } from '../http/errors'
import { buildImportTemplate, importExcelFile } from './import.service'

const tempFolder = path.join(os.tmpdir(), 'isem-imports')
const upload = multer({
  dest: tempFolder,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
})

const querySchema = z.object({
  commit: z.coerce.boolean().default(false),
})

export const importRouter = Router()

importRouter.use(requireAuth)

importRouter.get(
  '/template',
  asyncHandler(async (_req, res) => {
    const buffer = await buildImportTemplate()
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename="plantilla-importacion-isem.xlsx"')
    res.send(Buffer.from(buffer))
  }),
)

importRouter.post(
  '/excel',
  requireRole('ADMIN', 'OPERATIVO'),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    await fs.mkdir(tempFolder, { recursive: true })
    const file = req.file
    if (!file) {
      throw new HttpError(422, 'FILE_REQUIRED', 'Debe adjuntar un archivo Excel')
    }

    const extension = path.extname(file.originalname).toLowerCase()
    if (!['.xlsx', '.xlsm'].includes(extension)) {
      await fs.unlink(file.path).catch(() => undefined)
      throw new HttpError(422, 'INVALID_FILE_TYPE', 'Solo se permiten archivos .xlsx o .xlsm')
    }

    const query = querySchema.parse(req.query)
    res.json(await importExcelFile({ filePath: file.path, commit: query.commit, userId: req.user?.id }))
  }),
)
