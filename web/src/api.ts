function resolveApiUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim()
  if (configuredUrl) {
    const normalizedUrl = configuredUrl.replace(/\/$/, '')
    if (
      normalizedUrl.includes('tu-api-render') ||
      normalizedUrl.includes('tu-dominio') ||
      normalizedUrl.includes('example.com')
    ) {
      return ''
    }

    return normalizedUrl
  }

  const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  if (isLocalHost) return `http://${window.location.hostname}:4000`

  return ''
}

const API_URL = resolveApiUrl()

export function getApiConfigurationError() {
  if (!API_URL) {
    return 'Falta configurar VITE_API_URL con la URL publica real del backend en Render'
  }

  return ''
}

function assertApiUrl() {
  const error = getApiConfigurationError()
  if (error) throw new Error(error)
}

export type AuthUser = {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'OPERATIVO'
}

export type ApiUser = AuthUser & {
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export type CreateUserInput = {
  name: string
  email: string
  password: string
  role: 'ADMIN' | 'OPERATIVO'
}

export type UpdateUserInput = {
  name?: string
  email?: string
  password?: string
  role?: 'ADMIN' | 'OPERATIVO'
  isActive?: boolean
}

export type ApiSupplier = {
  id: string
  businessName: string
  tradeName: string | null
  ruc: string
  contactName: string | null
  phone: string | null
  email: string | null
  address: string | null
  bankName: string | null
  bankAccountNumber: string | null
  defaultPaymentTermDays: number
  status: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO'
  folderPath: string | null
  createdAt: string
  updatedAt: string
}

export type CreateSupplierInput = {
  businessName: string
  ruc: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
  bankName?: string
  bankAccountNumber?: string
  defaultPaymentTermDays: number
}

export type ApiEquipment = {
  id: string
  supplierId: string
  equipmentTypeId: string
  currentSiteId: string | null
  description: string
  brand: string | null
  model: string | null
  year: number | null
  plateOrInternalCode: string | null
  status: 'DISPONIBLE' | 'EN_OBRA' | 'EN_MANTENIMIENTO' | 'RETIRADO' | 'FINALIZADO'
  folderPath: string | null
  supplier: { id: string; businessName: string; ruc: string }
  equipmentType: { id: string; name: string }
  currentSite: { id: string; name: string } | null
}

export type ApiEquipmentType = {
  id: string
  name: string
  isActive: boolean
}

export type ApiSite = {
  id: string
  name: string
  address: string | null
  isActive: boolean
}

export type CreateEquipmentInput = {
  supplierId: string
  equipmentTypeId: string
  currentSiteId?: string
  description: string
  brand?: string
  model?: string
  year?: number
  plateOrInternalCode?: string
  status: 'DISPONIBLE' | 'EN_OBRA' | 'EN_MANTENIMIENTO' | 'RETIRADO' | 'FINALIZADO'
}

export type ApiContract = {
  id: string
  supplierId: string
  siteId: string
  contractNumber: string
  startDate: string
  endDate: string
  billingMode: 'HORA' | 'DIA'
  rate: string
  currency: 'PEN' | 'USD'
  invoiceDueDays: number
  notes: string | null
  status: 'BORRADOR' | 'ACTIVO' | 'POR_VENCER' | 'FINALIZADO' | 'CANCELADO'
  folderPath: string | null
  supplier: { id: string; businessName: string; ruc: string }
  site: { id: string; name: string }
  contractEquipment: Array<{
    equipment: { id: string; description: string; plateOrInternalCode: string | null }
  }>
}

export type CreateContractInput = {
  supplierId: string
  siteId: string
  contractNumber: string
  equipmentIds: string[]
  startDate: string
  endDate: string
  billingMode: 'HORA' | 'DIA'
  rate: number
  currency: 'PEN' | 'USD'
  invoiceDueDays: number
  notes?: string
  status: 'BORRADOR' | 'ACTIVO'
}

export type ApiValuation = {
  id: string
  contractId: string
  equipmentId: string
  valuationNumber: string
  periodStart: string | null
  periodEnd: string | null
  cutoffDate: string
  quantity: string
  unitRate: string
  calculatedAmount: string
  currency: 'PEN' | 'USD'
  status: 'BORRADOR' | 'PENDIENTE_FACTURA' | 'FACTURADA' | 'OBSERVADA' | 'PAGADA' | 'ANULADA'
  notes: string | null
  folderPath: string | null
  contract: {
    id: string
    contractNumber: string
    billingMode: 'HORA' | 'DIA'
    rate: string
    supplier: { id: string; businessName: string; ruc: string }
  }
  equipment: { id: string; description: string; plateOrInternalCode: string | null }
  invoice?: { id: string; invoiceNumber: string; status: string } | null
}

export type CreateValuationInput = {
  contractId: string
  equipmentId: string
  valuationNumber: string
  periodStart?: string
  periodEnd?: string
  cutoffDate: string
  quantity: number
  currency?: 'PEN' | 'USD'
  notes?: string
  status: 'BORRADOR' | 'PENDIENTE_FACTURA'
}

export type ApiInvoice = {
  id: string
  supplierId: string
  contractId: string
  valuationId: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  currency: 'PEN' | 'USD'
  totalAmount: string
  amountMismatchAccepted: boolean
  status: 'REGISTRADA' | 'PENDIENTE' | 'OBSERVADA' | 'VENCIDA' | 'VENCIDA_CON_PRORROGA' | 'PAGADA' | 'ANULADA'
  paidAt: string | null
  paymentExtensionDate: string | null
  paymentExtensionReason: string | null
  notes: string | null
  folderPath: string | null
  supplier: { id: string; businessName: string; ruc: string }
  contract: { id: string; contractNumber: string; invoiceDueDays: number }
  valuation: {
    id: string
    valuationNumber: string
    calculatedAmount: string
    currency: 'PEN' | 'USD'
    equipment: { id: string; description: string; plateOrInternalCode: string | null }
  }
}

export type CreateInvoiceInput = {
  valuationId: string
  invoiceNumber: string
  issueDate: string
  dueDate?: string
  currency?: 'PEN' | 'USD'
  totalAmount?: number
  amountMismatchAccepted?: boolean
  notes?: string
  status: 'PENDIENTE' | 'OBSERVADA'
  invoiceFile?: File
  valuationFile?: File
}

export type MarkInvoicePaidInput = {
  paidAt: string
  notes?: string
}

export type UpdateInvoiceInput = {
  paymentExtensionDate?: string
  paymentExtensionReason?: string
  status?: 'PENDIENTE' | 'OBSERVADA' | 'VENCIDA' | 'VENCIDA_CON_PRORROGA' | 'ANULADA'
  notes?: string
}

export type DashboardSummary = {
  activeContracts: {
    total: number
    bySite: Array<{ siteId: string; siteName: string; total: number }>
  }
  pendingInvoices: { PEN: number; USD: number }
  dueSoonInvoices: ApiInvoice[]
  overdueInvoices: ApiInvoice[]
  valuationsPendingInvoice: number
}

export type DueInvoicesReport = {
  totals: { PEN: number; USD: number }
  rows: Array<{
    id: string
    invoiceNumber: string
    supplier: string
    supplierRuc: string
    contractNumber: string
    site: string
    valuationNumber: string
    equipment: string
    issueDate: string
    dueDate: string
    currency: 'PEN' | 'USD'
    totalAmount: number
    status: string
    paymentExtensionDate: string | null
  }>
}

export type CostSummaryReport = {
  totals: { PEN: number; USD: number }
  suppliers: Array<{
    supplier: string
    supplierRuc: string
    invoices: number
    PEN: number
    USD: number
  }>
  equipment: Array<{
    equipment: string
    supplier: string
    invoices: number
    PEN: number
    USD: number
  }>
  valuations: Array<{
    invoiceNumber: string
    supplier: string
    contractNumber: string
    site: string
    valuationNumber: string
    cutoffDate: string
    equipment: string
    quantity: number
    valuationAmount: number
    valuationCurrency: 'PEN' | 'USD'
    invoiceAmount: number
    invoiceCurrency: 'PEN' | 'USD'
    invoiceStatus: string
  }>
}

export type AlertSettings = {
  invoiceDaysBeforeDue: number
  contractDaysBeforeDue: number
  dailyOverdueReminderEnabled: boolean
}

export type ContractTemplateSettings = {
  template: string
}

export type SearchResults = {
  suppliers: ApiSupplier[]
  equipment: ApiEquipment[]
  contracts: ApiContract[]
  valuations: ApiValuation[]
  invoices: ApiInvoice[]
}

export type ImportSection = 'Proveedores' | 'Equipos' | 'Contratos' | 'Valorizaciones' | 'Facturas'

export type ImportResult = {
  commit: boolean
  summary: Record<ImportSection, { total: number; create: number; skip: number; error: number }>
  results: Array<{
    section: ImportSection
    row: number
    action: 'CREATE' | 'SKIP' | 'ERROR'
    message: string
    reference?: string
  }>
}

export type ApiAttachment = {
  id: string
  entityType: string
  entityId: string
  supplierId: string | null
  fileName: string
  fileType: string
  fileSizeBytes: number
  storagePath: string
  category: string
  version: number
  uploadedById: string | null
  createdAt: string
}

async function request<T>(path: string, options: RequestInit = {}) {
  assertApiUrl()
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message = payload?.error?.message ?? 'No se pudo completar la accion'
    throw new Error(message)
  }

  return payload as T
}

async function uploadRequest<T>(path: string, token: string, formData: FormData) {
  assertApiUrl()
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message = payload?.error?.message ?? 'No se pudo subir el archivo'
    throw new Error(message)
  }

  return payload as T
}

async function downloadRequest(path: string, token: string) {
  assertApiUrl()
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const message = payload?.error?.message ?? 'No se pudo descargar el archivo'
    throw new Error(message)
  }

  return response.blob()
}

export async function login(email: string, password: string) {
  return request<{ token: string; user: AuthUser }>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function getCurrentUser(token: string) {
  return request<{ user: AuthUser }>('/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function listUsers(token: string) {
  return request<{ data: ApiUser[] }>('/api/v1/users', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function createUser(token: string, input: CreateUserInput) {
  return request<ApiUser>('/api/v1/users', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  })
}

export async function updateUser(token: string, id: string, input: UpdateUserInput) {
  return request<ApiUser>(`/api/v1/users/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  })
}

export async function listSuppliers(token: string) {
  return request<{ data: ApiSupplier[] }>('/api/v1/suppliers', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function createSupplier(token: string, input: CreateSupplierInput) {
  return request<ApiSupplier>('/api/v1/suppliers', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  })
}

export async function listEquipment(token: string) {
  return request<{ data: ApiEquipment[] }>('/api/v1/equipment', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function createEquipment(token: string, input: CreateEquipmentInput) {
  return request<ApiEquipment>('/api/v1/equipment', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  })
}

export async function listEquipmentTypes(token: string) {
  return request<{ data: ApiEquipmentType[] }>('/api/v1/equipment/types', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function listSites(token: string) {
  return request<{ data: ApiSite[] }>('/api/v1/equipment/sites', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function createEquipmentType(token: string, input: { name: string }) {
  return request<ApiEquipmentType>('/api/v1/equipment/types', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  })
}

export async function updateEquipmentType(
  token: string,
  id: string,
  input: { name?: string; isActive?: boolean },
) {
  return request<ApiEquipmentType>(`/api/v1/equipment/types/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  })
}

export async function createSite(token: string, input: { name: string; address?: string }) {
  return request<ApiSite>('/api/v1/equipment/sites', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  })
}

export async function updateSite(
  token: string,
  id: string,
  input: { name?: string; address?: string; isActive?: boolean },
) {
  return request<ApiSite>(`/api/v1/equipment/sites/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  })
}

export async function listContracts(token: string) {
  return request<{ data: ApiContract[] }>('/api/v1/contracts', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function createContract(token: string, input: CreateContractInput) {
  return request<ApiContract>('/api/v1/contracts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  })
}

export async function generateContractPdf(token: string, id: string) {
  return request<ApiAttachment>(`/api/v1/contracts/${id}/generate-pdf`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function listValuations(token: string) {
  return request<{ data: ApiValuation[] }>('/api/v1/valuations', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function createValuation(token: string, input: CreateValuationInput) {
  return request<ApiValuation>('/api/v1/valuations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  })
}

export async function listInvoices(token: string) {
  return request<{ data: ApiInvoice[] }>('/api/v1/invoices', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function createInvoice(token: string, input: CreateInvoiceInput) {
  const payload: Partial<CreateInvoiceInput> = { ...input }
  delete payload.invoiceFile
  delete payload.valuationFile
  return request<ApiInvoice>('/api/v1/invoices', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
}

export async function markInvoicePaid(token: string, id: string, input: MarkInvoicePaidInput) {
  return request<ApiInvoice>(`/api/v1/invoices/${id}/mark-paid`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  })
}

export async function updateInvoice(token: string, id: string, input: UpdateInvoiceInput) {
  return request<ApiInvoice>(`/api/v1/invoices/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  })
}

export async function uploadAttachment(
  token: string,
  input: {
    entityType: 'SUPPLIER' | 'EQUIPMENT' | 'CONTRACT' | 'VALUATION' | 'INVOICE' | 'PAYMENT'
    entityId: string
    category: string
    file: File
  },
) {
  const formData = new FormData()
  formData.append('entityType', input.entityType)
  formData.append('entityId', input.entityId)
  formData.append('category', input.category)
  formData.append('file', input.file)

  return uploadRequest('/api/v1/attachments', token, formData)
}

export async function listAttachments(
  token: string,
  input: { entityType?: string; entityId?: string } = {},
) {
  const params = new URLSearchParams()
  if (input.entityType) params.set('entityType', input.entityType)
  if (input.entityId) params.set('entityId', input.entityId)

  const query = params.toString()
  return request<{ data: ApiAttachment[] }>(`/api/v1/attachments${query ? `?${query}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function downloadAttachment(token: string, id: string) {
  return downloadRequest(`/api/v1/attachments/${id}/download`, token)
}

export async function downloadImportTemplate(token: string) {
  return downloadRequest('/api/v1/imports/template', token)
}

export async function importExcel(token: string, file: File, commit: boolean) {
  const formData = new FormData()
  formData.append('file', file)
  return uploadRequest<ImportResult>(`/api/v1/imports/excel?commit=${String(commit)}`, token, formData)
}

export async function getDashboardSummary(token: string) {
  return request<DashboardSummary>('/api/v1/dashboard/summary', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function runAlerts(token: string) {
  return request('/api/v1/alerts/run', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function getAlertSettings(token: string) {
  return request<AlertSettings>('/api/v1/settings/alerts', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function updateAlertSettings(token: string, input: AlertSettings) {
  return request<AlertSettings>('/api/v1/settings/alerts', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  })
}

export async function getContractTemplate(token: string) {
  return request<ContractTemplateSettings>('/api/v1/settings/contract-template', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function updateContractTemplate(token: string, input: ContractTemplateSettings) {
  return request<ContractTemplateSettings>('/api/v1/settings/contract-template', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  })
}

export async function getDueInvoicesReport(token: string) {
  return request<DueInvoicesReport>('/api/v1/reports/due-invoices', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function getCostSummaryReport(token: string) {
  return request<CostSummaryReport>('/api/v1/reports/cost-summary', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function reportDownloadUrl(report: 'due-invoices' | 'cost-summary', format: 'xlsx' | 'pdf') {
  assertApiUrl()
  return `${API_URL}/api/v1/reports/${report}?format=${format}`
}

export async function globalSearch(token: string, query: string) {
  return request<SearchResults>(`/api/v1/search?q=${encodeURIComponent(query)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function deleteContract(token: string, id: string) {
  return request<{ success: boolean }>(`/api/v1/contracts/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function deleteValuation(token: string, id: string) {
  return request<{ success: boolean }>(`/api/v1/valuations/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function deleteInvoice(token: string, id: string) {
  return request<{ success: boolean }>(`/api/v1/invoices/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function deleteSupplier(token: string, id: string) {
  return request<{ success: boolean }>(`/api/v1/suppliers/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function deleteEquipment(token: string, id: string) {
  return request<{ success: boolean }>(`/api/v1/equipment/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}
