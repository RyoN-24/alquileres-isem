import { createApp } from './app'
import { env } from './config/env'
import { documentStorage } from './storage/document-storage.service'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

async function main() {
  await documentStorage.ensureRoot()
  await fs.mkdir(path.join(os.tmpdir(), 'isem-uploads'), { recursive: true })

  const app = createApp()
  app.listen(env.PORT, () => {
    console.log(`API escuchando en http://127.0.0.1:${env.PORT}`)
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
