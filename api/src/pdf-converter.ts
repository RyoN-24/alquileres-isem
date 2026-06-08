import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export const pdfConverterCommands = ['soffice', 'libreoffice', '/usr/bin/soffice', '/usr/bin/libreoffice']

export async function getPdfConverterHealth() {
  const errors: string[] = []

  for (const command of pdfConverterCommands) {
    try {
      const { stdout, stderr } = await execFileAsync(command, ['--version'], { timeout: 5000 })
      return {
        available: true,
        command,
        version: (stdout || stderr).trim(),
      }
    } catch (error) {
      errors.push(`${command}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return {
    available: false,
    command: null,
    version: null,
    errors,
  }
}

