const unsafeChars = /[^a-zA-Z0-9._-]+/g

export function normalizeFolderName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(unsafeChars, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase()
}

export function supplierFolderName(ruc: string, name: string) {
  return `${normalizeFolderName(ruc)}-${normalizeFolderName(name)}`
}

