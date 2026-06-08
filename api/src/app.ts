import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { authRouter } from './auth/auth.routes'
import { attachmentRouter } from './attachments/attachment.routes'
import { env, isAllowedAppOrigin } from './config/env'
import { contractRouter } from './contracts/contract.routes'
import { dashboardRouter } from './dashboard/dashboard.routes'
import { equipmentRouter } from './equipment/equipment.routes'
import { notFoundHandler, errorHandler } from './http/errors'
import { importRouter } from './imports/import.routes'
import { invoiceRouter } from './invoices/invoice.routes'
import { reportRouter } from './reports/report.routes'
import { searchRouter } from './search/search.routes'
import { supplierRouter } from './suppliers/supplier.routes'
import { userRouter } from './users/user.routes'
import { valuationRouter } from './valuations/valuation.routes'
import { alertRouter } from './alerts/alert.routes'
import { settingsRouter } from './settings/settings.routes'
import { getPdfConverterHealth } from './pdf-converter'

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(
    cors({
      origin(origin, callback) {
        if (isAllowedAppOrigin(origin)) {
          callback(null, true)
          return
        }

        callback(new Error(`Origen no permitido por CORS: ${origin}`))
      },
      credentials: true,
    })
  )
  app.use(express.json({ limit: '1mb' }))
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))

  app.get('/health', async (_req, res) => {
    res.json({
      status: 'ok',
      service: 'alquileres-isem-api',
      pdfConverter: await getPdfConverterHealth(),
    })
  })

  app.use('/api/v1/auth', authRouter)
  app.use('/api/v1/attachments', attachmentRouter)
  app.use('/api/v1/alerts', alertRouter)
  app.use('/api/v1/dashboard', dashboardRouter)
  app.use('/api/v1/suppliers', supplierRouter)
  app.use('/api/v1/users', userRouter)
  app.use('/api/v1/equipment', equipmentRouter)
  app.use('/api/v1/contracts', contractRouter)
  app.use('/api/v1/valuations', valuationRouter)
  app.use('/api/v1/invoices', invoiceRouter)
  app.use('/api/v1/imports', importRouter)
  app.use('/api/v1/reports', reportRouter)
  app.use('/api/v1/search', searchRouter)
  app.use('/api/v1/settings', settingsRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
