import {
  AlertTriangle,
  BadgeDollarSign,
  Bell,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileBarChart,
  FileText,
  FolderOpen,
  Eye,
  EyeOff,
  LayoutDashboard,
  Lock,
  LogIn,
  Mail,
  Menu,
  Plus,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  Wrench,
  Sun,
  Moon,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { FormEvent } from 'react'
import {
  createEquipment,
  createEquipmentType,
  createContract,
  createInvoice,
  createUser,
  createValuation,
  createSupplier,
  downloadAttachment,
  downloadImportTemplate,
  generateContractPdf,
  getAlertSettings,
  getApiConfigurationError,
  getContractTemplate,
  getCostSummaryReport,
  getCurrentUser,
  getDashboardSummary,
  getDueInvoicesReport,
  globalSearch,
  importExcel,
  listAttachments,
  listEquipment,
  listEquipmentTypes,
  listContracts,
  listSites,
  listSuppliers,
  listUsers,
  listInvoices,
  listValuations,
  login,
  markInvoicePaid,
  reportDownloadUrl,
  runAlerts,
  updateInvoice,
  updateEquipmentType,
  updateAlertSettings,
  updateContractTemplate,
  updateSite,
  updateUser,
  uploadAttachment,
  deleteContract,
  deleteValuation,
  deleteInvoice,
  deleteSupplier,
  deleteEquipment,
} from './api'
import type {
  ApiEquipment,
  ApiEquipmentType,
  ApiContract,
  ApiInvoice,
  ApiAttachment,
  ApiValuation,
  ApiSite,
  ApiSupplier,
  ApiUser,
  AlertSettings,
  AuthUser,
  ContractTemplateSettings,
  DashboardSummary,
  CostSummaryReport,
  DueInvoicesReport,
  ImportResult,
  SearchResults,
  CreateEquipmentInput,
  CreateContractInput,
  CreateInvoiceInput,
  CreateValuationInput,
  CreateSupplierInput,
  CreateUserInput,
  MarkInvoicePaidInput,
  UpdateInvoiceInput,
} from './api'
import './App.css'

type View =
  | 'dashboard'
  | 'proveedores'
  | 'equipos'
  | 'contratos'
  | 'valorizaciones'
  | 'facturas'
  | 'reportes'
  | 'configuracion'

type Currency = 'PEN' | 'USD'
type AttachmentEntityType = 'SUPPLIER' | 'EQUIPMENT' | 'CONTRACT' | 'VALUATION' | 'INVOICE' | 'PAYMENT'
type TableFilterPreset = {
  query?: string
  status?: string
  site?: string
  currency?: string
  dateFrom?: string
  dateTo?: string
  custom?: 'NO_PAGADAS'
}

const navigation: Array<{ id: View; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'proveedores', label: 'Proveedores', icon: Building2 },
  { id: 'equipos', label: 'Equipos', icon: Truck },
  { id: 'contratos', label: 'Contratos', icon: ClipboardList },
  { id: 'valorizaciones', label: 'Valorizaciones', icon: BadgeDollarSign },
  { id: 'facturas', label: 'Facturas', icon: FileText },
  { id: 'reportes', label: 'Reportes', icon: FileBarChart },
  { id: 'configuracion', label: 'Configuracion', icon: Settings },
]

const money = (value: number, currency: Currency) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)

const prettyStatus = (status: string) => status.replaceAll('_', ' ')

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('isem_theme')
    return stored === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme')
    } else {
      document.body.classList.remove('dark-theme')
    }
    localStorage.setItem('isem_theme', theme)
  }, [theme])

  const [token, setToken] = useState(() => localStorage.getItem('isem_token') ?? '')
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('isem_user')
    return stored ? (JSON.parse(stored) as AuthUser) : null
  })
  const [isSessionChecking, setIsSessionChecking] = useState(() =>
    Boolean(localStorage.getItem('isem_token') && localStorage.getItem('isem_user')),
  )
  const [activeView, setActiveView] = useState<View>('dashboard')
  const [invoiceFilterPreset, setInvoiceFilterPreset] = useState<TableFilterPreset | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [supplierFormOpen, setSupplierFormOpen] = useState(false)
  const [equipmentFormOpen, setEquipmentFormOpen] = useState(false)
  const [contractFormOpen, setContractFormOpen] = useState(false)
  const [valuationFormOpen, setValuationFormOpen] = useState(false)
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false)
  const [paymentInvoice, setPaymentInvoice] = useState<ApiInvoice | null>(null)
  const [extensionInvoice, setExtensionInvoice] = useState<ApiInvoice | null>(null)
  const [detailInvoice, setDetailInvoice] = useState<ApiInvoice | null>(null)
  const [detailContract, setDetailContract] = useState<ApiContract | null>(null)
  const [detailEquipment, setDetailEquipment] = useState<ApiEquipment | null>(null)
  const [detailValuation, setDetailValuation] = useState<ApiValuation | null>(null)
  const [detailAttachments, setDetailAttachments] = useState<ApiAttachment[]>([])
  const [apiSuppliers, setApiSuppliers] = useState<ApiSupplier[]>([])
  const [apiEquipment, setApiEquipment] = useState<ApiEquipment[]>([])
  const [apiContracts, setApiContracts] = useState<ApiContract[]>([])
  const [apiValuations, setApiValuations] = useState<ApiValuation[]>([])
  const [apiInvoices, setApiInvoices] = useState<ApiInvoice[]>([])
  const [apiUsers, setApiUsers] = useState<ApiUser[]>([])
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null)
  const [dueInvoicesReport, setDueInvoicesReport] = useState<DueInvoicesReport | null>(null)
  const [costSummaryReport, setCostSummaryReport] = useState<CostSummaryReport | null>(null)
  const [alertSettings, setAlertSettings] = useState<AlertSettings | null>(null)
  const [contractTemplate, setContractTemplate] = useState<ContractTemplateSettings | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null)
  const [equipmentTypes, setEquipmentTypes] = useState<ApiEquipmentType[]>([])
  const [sites, setSites] = useState<ApiSite[]>([])
  const [supplierLoadError, setSupplierLoadError] = useState('')
  const [equipmentLoadError, setEquipmentLoadError] = useState('')
  const [contractLoadError, setContractLoadError] = useState('')
  const [valuationLoadError, setValuationLoadError] = useState('')
  const [invoiceLoadError, setInvoiceLoadError] = useState('')
  const [userLoadError, setUserLoadError] = useState('')

  const resetSession = () => {
    localStorage.removeItem('isem_token')
    localStorage.removeItem('isem_user')
    setToken('')
    setUser(null)
    setApiSuppliers([])
    setApiEquipment([])
    setApiContracts([])
    setApiValuations([])
    setApiInvoices([])
    setApiUsers([])
    setDashboardSummary(null)
    setDueInvoicesReport(null)
    setCostSummaryReport(null)
    setAlertSettings(null)
    setContractTemplate(null)
    setSearchResults(null)
    setSelectedSupplierId(null)
    setShowNotifications(false)
  }

  const isSessionError = (error: unknown) =>
    error instanceof Error && error.message.toLowerCase().includes('sesion invalida')

  useEffect(() => {
    if (!token || !user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSessionChecking(false)
      return
    }

    let isCancelled = false
    void getCurrentUser(token)
      .then((result) => {
        if (isCancelled) return
        localStorage.setItem('isem_user', JSON.stringify(result.user))
        setUser(result.user)
      })
      .catch(() => {
        if (!isCancelled) resetSession()
      })
      .finally(() => {
        if (!isCancelled) setIsSessionChecking(false)
      })

    return () => {
      isCancelled = true
    }
    // Session validation intentionally runs when the stored token changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const loadSuppliers = async (authToken = token) => {
    if (!authToken) return
    try {
      setSupplierLoadError('')
      const result = await listSuppliers(authToken)
      setApiSuppliers(result.data)
    } catch (error) {
      if (isSessionError(error)) {
        resetSession()
        return
      }
      setSupplierLoadError(error instanceof Error ? error.message : 'No se pudieron cargar proveedores')
    }
  }

  const loadEquipment = async (authToken = token) => {
    if (!authToken) return
    try {
      setEquipmentLoadError('')
      const [equipmentResult, typeResult, siteResult] = await Promise.all([
        listEquipment(authToken),
        listEquipmentTypes(authToken),
        listSites(authToken),
      ])
      setApiEquipment(equipmentResult.data)
      setEquipmentTypes(typeResult.data)
      setSites(siteResult.data)
    } catch (error) {
      if (isSessionError(error)) {
        resetSession()
        return
      }
      setEquipmentLoadError(error instanceof Error ? error.message : 'No se pudieron cargar equipos')
    }
  }

  const loadContracts = async (authToken = token) => {
    if (!authToken) return
    try {
      setContractLoadError('')
      const result = await listContracts(authToken)
      setApiContracts(result.data)
    } catch (error) {
      if (isSessionError(error)) {
        resetSession()
        return
      }
      setContractLoadError(error instanceof Error ? error.message : 'No se pudieron cargar contratos')
    }
  }

  const loadValuations = async (authToken = token) => {
    if (!authToken) return
    try {
      setValuationLoadError('')
      const result = await listValuations(authToken)
      setApiValuations(result.data)
    } catch (error) {
      if (isSessionError(error)) {
        resetSession()
        return
      }
      setValuationLoadError(error instanceof Error ? error.message : 'No se pudieron cargar valorizaciones')
    }
  }

  const loadInvoices = async (authToken = token) => {
    if (!authToken) return
    try {
      setInvoiceLoadError('')
      const result = await listInvoices(authToken)
      setApiInvoices(result.data)
    } catch (error) {
      if (isSessionError(error)) {
        resetSession()
        return
      }
      setInvoiceLoadError(error instanceof Error ? error.message : 'No se pudieron cargar facturas')
    }
  }

  const loadDashboard = async (authToken = token) => {
    if (!authToken) return
    try {
      const summary = await getDashboardSummary(authToken)
      setDashboardSummary(summary)
    } catch (error) {
      if (isSessionError(error)) resetSession()
    }
  }

  const loadReport = async (authToken = token) => {
    if (!authToken) return
    try {
      setDueInvoicesReport(await getDueInvoicesReport(authToken))
    } catch (error) {
      if (isSessionError(error)) resetSession()
    }
  }

  const loadCostSummaryReport = async (authToken = token) => {
    if (!authToken) return
    try {
      setCostSummaryReport(await getCostSummaryReport(authToken))
    } catch (error) {
      if (isSessionError(error)) resetSession()
    }
  }

  const loadAlertSettings = async (authToken = token) => {
    if (!authToken) return
    try {
      setAlertSettings(await getAlertSettings(authToken))
    } catch (error) {
      if (isSessionError(error)) resetSession()
    }
  }

  const loadContractTemplate = async (authToken = token) => {
    if (!authToken) return
    try {
      setContractTemplate(await getContractTemplate(authToken))
    } catch (error) {
      if (isSessionError(error)) resetSession()
    }
  }

  const loadUsers = async (authToken = token) => {
    if (!authToken || user?.role !== 'ADMIN') return
    try {
      setUserLoadError('')
      const result = await listUsers(authToken)
      setApiUsers(result.data)
    } catch (error) {
      if (isSessionError(error)) {
        resetSession()
        return
      }
      setUserLoadError(error instanceof Error ? error.message : 'No se pudieron cargar usuarios')
    }
  }

  const runGlobalSearch = async (query: string) => {
    setSearchQuery(query)
    if (!token || query.trim().length < 2) {
      setSearchResults(null)
      return
    }
    setSearchResults(await globalSearch(token, query))
  }

  useEffect(() => {
    if (isSessionChecking) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSuppliers()
    void loadEquipment()
    void loadContracts()
    void loadValuations()
    void loadInvoices()
    void loadDashboard()
    void loadReport()
    void loadCostSummaryReport()
    void loadAlertSettings()
    void loadContractTemplate()
    void loadUsers()
    // The load functions are intentionally omitted to avoid re-running this bootstrapping effect on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.role, isSessionChecking])

  const dashboard = useMemo(() => {
    const activeContracts = apiContracts.filter((contract) => contract.status === 'ACTIVO')
    const pendingInvoices = apiInvoices.filter((invoice) => invoice.status !== 'PAGADA')
    const sumByCurrency = (currency: Currency) =>
      pendingInvoices
        .filter((invoice) => invoice.currency === currency)
        .reduce((total, invoice) => total + Number(invoice.totalAmount), 0)

    return {
      activeContracts,
      pendingPen: sumByCurrency('PEN'),
      pendingUsd: sumByCurrency('USD'),
      dueSoon: apiInvoices.filter((invoice) => invoice.status === 'PENDIENTE'),
      overdue: apiInvoices.filter((invoice) => invoice.status === 'VENCIDA'),
    }
  }, [apiContracts, apiInvoices])

  const currentTitle = navigation.find((item) => item.id === activeView)?.label ?? 'Dashboard'

  const navigate = (view: View) => {
    setActiveView(view)
    setMobileMenuOpen(false)
  }

  const openInvoicesWithPreset = (preset: Omit<TableFilterPreset, 'key'>) => {
    setInvoiceFilterPreset({ ...preset })
    setActiveView('facturas')
    setMobileMenuOpen(false)
  }

  const handleLogin = (nextToken: string, nextUser: AuthUser) => {
    localStorage.setItem('isem_token', nextToken)
    localStorage.setItem('isem_user', JSON.stringify(nextUser))
    setToken(nextToken)
    setUser(nextUser)
  }

  const handleLogout = () => {
    resetSession()
  }

  const handleCreateSupplier = async (input: CreateSupplierInput) => {
    if (!token) return
    await createSupplier(token, input)
    await loadSuppliers(token)
    setSupplierFormOpen(false)
  }

  const handleCreateEquipment = async (input: CreateEquipmentInput) => {
    if (!token) return
    await createEquipment(token, input)
    await loadEquipment(token)
    setEquipmentFormOpen(false)
  }

  const handleCreateEquipmentType = async (name: string) => {
    if (!token) return
    await createEquipmentType(token, { name })
    await loadEquipment(token)
  }

  const handleToggleEquipmentType = async (id: string, isActive: boolean) => {
    if (!token) return
    await updateEquipmentType(token, id, { isActive })
    await loadEquipment(token)
  }

  const handleToggleSite = async (id: string, isActive: boolean) => {
    if (!token) return
    await updateSite(token, id, { isActive })
    await loadEquipment(token)
  }

  const handleUpdateAlertSettings = async (input: AlertSettings) => {
    if (!token) return
    setAlertSettings(await updateAlertSettings(token, input))
  }

  const handleUpdateContractTemplate = async (input: ContractTemplateSettings) => {
    if (!token) return
    setContractTemplate(await updateContractTemplate(token, input))
  }

  const handleCreateUser = async (input: CreateUserInput) => {
    if (!token) return
    await createUser(token, input)
    await loadUsers(token)
  }

  const handleToggleUser = async (targetUser: ApiUser, isActive: boolean) => {
    if (!token) return
    await updateUser(token, targetUser.id, { isActive })
    await loadUsers(token)
  }

  const handleChangeUserRole = async (targetUser: ApiUser, role: AuthUser['role']) => {
    if (!token) return
    await updateUser(token, targetUser.id, { role })
    await loadUsers(token)
  }

  const handleCreateContract = async (input: CreateContractInput) => {
    if (!token) return
    await createContract(token, input)
    await loadContracts(token)
    setContractFormOpen(false)
  }

  const handleCreateValuation = async (input: CreateValuationInput) => {
    if (!token) return
    await createValuation(token, input)
    await loadValuations(token)
    setValuationFormOpen(false)
  }

  const handleCreateInvoice = async (input: CreateInvoiceInput) => {
    if (!token) return
    const invoice = await createInvoice(token, input)
    const invoiceFile = input.invoiceFile
    const valuationFile = input.valuationFile
    if (invoiceFile) {
      await uploadAttachment(token, {
        entityType: 'INVOICE',
        entityId: invoice.id,
        category: 'FACTURA',
        file: invoiceFile,
      })
    }
    if (valuationFile) {
      await uploadAttachment(token, {
        entityType: 'INVOICE',
        entityId: invoice.id,
        category: 'VALORIZACION_PROVEEDOR',
        file: valuationFile,
      })
    }
    await Promise.all([loadInvoices(token), loadValuations(token)])
    await loadDashboard(token)
    setInvoiceFormOpen(false)
  }

  const handleMarkInvoicePaid = async (
    invoice: ApiInvoice,
    input: MarkInvoicePaidInput & { paymentFile: File },
  ) => {
    if (!token) return
    await markInvoicePaid(token, invoice.id, {
      paidAt: input.paidAt,
      notes: input.notes,
    })
    await uploadAttachment(token, {
      entityType: 'INVOICE',
      entityId: invoice.id,
      category: 'COMPROBANTE_PAGO',
      file: input.paymentFile,
    })
    await Promise.all([loadInvoices(token), loadValuations(token)])
    await loadDashboard(token)
    setPaymentInvoice(null)
  }

  const handleExtendInvoice = async (invoice: ApiInvoice, input: UpdateInvoiceInput) => {
    if (!token) return
    await updateInvoice(token, invoice.id, {
      ...input,
      status: 'VENCIDA_CON_PRORROGA',
    })
    await Promise.all([loadInvoices(token), loadDashboard(token)])
    setExtensionInvoice(null)
    if (detailInvoice?.id === invoice.id) {
      setDetailInvoice(null)
      setDetailAttachments([])
    }
  }

  const handleRunAlerts = async () => {
    if (!token) return
    await runAlerts(token)
    await Promise.all([loadInvoices(token), loadDashboard(token)])
  }

  const openInvoiceDetail = async (invoice: ApiInvoice) => {
    setDetailInvoice(invoice)
    if (!token) return
    const result = await listAttachments(token, { entityType: 'INVOICE', entityId: invoice.id })
    setDetailAttachments(result.data)
  }

  const openContractDetail = async (contract: ApiContract) => {
    setDetailContract(contract)
    if (!token) return
    const result = await listAttachments(token, { entityType: 'CONTRACT', entityId: contract.id })
    setDetailAttachments(result.data)
  }

  const handleDeleteContract = async (id: string) => {
    if (!token) return
    if (!window.confirm('¿Está seguro de que desea eliminar este contrato? Esta acción eliminará también sus documentos adjuntos asociados.')) return
    try {
      await deleteContract(token, id)
      setDetailContract(null)
      await Promise.all([loadContracts(token), loadDashboard(token)])
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo eliminar el contrato')
    }
  }

  const handleDeleteValuation = async (id: string) => {
    if (!token) return
    if (!window.confirm('¿Está seguro de que desea eliminar esta valorización?')) return
    try {
      await deleteValuation(token, id)
      setDetailValuation(null)
      await Promise.all([loadValuations(token), loadDashboard(token)])
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo eliminar la valorización')
    }
  }

  const handleDeleteInvoice = async (id: string) => {
    if (!token) return
    if (!window.confirm('¿Está seguro de que desea eliminar esta factura?')) return
    try {
      await deleteInvoice(token, id)
      setDetailInvoice(null)
      await Promise.all([loadInvoices(token), loadDashboard(token)])
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo eliminar la factura')
    }
  }

  const handleDeleteSupplier = async (id: string) => {
    if (!token) return
    if (!window.confirm('¿Está seguro de que desea eliminar este proveedor?')) return
    try {
      await deleteSupplier(token, id)
      setSelectedSupplierId(null)
      await Promise.all([loadSuppliers(token), loadDashboard(token)])
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo eliminar el proveedor')
    }
  }

  const handleDeleteEquipment = async (id: string) => {
    if (!token) return
    if (!window.confirm('¿Está seguro de que desea eliminar este equipo?')) return
    try {
      await deleteEquipment(token, id)
      setDetailEquipment(null)
      await Promise.all([loadEquipment(token), loadDashboard(token)])
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo eliminar el equipo')
    }
  }

  const handleGenerateContractPdf = async (contract: ApiContract) => {
    if (!token) return
    await generateContractPdf(token, contract.id)
    const result = await listAttachments(token, { entityType: 'CONTRACT', entityId: contract.id })
    setDetailAttachments(result.data)
  }

  const handleDownloadImportTemplate = async () => {
    if (!token) return
    const blob = await downloadImportTemplate(token)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'plantilla-importacion-isem.xlsx'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImportExcel = async (file: File, commit: boolean) => {
    if (!token) throw new Error('Sesion no iniciada')
    const result = await importExcel(token, file, commit)
    if (commit) {
      await Promise.all([
        loadSuppliers(token),
        loadEquipment(token),
        loadContracts(token),
        loadValuations(token),
        loadInvoices(token),
        loadDashboard(token),
        loadReport(token),
        loadCostSummaryReport(token),
      ])
    }
    return result
  }

  const openEquipmentDetail = async (equipment: ApiEquipment) => {
    setDetailEquipment(equipment)
    if (!token) return
    const result = await listAttachments(token, { entityType: 'EQUIPMENT', entityId: equipment.id })
    setDetailAttachments(result.data)
  }

  const openValuationDetail = async (valuation: ApiValuation) => {
    setDetailValuation(valuation)
    if (!token) return
    const invoice = apiInvoices.find((item) => item.valuationId === valuation.id)
    const result = invoice
      ? await listAttachments(token, { entityType: 'INVOICE', entityId: invoice.id })
      : await listAttachments(token, { entityType: 'VALUATION', entityId: valuation.id })
    setDetailAttachments(result.data)
  }

  const handleDetailAttachmentUpload = async (input: {
    entityType: AttachmentEntityType
    entityId: string
    category: string
    file: File
  }) => {
    if (!token) return
    await uploadAttachment(token, input)
    const result = await listAttachments(token, { entityType: input.entityType, entityId: input.entityId })
    setDetailAttachments(result.data)
  }

  const handleAttachmentDownload = async (attachment: ApiAttachment) => {
    if (!token) return
    const blob = await downloadAttachment(token, attachment.id)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = attachment.fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isSessionChecking) {
    return <SessionLoadingScreen />
  }

  if (!token || !user) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <div className="app-shell">
      <aside className={mobileMenuOpen ? 'sidebar sidebar-open' : 'sidebar'} aria-label="Navegacion principal">
        <div className="brand">
          <div className="brand-mark">
            <img src="/brand/isem-logo.png" alt="" aria-hidden="true" />
          </div>
          <div>
            <strong>ISEM</strong>
            <span>Alquileres</span>
          </div>
        </div>

        <nav className="nav-list">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                className={activeView === item.id ? 'nav-item active' : 'nav-item'}
                onClick={() => navigate(item.id)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <button
            type="button"
            className="icon-button mobile-only"
            aria-label={mobileMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div>
            <p className="eyebrow">INDUSTRIAS Y SERVICIOS ELECTRO-MECANICOS SRL</p>
            <h1>{currentTitle}</h1>
          </div>

          <div className="topbar-actions">
            <label className="search-box">
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">Buscar</span>
              <input
                value={searchQuery}
                placeholder="Buscar proveedor, contrato o factura"
                onChange={(event) => void runGlobalSearch(event.target.value)}
              />
            </label>
            {searchResults && (
              <SearchPanel
                results={searchResults}
                onSelectSupplier={(id) => {
                  setSelectedSupplierId(id)
                  setSearchResults(null)
                }}
              />
            )}
            <button
              type="button"
              className="theme-toggle-button"
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              type="button"
              className="alert-button"
              aria-label="Ver alertas"
              onClick={() => setShowNotifications((show) => !show)}
            >
              <Bell size={18} />
              <span>{dashboard.overdue.length + dashboard.dueSoon.length}</span>
            </button>
            {showNotifications && (
              <NotificationsPanel
                overdue={dashboard.overdue}
                dueSoon={dashboard.dueSoon}
                invoices={apiInvoices}
                onOpenInvoiceDetail={async (invoice) => {
                  await openInvoiceDetail(invoice)
                  setShowNotifications(false)
                }}
                onClose={() => setShowNotifications(false)}
              />
            )}
            <button type="button" className="session-button" onClick={handleLogout}>
              Salir
            </button>
          </div>
        </header>

        <section className="content">
          {renderView(activeView, dashboard, (type) => {
            if (type === 'contrato') setContractFormOpen(true)
            if (type === 'valorizacion') setValuationFormOpen(true)
            if (type === 'factura') setInvoiceFormOpen(true)
          }, {
            suppliers: apiSuppliers,
            users: apiUsers,
            equipment: apiEquipment,
            contracts: apiContracts,
            valuations: apiValuations,
            invoices: apiInvoices,
            dashboardSummary,
            dueInvoicesReport,
            costSummaryReport,
            equipmentTypes,
            sites,
            supplierLoadError,
            equipmentLoadError,
            contractLoadError,
            valuationLoadError,
            invoiceLoadError,
            userLoadError,
            onNewSupplier: () => setSupplierFormOpen(true),
            onNewEquipment: () => setEquipmentFormOpen(true),
            onNewContract: () => setContractFormOpen(true),
            onNewValuation: () => setValuationFormOpen(true),
            onNewInvoice: () => setInvoiceFormOpen(true),
            onOpenPayment: setPaymentInvoice,
            onOpenExtension: setExtensionInvoice,
            onOpenInvoiceDetail: openInvoiceDetail,
            onOpenContractDetail: openContractDetail,
            onOpenEquipmentDetail: openEquipmentDetail,
            onOpenValuationDetail: openValuationDetail,
            onOpenSupplierDetail: setSelectedSupplierId,
            onDeleteContract: handleDeleteContract,
            onDeleteValuation: handleDeleteValuation,
            onDeleteInvoice: handleDeleteInvoice,
            onOpenInvoicesPreset: openInvoicesWithPreset,
            onRunAlerts: handleRunAlerts,
            token,
            onLoadReport: () => loadReport(token),
            onLoadCostSummaryReport: () => loadCostSummaryReport(token),
            invoiceFilterPreset,
            onCreateEquipmentType: handleCreateEquipmentType,
            onToggleEquipmentType: handleToggleEquipmentType,
            onToggleSite: handleToggleSite,
            alertSettings,
            onUpdateAlertSettings: handleUpdateAlertSettings,
            contractTemplate,
            onUpdateContractTemplate: handleUpdateContractTemplate,
            currentUser: user,
            onCreateUser: handleCreateUser,
            onToggleUser: handleToggleUser,
            onChangeUserRole: handleChangeUserRole,
            onDownloadImportTemplate: handleDownloadImportTemplate,
            onImportExcel: handleImportExcel,
          })}
        </section>
      </main>

      {supplierFormOpen && (
        <SupplierForm onClose={() => setSupplierFormOpen(false)} onSubmit={handleCreateSupplier} />
      )}
      {equipmentFormOpen && (
        <EquipmentForm
          suppliers={apiSuppliers}
          equipmentTypes={equipmentTypes}
          sites={sites}
          onClose={() => setEquipmentFormOpen(false)}
          onSubmit={handleCreateEquipment}
        />
      )}
      {contractFormOpen && (
        <ContractForm
          suppliers={apiSuppliers}
          equipment={apiEquipment}
          sites={sites}
          onClose={() => setContractFormOpen(false)}
          onSubmit={handleCreateContract}
        />
      )}
      {valuationFormOpen && (
        <ValuationForm
          contracts={apiContracts}
          onClose={() => setValuationFormOpen(false)}
          onSubmit={handleCreateValuation}
        />
      )}
      {invoiceFormOpen && (
        <InvoiceForm
          valuations={apiValuations}
          invoices={apiInvoices}
          onClose={() => setInvoiceFormOpen(false)}
          onSubmit={handleCreateInvoice}
        />
      )}
      {paymentInvoice && (
        <PaymentForm
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onSubmit={(input) => handleMarkInvoicePaid(paymentInvoice, input)}
        />
      )}
      {extensionInvoice && (
        <InvoiceExtensionForm
          invoice={extensionInvoice}
          onClose={() => setExtensionInvoice(null)}
          onSubmit={(input) => handleExtendInvoice(extensionInvoice, input)}
        />
      )}
      {detailInvoice && (
        <InvoiceDetail
          invoice={detailInvoice}
          attachments={detailAttachments}
          onUploadAttachment={handleDetailAttachmentUpload}
          onDownloadAttachment={handleAttachmentDownload}
          onDelete={() => handleDeleteInvoice(detailInvoice.id)}
          onClose={() => {
            setDetailInvoice(null)
            setDetailAttachments([])
          }}
        />
      )}
      {detailContract && (
        <ContractDetail
          contract={detailContract}
          valuations={apiValuations}
          invoices={apiInvoices}
          attachments={detailAttachments}
          onUploadAttachment={handleDetailAttachmentUpload}
          onDownloadAttachment={handleAttachmentDownload}
          onGeneratePdf={handleGenerateContractPdf}
          onDelete={() => handleDeleteContract(detailContract.id)}
          onClose={() => {
            setDetailContract(null)
            setDetailAttachments([])
          }}
        />
      )}
      {detailEquipment && (
        <EquipmentDetail
          equipment={detailEquipment}
          contracts={apiContracts}
          valuations={apiValuations}
          invoices={apiInvoices}
          attachments={detailAttachments}
          onUploadAttachment={handleDetailAttachmentUpload}
          onDownloadAttachment={handleAttachmentDownload}
          onDelete={() => handleDeleteEquipment(detailEquipment.id)}
          onClose={() => {
            setDetailEquipment(null)
            setDetailAttachments([])
          }}
        />
      )}
      {detailValuation && (
        <ValuationDetail
          valuation={detailValuation}
          invoice={apiInvoices.find((item) => item.valuationId === detailValuation.id) ?? null}
          attachments={detailAttachments}
          onUploadAttachment={handleDetailAttachmentUpload}
          onDownloadAttachment={handleAttachmentDownload}
          onDelete={() => handleDeleteValuation(detailValuation.id)}
          onClose={() => {
            setDetailValuation(null)
            setDetailAttachments([])
          }}
        />
      )}
      {selectedSupplierId && (
        <SupplierDetail
          supplierId={selectedSupplierId}
          suppliers={apiSuppliers}
          equipment={apiEquipment}
          contracts={apiContracts}
          valuations={apiValuations}
          invoices={apiInvoices}
          onDelete={() => handleDeleteSupplier(selectedSupplierId)}
          onClose={() => setSelectedSupplierId(null)}
        />
      )}
    </div>
  )
}

function renderView(
  view: View,
  dashboard: {
    activeContracts: ApiContract[]
    pendingPen: number
    pendingUsd: number
    dueSoon: ApiInvoice[]
    overdue: ApiInvoice[]
  },
  openQuickForm: (type: 'contrato' | 'valorizacion' | 'factura') => void,
  liveData: {
    suppliers: ApiSupplier[]
    users: ApiUser[]
    equipment: ApiEquipment[]
    contracts: ApiContract[]
    valuations: ApiValuation[]
    invoices: ApiInvoice[]
    dashboardSummary: DashboardSummary | null
    dueInvoicesReport: DueInvoicesReport | null
    costSummaryReport: CostSummaryReport | null
    equipmentTypes: ApiEquipmentType[]
    sites: ApiSite[]
    supplierLoadError: string
    equipmentLoadError: string
    contractLoadError: string
    valuationLoadError: string
    invoiceLoadError: string
    userLoadError: string
    onNewSupplier: () => void
    onNewEquipment: () => void
    onNewContract: () => void
    onNewValuation: () => void
    onNewInvoice: () => void
    onOpenPayment: (invoice: ApiInvoice) => void
    onOpenExtension: (invoice: ApiInvoice) => void
    onOpenInvoiceDetail: (invoice: ApiInvoice) => Promise<void>
    onOpenContractDetail: (contract: ApiContract) => Promise<void>
    onOpenEquipmentDetail: (equipment: ApiEquipment) => Promise<void>
    onOpenValuationDetail: (valuation: ApiValuation) => Promise<void>
    onOpenSupplierDetail: (id: string) => void
    onDeleteContract: (id: string) => Promise<void>
    onDeleteValuation: (id: string) => Promise<void>
    onDeleteInvoice: (id: string) => Promise<void>
    onOpenInvoicesPreset: (preset: Omit<TableFilterPreset, 'key'>) => void
    onRunAlerts: () => Promise<void>
    token: string
    onLoadReport: () => Promise<void>
    onLoadCostSummaryReport: () => Promise<void>
    invoiceFilterPreset: TableFilterPreset | null
    onCreateEquipmentType: (name: string) => Promise<void>
    onToggleEquipmentType: (id: string, isActive: boolean) => Promise<void>
    onToggleSite: (id: string, isActive: boolean) => Promise<void>
    alertSettings: AlertSettings | null
    onUpdateAlertSettings: (input: AlertSettings) => Promise<void>
    contractTemplate: ContractTemplateSettings | null
    onUpdateContractTemplate: (input: ContractTemplateSettings) => Promise<void>
    currentUser: AuthUser | null
    onCreateUser: (input: CreateUserInput) => Promise<void>
    onToggleUser: (targetUser: ApiUser, isActive: boolean) => Promise<void>
    onChangeUserRole: (targetUser: ApiUser, role: AuthUser['role']) => Promise<void>
    onDownloadImportTemplate: () => Promise<void>
    onImportExcel: (file: File, commit: boolean) => Promise<ImportResult>
  },
) {
  if (view === 'dashboard') {
    return (
      <Dashboard
        dashboard={dashboard}
        summary={liveData.dashboardSummary}
        invoices={liveData.invoices}
        openQuickForm={openQuickForm}
        onRunAlerts={liveData.onRunAlerts}
        onOpenInvoiceDetail={liveData.onOpenInvoiceDetail}
        onOpenInvoicesPreset={liveData.onOpenInvoicesPreset}
        equipment={liveData.equipment}
        contracts={liveData.contracts}
        valuations={liveData.valuations}
      />
    )
  }

  if (view === 'proveedores') {
    return (
      <DataSection
        title="Ficha de proveedores"
        description="Directorio documental con condiciones de pago, estado y acceso a historial."
        actionLabel="Nuevo proveedor"
        rows={liveData.suppliers}
        notice={liveData.supplierLoadError || undefined}
        onAction={liveData.onNewSupplier}
        renderAction={(row) => (
          <button type="button" className="text-button" onClick={() => liveData.onOpenSupplierDetail(String(row.id))}>
            Detalle
          </button>
        )}
        columns={[
          ['Razon social', 'businessName'],
          ['RUC', 'ruc'],
          ['Contacto', 'contactName'],
          ['Telefono', 'phone'],
          ['Pago', 'defaultPaymentTermDays'],
          ['Estado', 'status'],
        ]}
      />
    )
  }

  if (view === 'equipos') {
    return (
      <DataSection
        title="Equipos y vehiculos"
        actionLabel="Nuevo equipo"
        rows={liveData.equipment.map((item) => ({
          id: item.id,
          type: item.equipmentType.name,
          description: item.description,
          brand: item.brand ?? '',
          plate: item.plateOrInternalCode ?? '',
          site: item.currentSite?.name ?? '',
          status: item.status,
        }))}
        notice={liveData.equipmentLoadError || undefined}
        onAction={liveData.onNewEquipment}
        renderAction={(row) => {
          const equipment = liveData.equipment.find((item) => item.id === row.id)
          if (!equipment) return null
          return (
            <button type="button" className="text-button" onClick={() => void liveData.onOpenEquipmentDetail(equipment)}>
              Detalle
            </button>
          )
        }}
        columns={[
          ['Tipo', 'type'],
          ['Descripcion', 'description'],
          ['Marca', 'brand'],
          ['Placa/Codigo', 'plate'],
          ['Sede', 'site'],
          ['Estado', 'status'],
        ]}
      />
    )
  }

  if (view === 'contratos') {
    return (
      <DataSection
        title="Contratos de servicio"
        actionLabel="Nuevo contrato"
        rows={liveData.contracts.map((item) => ({
          id: item.id,
          number: item.contractNumber,
          supplier: item.supplier.businessName,
          site: item.site.name,
          equipment: item.contractEquipment
            .map((entry) => entry.equipment.plateOrInternalCode ?? entry.equipment.description)
            .join(', '),
          rate: Number(item.rate),
          currency: item.currency,
          status: item.status,
        }))}
        notice={liveData.contractLoadError || undefined}
        onAction={liveData.onNewContract}
        renderAction={(row) => {
          const contract = liveData.contracts.find((item) => item.id === row.id)
          if (!contract) return null
          return (
            <button type="button" className="text-button" onClick={() => void liveData.onOpenContractDetail(contract)}>
              Detalle
            </button>
          )
        }}
        columns={[
          ['Numero', 'number'],
          ['Proveedor', 'supplier'],
          ['Sede', 'site'],
          ['Equipo', 'equipment'],
          ['Tarifa', 'rate'],
          ['Estado', 'status'],
        ]}
      />
    )
  }

  if (view === 'valorizaciones') {
    return (
      <DataSection
        title="Valorizaciones"
        actionLabel="Nueva valorizacion"
        rows={liveData.valuations.map((item) => ({
          id: item.id,
          number: item.valuationNumber,
          contract: item.contract.contractNumber,
          cutoffDate: item.cutoffDate.slice(0, 10),
          quantity: Number(item.quantity),
          amount: Number(item.calculatedAmount),
          currency: item.currency,
          status: item.status,
        }))}
        notice={liveData.valuationLoadError || undefined}
        onAction={liveData.onNewValuation}
        renderAction={(row) => {
          const valuation = liveData.valuations.find((item) => item.id === row.id)
          if (!valuation) return null
          return (
            <button type="button" className="text-button" onClick={() => void liveData.onOpenValuationDetail(valuation)}>
              Detalle
            </button>
          )
        }}
        columns={[
          ['Numero', 'number'],
          ['Contrato', 'contract'],
          ['Corte', 'cutoffDate'],
          ['Cantidad', 'quantity'],
          ['Monto', 'amount'],
          ['Estado', 'status'],
        ]}
      />
    )
  }

  if (view === 'facturas') {
    return (
      <DataSection
        title="Facturas"
        description="Control central de vencimientos, prorrogas, pagos y documentos sustentatorios."
        actionLabel="Nueva factura"
        rows={liveData.invoices.map((item) => ({
          id: item.id,
          number: item.invoiceNumber,
          supplier: item.supplier.businessName,
          contract: item.contract.contractNumber,
          dueDate: item.dueDate.slice(0, 10),
          amount: Number(item.totalAmount),
          currency: item.currency,
          status: item.status,
        }))}
        notice={liveData.invoiceLoadError || undefined}
        onAction={liveData.onNewInvoice}
        filterPreset={liveData.invoiceFilterPreset}
        renderAction={(row) => {
          const invoice = liveData.invoices.find((item) => item.id === row.id)
          if (!invoice) return null
          return (
            <div className="row-actions">
              <button type="button" className="text-button" onClick={() => void liveData.onOpenInvoiceDetail(invoice)}>
                Detalle
              </button>
              {invoice.status !== 'PAGADA' && (
                <button type="button" className="text-button" onClick={() => liveData.onOpenPayment(invoice)}>
                  Marcar pagada
                </button>
              )}
              {invoice.status !== 'PAGADA' && (
                <button type="button" className="text-button" onClick={() => liveData.onOpenExtension(invoice)}>
                  Prorroga
                </button>
              )}
            </div>
          )
        }}
        columns={[
          ['Numero', 'number'],
          ['Proveedor', 'supplier'],
          ['Contrato', 'contract'],
          ['Vence', 'dueDate'],
          ['Monto', 'amount'],
          ['Estado', 'status'],
        ]}
      />
    )
  }

  if (view === 'reportes') {
    return (
      <Reports
        token={liveData.token}
        report={liveData.dueInvoicesReport}
        costReport={liveData.costSummaryReport}
        onLoadReport={liveData.onLoadReport}
        onLoadCostReport={liveData.onLoadCostSummaryReport}
      />
    )
  }

  return (
    <SettingsView
      equipmentTypes={liveData.equipmentTypes}
      sites={liveData.sites}
      onCreateEquipmentType={liveData.onCreateEquipmentType}
      onToggleEquipmentType={liveData.onToggleEquipmentType}
      onToggleSite={liveData.onToggleSite}
      alertSettings={liveData.alertSettings}
      onUpdateAlertSettings={liveData.onUpdateAlertSettings}
      contractTemplate={liveData.contractTemplate}
      onUpdateContractTemplate={liveData.onUpdateContractTemplate}
      users={liveData.users}
      userLoadError={liveData.userLoadError}
      currentUser={liveData.currentUser}
      onCreateUser={liveData.onCreateUser}
      onToggleUser={liveData.onToggleUser}
      onChangeUserRole={liveData.onChangeUserRole}
      onDownloadImportTemplate={liveData.onDownloadImportTemplate}
      onImportExcel={liveData.onImportExcel}
    />
  )
}

function Dashboard({
  dashboard,
  summary,
  invoices,
  openQuickForm,
  onRunAlerts,
  onOpenInvoiceDetail,
  onOpenInvoicesPreset,
  equipment = [],
  contracts = [],
  valuations = [],
}: {
  dashboard: {
    activeContracts: ApiContract[]
    pendingPen: number
    pendingUsd: number
    dueSoon: ApiInvoice[]
    overdue: ApiInvoice[]
  }
  summary: DashboardSummary | null
  invoices: ApiInvoice[]
  openQuickForm: (type: 'contrato' | 'valorizacion' | 'factura') => void
  onRunAlerts: () => Promise<void>
  onOpenInvoiceDetail: (invoice: ApiInvoice) => Promise<void>
  onOpenInvoicesPreset: (preset: Omit<TableFilterPreset, 'key'>) => void
  equipment?: ApiEquipment[]
  contracts?: ApiContract[]
  valuations?: ApiValuation[]
}) {
  const activeContractsTotal = summary?.activeContracts.total ?? dashboard.activeContracts.length
  const pendingPen = summary?.pendingInvoices.PEN ?? dashboard.pendingPen
  const pendingUsd = summary?.pendingInvoices.USD ?? dashboard.pendingUsd
  const dueSoon = summary?.dueSoonInvoices ?? dashboard.dueSoon
  const overdue = summary?.overdueInvoices ?? dashboard.overdue
  const [activeCurrency, setActiveCurrency] = useState<Currency>('PEN')
  const [hoveredSupplier, setHoveredSupplier] = useState<string | null>(null)

  // Calculate unpaid counts for trend indicators
  const unpaidPenCount = useMemo(() => {
    return invoices.filter(
      (inv) => inv.currency === 'PEN' && inv.status !== 'PAGADA' && inv.status !== 'ANULADA'
    ).length
  }, [invoices])

  const unpaidUsdCount = useMemo(() => {
    return invoices.filter(
      (inv) => inv.currency === 'USD' && inv.status !== 'PAGADA' && inv.status !== 'ANULADA'
    ).length
  }, [invoices])

  const equipmentStats = useMemo(() => {
    const stats = {
      DISPONIBLE: 0,
      EN_OBRA: 0,
      EN_MANTENIMIENTO: 0,
      RETIRADO: 0,
      total: 0
    }
    equipment.forEach((item) => {
      const status = item.status as keyof typeof stats
      if (status in stats) {
        stats[status]++
        stats.total++
      }
    })
    return stats
  }, [equipment])

  const chartData = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    const totals = new Map<string, number>()
    invoices
      .filter(
        (invoice) =>
          invoice.currency === activeCurrency &&
          invoice.status !== 'ANULADA' &&
          invoice.issueDate.slice(0, 7) === currentMonth,
      )
      .forEach((invoice) => {
        const supplierName = invoice.supplier.businessName
        totals.set(supplierName, (totals.get(supplierName) ?? 0) + Number(invoice.totalAmount))
      })

    const rows = Array.from(totals.entries())
      .map(([supplier, amount]) => ({ supplier, amount }))
      .sort((first, second) => second.amount - first.amount)
      .slice(0, 6)

    return rows.length > 0
      ? rows
      : [
          { supplier: 'Sin facturas registradas', amount: 0 },
        ]
  }, [activeCurrency, invoices])

  const maxChartAmount = Math.max(...chartData.map((item) => item.amount), 1)

  // Chronologically merged Operational Timeline Feed
  const timelineEvents = useMemo(() => {
    type TimelineEvent = {
      id: string
      type: 'contract' | 'valuation' | 'invoice' | 'invoice-paid'
      title: string
      desc: string
      date: string
      rawDate: Date
      amountStr: string
    }
    const events: TimelineEvent[] = []

    // 1. Process Contracts
    contracts.forEach((contract) => {
      if (!contract.startDate) return
      events.push({
        id: `contract-${contract.id}`,
        type: 'contract',
        title: 'Contrato Activado',
        desc: `Nº ${contract.contractNumber} con ${contract.supplier.businessName} para obra ${contract.site.name}`,
        date: contract.startDate.slice(0, 10),
        rawDate: new Date(contract.startDate),
        amountStr: `${money(Number(contract.rate), contract.currency)} / ${contract.billingMode === 'HORA' ? 'Hr' : 'Día'}`,
      })
    })

    // 2. Process Valuations
    valuations.forEach((valuation) => {
      if (!valuation.cutoffDate) return
      events.push({
        id: `valuation-${valuation.id}`,
        type: 'valuation',
        title: 'Valorización Registrada',
        desc: `Nº ${valuation.valuationNumber} por ${valuation.quantity} ${valuation.contract.billingMode === 'HORA' ? 'Hrs' : 'Días'} de ${valuation.equipment.description}`,
        date: valuation.cutoffDate.slice(0, 10),
        rawDate: new Date(valuation.cutoffDate),
        amountStr: money(Number(valuation.calculatedAmount), valuation.currency),
      })
    })

    // 3. Process Invoices
    invoices.forEach((invoice) => {
      if (invoice.status === 'ANULADA') return
      const equipmentDesc = invoice.valuation?.equipment?.description || 'Equipos'

      if (invoice.status === 'PAGADA' && invoice.paidAt) {
        events.push({
          id: `invoice-paid-${invoice.id}`,
          type: 'invoice-paid',
          title: 'Factura Cancelada',
          desc: `Nº ${invoice.invoiceNumber} de ${invoice.supplier.businessName} por alquiler de ${equipmentDesc}`,
          date: invoice.paidAt.slice(0, 10),
          rawDate: new Date(invoice.paidAt),
          amountStr: money(Number(invoice.totalAmount), invoice.currency),
        })
      } else {
        events.push({
          id: `invoice-${invoice.id}`,
          type: 'invoice',
          title: invoice.status === 'VENCIDA' ? 'Factura Vencida' : 'Factura Pendiente',
          desc: `Nº ${invoice.invoiceNumber} de ${invoice.supplier.businessName} por alquiler de ${equipmentDesc}`,
          date: invoice.issueDate.slice(0, 10),
          rawDate: new Date(invoice.issueDate),
          amountStr: money(Number(invoice.totalAmount), invoice.currency),
        })
      }
    })

    // Sort chronologically: most recent first
    return events
      .filter((e) => !isNaN(e.rawDate.getTime()))
      .sort((first, second) => second.rawDate.getTime() - first.rawDate.getTime())
      .slice(0, 5) // Get latest 5 events
  }, [contracts, valuations, invoices])

  return (
    <div className="dashboard-grid">
      <div className="dashboard-hero-banner" style={{
        gridColumn: '1 / -1',
        height: '160px',
        borderRadius: '12px',
        background: `linear-gradient(135deg, rgba(15, 76, 129, 0.95) 0%, rgba(0, 139, 139, 0.85) 100%), url('/brand/dashboard_banner.png') no-repeat center center`,
        backgroundSize: 'cover',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '32px 40px',
        color: '#ffffff',
        boxShadow: 'var(--shadow-tight)',
        marginBottom: '4px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ zIndex: 2 }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px', letterSpacing: '-0.5px', color: '#ffffff' }}>Panel de Control Financiero</h2>
          <p style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: '500', opacity: 0.9 }}>
            Industrias y Servicios Electro-Mecánicos SRL — Gestión de Maquinaria y Equipos
          </p>
        </div>
        <div style={{
          zIndex: 2,
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(8px)',
          borderRadius: '8px',
          padding: '12px 18px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          fontSize: '12px',
          fontWeight: '700',
          letterSpacing: '0.5px',
          textTransform: 'uppercase'
        }}>
          PERÚ / LIMA
        </div>
      </div>

      <section className="metric-grid" aria-label="Resumen ejecutivo">
        <Metric
          icon={ClipboardList}
          label="Contratos activos"
          value={activeContractsTotal.toString()}
          detail={`${summary?.activeContracts.bySite.length ?? 0} sedes con contratos vigentes`}
          tone="info"
          trend={{ text: 'Saludable', type: 'up' }}
        />
        <button
          type="button"
          className="metric-button"
          onClick={() => onOpenInvoicesPreset({ currency: 'PEN', custom: 'NO_PAGADAS' })}
        >
          <Metric
            icon={BadgeDollarSign}
            label="Pendiente PEN"
            value={money(pendingPen, 'PEN')}
            detail="Ver facturas no pagadas"
            tone="warning"
            trend={unpaidPenCount > 0 ? { text: `${unpaidPenCount} por pagar`, type: 'alert' } : { text: 'Al corriente', type: 'up' }}
          />
        </button>
        <button
          type="button"
          className="metric-button"
          onClick={() => onOpenInvoicesPreset({ currency: 'USD', custom: 'NO_PAGADAS' })}
        >
          <Metric
            icon={BadgeDollarSign}
            label="Pendiente USD"
            value={money(pendingUsd, 'USD')}
            detail="Ver facturas no pagadas"
            tone="warning"
            trend={unpaidUsdCount > 0 ? { text: `${unpaidUsdCount} por pagar`, type: 'alert' } : { text: 'Al corriente', type: 'up' }}
          />
        </button>
        <button
          type="button"
          className="metric-button"
          onClick={() => onOpenInvoicesPreset({ status: 'VENCIDA' })}
        >
          <Metric
            icon={AlertTriangle}
            label="Vencidas"
            value={overdue.length.toString()}
            detail="Ver facturas vencidas"
            tone="danger"
            trend={overdue.length > 0 ? { text: 'Acción requerida', type: 'down' } : { text: 'Sin retrasos', type: 'up' }}
          />
        </button>
      </section>

      <section className="work-panel alerts-panel">
        <div className="section-heading">
          <div>
            <h2>Alertas activas</h2>
            <p>Las alertas permanecen hasta registrar el pago.</p>
          </div>
          <button type="button" className="icon-button" aria-label="Actualizar alertas" onClick={onRunAlerts}>
            <CalendarClock size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="alert-list">
          {[...overdue, ...dueSoon].map((invoice) => {
            const supplierName = invoice.supplier.businessName
            const invoiceNumber = invoice.invoiceNumber
            const amount = Number(invoice.totalAmount)
            const dueDate = invoice.dueDate.length > 10 ? invoice.dueDate.slice(0, 10) : invoice.dueDate
            const invoiceForDetail = invoices.find((item) => item.id === invoice.id) ?? null
            return (
            <button
              key={invoice.id}
              type="button"
              className={invoice.status === 'VENCIDA' ? 'alert-row danger' : 'alert-row'}
              onClick={() => invoiceForDetail && void onOpenInvoiceDetail(invoiceForDetail)}
            >
              <div>
                <strong>{invoiceNumber}</strong>
                <span>{supplierName}</span>
              </div>
              <div>
                <strong>{money(amount, invoice.currency)}</strong>
                <span>Vence {dueDate}</span>
              </div>
              <StatusPill status={invoice.status} />
            </button>
          )})}
          {[...overdue, ...dueSoon].length === 0 && (
            <p className="empty-message">No hay alertas activas por ahora.</p>
          )}
        </div>
      </section>

      <section className="work-panel chart-panel">
        <div className="section-heading">
          <div>
            <h2>Gasto mensual por proveedor</h2>
            <p>Facturas emitidas este mes, separadas por moneda.</p>
          </div>
          <div className="segmented-control" aria-label="Moneda del grafico">
            {(['PEN', 'USD'] as Currency[]).map((currency) => (
              <button
                key={currency}
                type="button"
                className={activeCurrency === currency ? 'active' : ''}
                onClick={() => setActiveCurrency(currency)}
              >
                {currency}
              </button>
            ))}
          </div>
        </div>
        <div className="financial-chart" role="img" aria-label="Gasto por proveedor">
          {chartData.map((item, index) => {
            const height = item.amount > 0 ? Math.max(18, (item.amount / maxChartAmount) * 100) : 8
            const isActive = hoveredSupplier === item.supplier
            return (
              <button
                key={item.supplier}
                type="button"
                className={isActive ? 'chart-column active' : 'chart-column'}
                onMouseEnter={() => setHoveredSupplier(item.supplier)}
                onMouseLeave={() => setHoveredSupplier(null)}
                onFocus={() => setHoveredSupplier(item.supplier)}
                onBlur={() => setHoveredSupplier(null)}
                aria-label={`${item.supplier}: ${money(item.amount, activeCurrency)}`}
              >
                <span className="chart-value">{money(item.amount, activeCurrency)}</span>
                <span
                  className="chart-bar"
                  style={{
                    height: `${height}%`,
                    transitionDelay: `${index * 35}ms`,
                  }}
                />
                <span className="chart-label">{item.supplier}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="work-panel fleet-status-panel">
        <div className="section-heading">
          <div>
            <h2>Estado de la Flota de Equipos</h2>
            <p>Disponibilidad y distribución operativa de la maquinaria.</p>
          </div>
        </div>
        <div className="fleet-stats-grid">
          {[
            { label: 'Disponible', count: equipmentStats.DISPONIBLE, key: 'DISPONIBLE', class: 'success', color: 'var(--success)' },
            { label: 'En Obra', count: equipmentStats.EN_OBRA, key: 'EN_OBRA', class: 'info', color: 'var(--info)' },
            { label: 'En Mantenimiento', count: equipmentStats.EN_MANTENIMIENTO, key: 'EN_MANTENIMIENTO', class: 'warning', color: 'var(--warning)' },
            { label: 'Fuera de Servicio', count: equipmentStats.RETIRADO, key: 'RETIRADO', class: 'danger', color: 'var(--danger)' }
          ].map((item) => {
            const percentage = equipmentStats.total > 0 ? Math.round((item.count / equipmentStats.total) * 100) : 0
            return (
              <div key={item.key} className={`fleet-card ${item.class}`}>
                <div className="fleet-card-glow" />
                <div className="fleet-card-content">
                  <span className={`status ${item.class}`}>{item.label}</span>
                  <div className="fleet-card-body">
                    <div>
                      <strong className="fleet-card-count">{item.count}</strong>
                      <span className="fleet-card-unit">{item.count === 1 ? 'unidad' : 'unidades'}</span>
                    </div>
                    <div 
                      className="fleet-donut-chart" 
                      style={{ 
                        background: `conic-gradient(${item.color} ${percentage}%, var(--surface-strong) 0)` 
                      }}
                    >
                      <span>{percentage}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="work-panel timeline-panel">
        <div className="section-heading">
          <div>
            <h2>Actividad Operativa Reciente</h2>
            <p>Línea de tiempo consolidada de contratos, valorizaciones y pagos.</p>
          </div>
        </div>
        <div className="timeline-feed">
          {timelineEvents.map((event) => {
            let BadgeIcon = FileText
            if (event.type === 'contract') BadgeIcon = ClipboardList
            else if (event.type === 'valuation') BadgeIcon = FileBarChart
            else if (event.type === 'invoice-paid') BadgeIcon = CheckCircle2

            return (
              <div key={event.id} className="timeline-item">
                <div className={`timeline-badge ${event.type}`} title={event.title}>
                  <BadgeIcon size={13} aria-hidden="true" />
                </div>
                <div className="timeline-item-content">
                  <div className="timeline-item-header">
                    <span className="timeline-item-title">{event.title}</span>
                    <span className="timeline-item-date">{event.date}</span>
                  </div>
                  <p className="timeline-item-desc">{event.desc}</p>
                  <span className="timeline-item-amount">{event.amountStr}</span>
                </div>
              </div>
            )
          })}
          {timelineEvents.length === 0 && (
            <p className="empty-message">No se registran eventos operativos recientes.</p>
          )}
        </div>
      </section>

      <section className="quick-actions" aria-label="Accesos rapidos">
        <button type="button" onClick={() => openQuickForm('contrato')}>
          <Plus size={18} />
          Nuevo contrato
        </button>
        <button type="button" onClick={() => openQuickForm('valorizacion')}>
          <Plus size={18} />
          Nueva valorizacion
        </button>
        <button type="button" onClick={() => openQuickForm('factura')}>
          <Plus size={18} />
          Nueva factura
        </button>
      </section>
    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'default',
  trend,
}: {
  icon: typeof LayoutDashboard
  label: string
  value: string
  detail: string
  tone?: 'default' | 'danger' | 'warning' | 'success' | 'info'
  trend?: { text: string; type: 'up' | 'down' | 'neutral' | 'alert' }
}) {
  return (
    <article className={`metric ${tone}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div className="metric-icon">
          <Icon size={19} aria-hidden="true" />
        </div>
        {trend && (
          <span className={`metric-trend ${trend.type}`}>
            {trend.text}
          </span>
        )}
      </div>
      <div style={{ display: 'grid', gap: '4px' }}>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  )
}

function DataSection<T extends Record<string, unknown>>({
  title,
  description,
  actionLabel,
  rows,
  columns,
  notice,
  onAction,
  renderAction,
  filterPreset,
}: {
  title: string
  description?: string
  actionLabel: string
  rows: T[]
  columns: Array<[string, keyof T]>
  notice?: string
  onAction?: () => void
  renderAction?: (row: T) => ReactNode
  filterPreset?: TableFilterPreset | null
}) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('TODOS')
  const [siteFilter, setSiteFilter] = useState('TODAS')
  const [currencyFilter, setCurrencyFilter] = useState('TODAS')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [customFilter, setCustomFilter] = useState<TableFilterPreset['custom'] | null>(null)

  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => (typeof row.status === 'string' ? row.status : ''))
            .filter(Boolean),
        ),
      ),
    [rows],
  )
  const siteOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => (typeof row.site === 'string' ? row.site : ''))
            .filter(Boolean),
        ),
      ),
    [rows],
  )
  const currencyOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => (typeof row.currency === 'string' ? row.currency : ''))
            .filter(Boolean),
        ),
      ),
    [rows],
  )
  const dateKey = useMemo(() => {
    const preferredKeys = ['dueDate', 'cutoffDate', 'startDate', 'endDate']
    return preferredKeys.find((key) => rows.some((row) => typeof row[key] === 'string')) ?? ''
  }, [rows])

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        columns.some(([, key]) => String(row[key] ?? '').toLowerCase().includes(normalizedQuery))
      const matchesStatus = statusFilter === 'TODOS' || row.status === statusFilter
      const matchesSite = siteFilter === 'TODAS' || row.site === siteFilter
      const matchesCurrency = currencyFilter === 'TODAS' || row.currency === currencyFilter
      const matchesCustom = customFilter !== 'NO_PAGADAS' || row.status !== 'PAGADA'
      const rowDate = dateKey ? String(row[dateKey] ?? '').slice(0, 10) : ''
      const matchesFrom = !dateFrom || (rowDate && rowDate >= dateFrom)
      const matchesTo = !dateTo || (rowDate && rowDate <= dateTo)

      return matchesQuery && matchesStatus && matchesSite && matchesCurrency && matchesCustom && matchesFrom && matchesTo
    })
  }, [columns, currencyFilter, customFilter, dateFrom, dateKey, dateTo, query, rows, siteFilter, statusFilter])

  useEffect(() => {
    if (!filterPreset) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(filterPreset.query ?? '')
    setStatusFilter(filterPreset.status ?? 'TODOS')
    setSiteFilter(filterPreset.site ?? 'TODAS')
    setCurrencyFilter(filterPreset.currency ?? 'TODAS')
    setDateFrom(filterPreset.dateFrom ?? '')
    setDateTo(filterPreset.dateTo ?? '')
    setCustomFilter(filterPreset.custom ?? null)
  }, [filterPreset])

  const resetFilters = () => {
    setQuery('')
    setStatusFilter('TODOS')
    setSiteFilter('TODAS')
    setCurrencyFilter('TODAS')
    setDateFrom('')
    setDateTo('')
    setCustomFilter(null)
  }
  const totalPen = filteredRows.reduce(
    (total, row) =>
      row.currency === 'PEN' && typeof row.amount === 'number' ? total + row.amount : total,
    0,
  )
  const totalUsd = filteredRows.reduce(
    (total, row) =>
      row.currency === 'USD' && typeof row.amount === 'number' ? total + row.amount : total,
    0,
  )
  const activeStatusCount = filteredRows.filter((row) => row.status === 'ACTIVO' || row.status === 'PENDIENTE').length
  const criticalStatusCount = filteredRows.filter((row) => row.status === 'VENCIDA' || row.status === 'OBSERVADA').length

  return (
    <section className="work-panel data-panel">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>{description ?? 'Listado operativo con filtros base y estados visibles.'}</p>
        </div>
        <button type="button" className="primary-button" onClick={onAction}>
          <Plus size={17} />
          {actionLabel}
        </button>
      </div>

      {notice && <div className="inline-alert">{notice}</div>}

      <div className="data-summary-strip" aria-label="Resumen del listado">
        <article>
          <span>Registros visibles</span>
          <strong>{filteredRows.length}</strong>
        </article>
        <article>
          <span>Activos / pendientes</span>
          <strong>{activeStatusCount}</strong>
        </article>
        <article>
          <span>Alertas</span>
          <strong>{criticalStatusCount}</strong>
        </article>
        {currencyOptions.length > 0 && (
          <>
            <article>
              <span>Total PEN</span>
              <strong>{money(totalPen, 'PEN')}</strong>
            </article>
            <article>
              <span>Total USD</span>
              <strong>{money(totalUsd, 'USD')}</strong>
            </article>
          </>
        )}
      </div>

      <div className="filters-row">
        <label>
          Buscar
          <input
            value={query}
            placeholder="Texto libre"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {statusOptions.length > 0 && (
          <label>
            Estado
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="TODOS">Todos</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {prettyStatus(status)}
                </option>
              ))}
            </select>
          </label>
        )}
        {siteOptions.length > 0 && (
          <label>
            Sede
            <select value={siteFilter} onChange={(event) => setSiteFilter(event.target.value)}>
              <option value="TODAS">Todas</option>
              {siteOptions.map((site) => (
                <option key={site} value={site}>
                  {site}
                </option>
              ))}
            </select>
          </label>
        )}
        {currencyOptions.length > 0 && (
          <label>
            Moneda
            <select value={currencyFilter} onChange={(event) => setCurrencyFilter(event.target.value)}>
              <option value="TODAS">Todas</option>
              {currencyOptions.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>
        )}
        {dateKey && (
          <>
            <label>
              Desde
              <input value={dateFrom} type="date" onChange={(event) => setDateFrom(event.target.value)} />
            </label>
            <label>
              Hasta
              <input value={dateTo} type="date" onChange={(event) => setDateTo(event.target.value)} />
            </label>
          </>
        )}
        <div className="filter-summary">
          <span>
            {filteredRows.length} de {rows.length}
          </span>
          {customFilter === 'NO_PAGADAS' && <small>No pagadas</small>}
          <button type="button" className="text-button" onClick={resetFilters}>
            Limpiar
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map(([label]) => (
                <th key={label}>{label}</th>
              ))}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, index) => (
              <tr
                key={String(row.id ?? index)}
                className={row.status === 'VENCIDA' || row.status === 'OBSERVADA' ? 'table-row-critical' : ''}
              >
                {columns.map(([label, key]) => {
                  const value = row[key]
                  const isStatus = label === 'Estado'
                  const isAmount = label === 'Monto'
                  const currency = typeof row.currency === 'string' ? (row.currency as Currency) : 'PEN'
                  return (
                    <td key={String(key)}>
                      {isStatus && typeof value === 'string' ? (
                        <StatusPill status={value} />
                      ) : isAmount && typeof value === 'number' ? (
                        money(value, currency)
                      ) : label === 'Tarifa' && typeof value === 'number' ? (
                        money(value, currency)
                      ) : label === 'Pago' ? (
                        `${String(value)} dias`
                      ) : typeof value === 'string' ? (
                        prettyStatus(value)
                      ) : (
                        String(value)
                      )}
                    </td>
                  )
                })}
                <td>
                  {renderAction?.(row) ?? (
                    <button type="button" className="text-button">
                      Ver detalle
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1}>
                  {rows.length === 0 ? 'No hay registros para mostrar.' : 'No hay registros con esos filtros.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function SearchPanel({
  results,
  onSelectSupplier,
}: {
  results: SearchResults
  onSelectSupplier: (id: string) => void
}) {
  const hasResults =
    results.suppliers.length +
      results.equipment.length +
      results.contracts.length +
      results.valuations.length +
      results.invoices.length >
    0

  return (
    <div className="search-panel">
      {!hasResults && <p>No se encontraron resultados.</p>}
      {results.suppliers.length > 0 && (
        <SearchGroup title="Proveedores">
          {results.suppliers.map((supplier) => (
            <button key={supplier.id} type="button" onClick={() => onSelectSupplier(supplier.id)}>
              <strong>{supplier.businessName}</strong>
              <span>{supplier.ruc}</span>
            </button>
          ))}
        </SearchGroup>
      )}
      {results.equipment.length > 0 && (
        <SearchGroup title="Equipos">
          {results.equipment.map((item) => (
            <div key={item.id} className="search-item">
              <strong>{item.plateOrInternalCode ?? item.description}</strong>
              <span>{item.supplier.businessName}</span>
            </div>
          ))}
        </SearchGroup>
      )}
      {results.contracts.length > 0 && (
        <SearchGroup title="Contratos">
          {results.contracts.map((item) => (
            <div key={item.id} className="search-item">
              <strong>{item.contractNumber}</strong>
              <span>{item.supplier.businessName}</span>
            </div>
          ))}
        </SearchGroup>
      )}
      {results.invoices.length > 0 && (
        <SearchGroup title="Facturas">
          {results.invoices.map((item) => (
            <div key={item.id} className="search-item">
              <strong>{item.invoiceNumber}</strong>
              <span>{item.supplier.businessName} - {item.status}</span>
            </div>
          ))}
        </SearchGroup>
      )}
    </div>
  )
}

function NotificationsPanel({
  overdue,
  dueSoon,
  invoices,
  onOpenInvoiceDetail,
  onClose,
}: {
  overdue: ApiInvoice[]
  dueSoon: ApiInvoice[]
  invoices: ApiInvoice[]
  onOpenInvoiceDetail: (invoice: ApiInvoice) => Promise<void>
  onClose: () => void
}) {
  const hasAlerts = overdue.length + dueSoon.length > 0

  return (
    <>
      <div className="notifications-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="notifications-panel">
        <div className="notifications-header">
          <h3>Alertas y Notificaciones</h3>
          <span>({overdue.length + dueSoon.length})</span>
        </div>
        <div className="notifications-list">
          {!hasAlerts && <p className="notifications-empty">No hay alertas activas por el momento.</p>}
          {[...overdue, ...dueSoon].map((invoice) => {
            const supplierName = invoice.supplier.businessName
            const invoiceNumber = invoice.invoiceNumber
            const amount = Number(invoice.totalAmount)
            const dueDate = invoice.dueDate.length > 10 ? invoice.dueDate.slice(0, 10) : invoice.dueDate
            const invoiceForDetail = invoices.find((item) => item.id === invoice.id) ?? null

            return (
              <button
                key={invoice.id}
                type="button"
                className={`notification-item ${invoice.status === 'VENCIDA' ? 'danger' : ''}`}
                onClick={() => {
                  if (invoiceForDetail) {
                    void onOpenInvoiceDetail(invoiceForDetail)
                  }
                }}
              >
                <div className="notification-item-icon">
                  <AlertTriangle size={15} />
                </div>
                <div className="notification-item-content">
                  <strong>{invoiceNumber}</strong>
                  <span>{supplierName}</span>
                  <small>
                    Vence: {dueDate} • <b>{money(amount, invoice.currency)}</b>
                  </small>
                </div>
                <StatusPill status={invoice.status} />
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

function SearchGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  )
}

function SupplierDetail({
  supplierId,
  suppliers,
  equipment,
  contracts,
  valuations,
  invoices,
  onClose,
  onDelete,
}: {
  supplierId: string
  suppliers: ApiSupplier[]
  equipment: ApiEquipment[]
  contracts: ApiContract[]
  valuations: ApiValuation[]
  invoices: ApiInvoice[]
  onClose: () => void
  onDelete?: () => void
}) {
  const supplier = suppliers.find((item) => item.id === supplierId)
  if (!supplier) return null

  const supplierEquipment = equipment.filter((item) => item.supplierId === supplier.id)
  const supplierContracts = contracts.filter((item) => item.supplierId === supplier.id)
  const supplierInvoices = invoices.filter((item) => item.supplierId === supplier.id)
  const pending = supplierInvoices.filter((item) => item.status !== 'PAGADA')
  const totals = pending.reduce(
    (acc, invoice) => {
      acc[invoice.currency] += Number(invoice.totalAmount)
      return acc
    },
    { PEN: 0, USD: 0 },
  )
  const contractIds = new Set(supplierContracts.map((contract) => contract.id))
  const supplierValuations = valuations.filter((valuation) => contractIds.has(valuation.contractId))

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal supplier-detail" role="dialog" aria-modal="true" aria-labelledby="supplier-detail-title">
        <div className="section-heading">
          <div>
            <h2 id="supplier-detail-title">{supplier.businessName}</h2>
            <p>{supplier.ruc}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {onDelete && (
              <button
                type="button"
                className="text-button"
                style={{
                  color: 'var(--danger)',
                  background: 'var(--soft-red)',
                  borderColor: 'rgba(239, 68, 68, 0.25)',
                }}
                onClick={onDelete}
              >
                Eliminar proveedor
              </button>
            )}
            <button type="button" className="icon-button" aria-label="Cerrar detalle" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="detail-grid">
          <Metric icon={Truck} label="Equipos" value={supplierEquipment.length.toString()} detail="Registrados" />
          <Metric icon={ClipboardList} label="Contratos" value={supplierContracts.length.toString()} detail="Historial" />
          <Metric icon={FileText} label="Pendiente PEN" value={money(totals.PEN, 'PEN')} detail="No pagado" />
          <Metric icon={FileText} label="Pendiente USD" value={money(totals.USD, 'USD')} detail="No pagado" />
        </div>

        <div className="folder-row">
          <div>
            <strong>Carpeta documental</strong>
            <span>{supplier.folderPath ?? 'Sin carpeta registrada'}</span>
          </div>
          <button
            type="button"
            className="text-button"
            onClick={() => supplier.folderPath && navigator.clipboard.writeText(supplier.folderPath)}
          >
            Copiar ruta
          </button>
        </div>

        <div className="plain-sections">
          <section>
            <h3>Equipos</h3>
            <div className="detail-list">
              {supplierEquipment.map((item) => (
                <article key={item.id}>
                  <strong>{item.plateOrInternalCode ?? item.description}</strong>
                  <span>{item.description}</span>
                  <StatusPill status={item.status} />
                </article>
              ))}
              {supplierEquipment.length === 0 && <p>Sin equipos registrados.</p>}
            </div>
          </section>
          <section>
            <h3>Facturas pendientes</h3>
            <div className="detail-list">
              {pending.map((invoice) => (
                <article key={invoice.id}>
                  <strong>{invoice.invoiceNumber}</strong>
                  <span>Vence {invoice.dueDate.slice(0, 10)}</span>
                  <b>{money(Number(invoice.totalAmount), invoice.currency)}</b>
                  <StatusPill status={invoice.status} />
                </article>
              ))}
              {pending.length === 0 && <p>Sin facturas pendientes.</p>}
            </div>
          </section>
          <section>
            <h3>Valorizaciones</h3>
            <div className="detail-list">
              {supplierValuations.map((valuation) => (
                <article key={valuation.id}>
                  <strong>{valuation.valuationNumber}</strong>
                  <span>{valuation.cutoffDate.slice(0, 10)}</span>
                  <b>{money(Number(valuation.calculatedAmount), valuation.currency)}</b>
                  <StatusPill status={valuation.status} />
                </article>
              ))}
              {supplierValuations.length === 0 && <p>Sin valorizaciones registradas.</p>}
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}

function SessionLoadingScreen() {
  return (
    <main className="login-page">
      <div className="login-backdrop" aria-hidden="true" />
      <section className="login-panel">
        <div className="login-brand">
          <div className="login-logo-frame">
            <img src="/brand/isem-logo.png" alt="ISEM" />
          </div>
          <div>
            <p className="eyebrow">INDUSTRIAS Y SERVICIOS ELECTRO-MECANICOS SRL</p>
            <h1>Verificando acceso</h1>
            <span>Validando la sesion guardada en este navegador</span>
          </div>
        </div>
      </section>
    </main>
  )
}

function LoginScreen({ onLogin }: { onLogin: (token: string, user: AuthUser) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(getApiConfigurationError())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      const result = await login(email.trim().toLowerCase(), password)
      onLogin(result.token, result.user)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo iniciar sesion')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-backdrop" aria-hidden="true" />
      <div className="login-status-stack" aria-hidden="true">
        <span>
          <Server size={14} />
          Servidor local operativo
        </span>
        <span>
          <ShieldCheck size={14} />
          Conexion segura
        </span>
      </div>
      <section className="login-panel">
        <div className="login-brand">
          <div className="login-logo-frame">
            <img src="/brand/isem-logo.png" alt="ISEM" />
          </div>
          <div>
            <p className="eyebrow">INDUSTRIAS Y SERVICIOS ELECTRO-MECANICOS SRL</p>
            <h1>Acceso Corporativo</h1>
            <span>Control de alquileres, valorizaciones y facturas</span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <label className="field-with-icon">
            Usuario / correo
            <span>
              <Mail size={17} aria-hidden="true" />
              <input
                type="email"
                value={email}
                autoComplete="off"
                placeholder="correo@empresa.com"
                onChange={(event) => setEmail(event.target.value.trim().toLowerCase())}
              />
            </span>
          </label>
          <label className="field-with-icon">
            Contrasena
            <span>
              <Lock size={17} aria-hidden="true" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                autoComplete="off"
                placeholder="Ingrese su contrasena"
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>
          {error && <div className="inline-alert">{error}</div>}
          <button type="submit" className="primary-button" disabled={isSubmitting || !email || !password}>
            {isSubmitting ? 'Verificando...' : 'Iniciar sesion'}
            {!isSubmitting && <LogIn size={17} aria-hidden="true" />}
          </button>
        </form>
        <footer className="login-footer">
          <span>RUC 20220199968</span>
          <span>Perú/Lima</span>
        </footer>
      </section>
    </main>
  )
}

function SupplierForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (input: CreateSupplierInput) => Promise<void>
}) {
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const input: CreateSupplierInput = {
      businessName: String(formData.get('businessName') ?? ''),
      ruc: String(formData.get('ruc') ?? ''),
      contactName: String(formData.get('contactName') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      email: String(formData.get('email') ?? ''),
      address: String(formData.get('address') ?? ''),
      bankName: String(formData.get('bankName') ?? ''),
      bankAccountNumber: String(formData.get('bankAccountNumber') ?? ''),
      defaultPaymentTermDays: Number(formData.get('defaultPaymentTermDays') ?? 30),
    }

    setIsSubmitting(true)
    setError('')
    try {
      await onSubmit(input)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar proveedor')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="supplier-form-title">
        <div className="section-heading">
          <div>
            <h2 id="supplier-form-title">Nuevo proveedor</h2>
            <p>Al guardar se crea tambien su carpeta documental visible.</p>
          </div>
          <button type="button" className="icon-button" aria-label="Cerrar formulario" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form className="quick-form" onSubmit={handleSubmit}>
          <label>
            Razon social
            <input name="businessName" required />
          </label>
          <label>
            RUC
            <input name="ruc" required minLength={11} maxLength={11} />
          </label>
          <label>
            Contacto
            <input name="contactName" />
          </label>
          <label>
            Telefono
            <input name="phone" />
          </label>
          <label>
            Correo
            <input name="email" type="email" />
          </label>
          <label>
            Plazo pago
            <input name="defaultPaymentTermDays" type="number" defaultValue="30" min="1" />
          </label>
          <label>
            Banco
            <input name="bankName" />
          </label>
          <label>
            Cuenta
            <input name="bankAccountNumber" />
          </label>
          <label className="wide-field">
            Direccion
            <input name="address" />
          </label>
          {error && <div className="inline-alert wide-field">{error}</div>}
          <div className="form-actions wide-field">
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar proveedor'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function EquipmentForm({
  suppliers,
  equipmentTypes,
  sites,
  onClose,
  onSubmit,
}: {
  suppliers: ApiSupplier[]
  equipmentTypes: ApiEquipmentType[]
  sites: ApiSite[]
  onClose: () => void
  onSubmit: (input: CreateEquipmentInput) => Promise<void>
}) {
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<CreateEquipmentInput['status']>('DISPONIBLE')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const currentSiteId = String(formData.get('currentSiteId') ?? '')
    const year = String(formData.get('year') ?? '')
    const input: CreateEquipmentInput = {
      supplierId: String(formData.get('supplierId') ?? ''),
      equipmentTypeId: String(formData.get('equipmentTypeId') ?? ''),
      currentSiteId: currentSiteId || undefined,
      description: String(formData.get('description') ?? ''),
      brand: String(formData.get('brand') ?? ''),
      model: String(formData.get('model') ?? ''),
      year: year ? Number(year) : undefined,
      plateOrInternalCode: String(formData.get('plateOrInternalCode') ?? ''),
      status,
    }

    setIsSubmitting(true)
    setError('')
    try {
      await onSubmit(input)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar equipo')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="equipment-form-title">
        <div className="section-heading">
          <div>
            <h2 id="equipment-form-title">Nuevo equipo</h2>
            <p>Se creara una carpeta visible dentro del proveedor seleccionado.</p>
          </div>
          <button type="button" className="icon-button" aria-label="Cerrar formulario" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form className="quick-form" onSubmit={handleSubmit}>
          <label>
            Proveedor
            <select name="supplierId" required>
              <option value="">Seleccionar</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.businessName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tipo
            <select name="equipmentTypeId" required>
              <option value="">Seleccionar</option>
              {equipmentTypes.filter((type) => type.isActive).map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estado
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as CreateEquipmentInput['status'])}
            >
              <option value="DISPONIBLE">Disponible</option>
              <option value="EN_OBRA">En obra</option>
              <option value="EN_MANTENIMIENTO">En mantenimiento</option>
              <option value="RETIRADO">Retirado</option>
              <option value="FINALIZADO">Finalizado</option>
            </select>
          </label>
          <label className="wide-field">
            Descripcion
            <input name="description" required />
          </label>
          <label>
            Marca
            <input name="brand" />
          </label>
          <label>
            Modelo
            <input name="model" />
          </label>
          <label>
            Anio
            <input name="year" type="number" min="1900" max="2100" />
          </label>
          <label>
            Placa o codigo
            <input name="plateOrInternalCode" />
          </label>
          <label>
            Sede
            <select name="currentSiteId" required={status === 'EN_OBRA'}>
              <option value="">Sin sede</option>
              {sites.filter((site) => site.isActive).map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </label>
          {error && <div className="inline-alert wide-field">{error}</div>}
          <div className="form-actions wide-field">
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar equipo'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function ContractForm({
  suppliers,
  equipment,
  sites,
  onClose,
  onSubmit,
}: {
  suppliers: ApiSupplier[]
  equipment: ApiEquipment[]
  sites: ApiSite[]
  onClose: () => void
  onSubmit: (input: CreateContractInput) => Promise<void>
}) {
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [supplierId, setSupplierId] = useState('')
  const [billingMode, setBillingMode] = useState<CreateContractInput['billingMode']>('HORA')
  const [currency, setCurrency] = useState<CreateContractInput['currency']>('PEN')

  const supplierEquipment = equipment.filter((item) => item.supplierId === supplierId)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const equipmentIds = formData.getAll('equipmentIds').map(String)
    const input: CreateContractInput = {
      supplierId,
      siteId: String(formData.get('siteId') ?? ''),
      contractNumber: String(formData.get('contractNumber') ?? ''),
      equipmentIds,
      startDate: String(formData.get('startDate') ?? ''),
      endDate: String(formData.get('endDate') ?? ''),
      billingMode,
      rate: Number(formData.get('rate') ?? 0),
      currency,
      invoiceDueDays: Number(formData.get('invoiceDueDays') ?? 30),
      notes: String(formData.get('notes') ?? ''),
      status: String(formData.get('status') ?? 'ACTIVO') as CreateContractInput['status'],
    }

    setIsSubmitting(true)
    setError('')
    try {
      await onSubmit(input)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar contrato')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="contract-form-title">
        <div className="section-heading">
          <div>
            <h2 id="contract-form-title">Nuevo contrato</h2>
            <p>Se crearan carpetas para contrato firmado, orden de servicio y valorizaciones.</p>
          </div>
          <button type="button" className="icon-button" aria-label="Cerrar formulario" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form className="quick-form" onSubmit={handleSubmit}>
          <label>
            Proveedor
            <select
              required
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value)}
            >
              <option value="">Seleccionar</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.businessName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sede
            <select name="siteId" required>
              <option value="">Seleccionar</option>
              {sites.filter((site) => site.isActive).map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Numero
            <input name="contractNumber" defaultValue={`ISEM-${new Date().getFullYear()}-`} required />
          </label>
          <fieldset className="wide-field check-list">
            <legend>Equipos del proveedor</legend>
            {supplierEquipment.length === 0 && <span>Seleccione un proveedor con equipos registrados.</span>}
            {supplierEquipment.map((item) => (
              <label key={item.id} className="check-row">
                <input type="checkbox" name="equipmentIds" value={item.id} />
                <span>{item.plateOrInternalCode ?? item.description}</span>
              </label>
            ))}
          </fieldset>
          <label>
            Inicio
            <input name="startDate" type="date" required />
          </label>
          <label>
            Fin
            <input name="endDate" type="date" required />
          </label>
          <label>
            Estado
            <select name="status">
              <option value="ACTIVO">Activo</option>
              <option value="BORRADOR">Borrador</option>
            </select>
          </label>
          <label>
            Modalidad
            <select
              value={billingMode}
              onChange={(event) => setBillingMode(event.target.value as CreateContractInput['billingMode'])}
            >
              <option value="HORA">Por hora</option>
              <option value="DIA">Por dia</option>
            </select>
          </label>
          <label>
            Tarifa
            <input name="rate" type="number" min="0.01" step="0.01" required />
          </label>
          <label>
            Moneda
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value as CreateContractInput['currency'])}
            >
              <option value="PEN">Soles</option>
              <option value="USD">Dolares</option>
            </select>
          </label>
          <label>
            Vencimiento factura
            <input name="invoiceDueDays" type="number" min="1" defaultValue="30" />
          </label>
          <label className="wide-field">
            Observaciones
            <textarea name="notes" rows={3} />
          </label>
          {error && <div className="inline-alert wide-field">{error}</div>}
          <div className="form-actions wide-field">
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar contrato'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function ValuationForm({
  contracts,
  onClose,
  onSubmit,
}: {
  contracts: ApiContract[]
  onClose: () => void
  onSubmit: (input: CreateValuationInput) => Promise<void>
}) {
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contractId, setContractId] = useState('')
  const selectedContract = contracts.find((contract) => contract.id === contractId)
  const [currency, setCurrency] = useState<CreateValuationInput['currency']>('PEN')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const periodStart = String(formData.get('periodStart') ?? '')
    const periodEnd = String(formData.get('periodEnd') ?? '')
    const input: CreateValuationInput = {
      contractId,
      equipmentId: String(formData.get('equipmentId') ?? ''),
      valuationNumber: String(formData.get('valuationNumber') ?? ''),
      periodStart: periodStart || undefined,
      periodEnd: periodEnd || undefined,
      cutoffDate: String(formData.get('cutoffDate') ?? ''),
      quantity: Number(formData.get('quantity') ?? 0),
      currency,
      notes: String(formData.get('notes') ?? ''),
      status: String(formData.get('status') ?? 'PENDIENTE_FACTURA') as CreateValuationInput['status'],
    }

    setIsSubmitting(true)
    setError('')
    try {
      await onSubmit(input)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar valorizacion')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="valuation-form-title">
        <div className="section-heading">
          <div>
            <h2 id="valuation-form-title">Nueva valorizacion</h2>
            <p>El monto se calcula en backend segun la tarifa del contrato.</p>
          </div>
          <button type="button" className="icon-button" aria-label="Cerrar formulario" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form className="quick-form" onSubmit={handleSubmit}>
          <label>
            Contrato
            <select
              required
              value={contractId}
              onChange={(event) => {
                const nextContractId = event.target.value
                setContractId(nextContractId)
                const nextContract = contracts.find((contract) => contract.id === nextContractId)
                if (nextContract) setCurrency(nextContract.currency)
              }}
            >
              <option value="">Seleccionar</option>
              {contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.contractNumber} - {contract.supplier.businessName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Equipo
            <select name="equipmentId" required disabled={!selectedContract}>
              <option value="">Seleccionar</option>
              {selectedContract?.contractEquipment.map((entry) => (
                <option key={entry.equipment.id} value={entry.equipment.id}>
                  {entry.equipment.plateOrInternalCode ?? entry.equipment.description}
                </option>
              ))}
            </select>
          </label>
          <label>
            Numero
            <input name="valuationNumber" defaultValue="VAL-" required />
          </label>
          <label>
            Periodo desde
            <input name="periodStart" type="date" />
          </label>
          <label>
            Periodo hasta
            <input name="periodEnd" type="date" />
          </label>
          <label>
            Corte
            <input name="cutoffDate" type="date" required />
          </label>
          <label>
            {selectedContract?.billingMode === 'DIA' ? 'Dias' : 'Horas'}
            <input name="quantity" type="number" min="0.01" step="0.01" required />
          </label>
          <label>
            Tarifa
            <input value={selectedContract ? String(selectedContract.rate) : ''} readOnly />
          </label>
          <label>
            Moneda
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value as CreateValuationInput['currency'])}
            >
              <option value="PEN">Soles</option>
              <option value="USD">Dolares</option>
            </select>
          </label>
          <label>
            Estado
            <select name="status">
              <option value="PENDIENTE_FACTURA">Pendiente factura</option>
              <option value="BORRADOR">Borrador</option>
            </select>
          </label>
          <label className="wide-field">
            Observaciones
            <textarea name="notes" rows={3} />
          </label>
          {error && <div className="inline-alert wide-field">{error}</div>}
          <div className="form-actions wide-field">
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar valorizacion'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function InvoiceForm({
  valuations,
  invoices,
  onClose,
  onSubmit,
}: {
  valuations: ApiValuation[]
  invoices: ApiInvoice[]
  onClose: () => void
  onSubmit: (input: CreateInvoiceInput) => Promise<void>
}) {
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [valuationId, setValuationId] = useState('')
  const [acceptMismatch, setAcceptMismatch] = useState(false)
  const selectedValuation = valuations.find((valuation) => valuation.id === valuationId)
  const invoicedValuationIds = new Set(invoices.map((invoice) => invoice.valuationId))
  const availableValuations = valuations.filter((valuation) => !invoicedValuationIds.has(valuation.id))

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const totalAmount = String(formData.get('totalAmount') ?? '')
    const dueDate = String(formData.get('dueDate') ?? '')
    const input: CreateInvoiceInput = {
      valuationId,
      invoiceNumber: String(formData.get('invoiceNumber') ?? ''),
      issueDate: String(formData.get('issueDate') ?? ''),
      dueDate: dueDate || undefined,
      currency: String(formData.get('currency') ?? selectedValuation?.currency) as CreateInvoiceInput['currency'],
      totalAmount: totalAmount ? Number(totalAmount) : undefined,
      amountMismatchAccepted: acceptMismatch,
      notes: String(formData.get('notes') ?? ''),
      status: String(formData.get('status') ?? 'PENDIENTE') as CreateInvoiceInput['status'],
      invoiceFile: formData.get('invoiceFile') as File,
      valuationFile: formData.get('valuationFile') as File,
    }

    setIsSubmitting(true)
    setError('')
    try {
      await onSubmit(input)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar factura')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="invoice-form-title">
        <div className="section-heading">
          <div>
            <h2 id="invoice-form-title">Nueva factura</h2>
            <p>Una factura pertenece a una unica valorizacion.</p>
          </div>
          <button type="button" className="icon-button" aria-label="Cerrar formulario" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form className="quick-form" onSubmit={handleSubmit}>
          <label className="wide-field">
            Valorizacion
            <select required value={valuationId} onChange={(event) => setValuationId(event.target.value)}>
              <option value="">Seleccionar</option>
              {availableValuations.map((valuation) => (
                <option key={valuation.id} value={valuation.id}>
                  {valuation.valuationNumber} - {valuation.contract.contractNumber} -{' '}
                  {valuation.equipment.plateOrInternalCode ?? valuation.equipment.description}
                </option>
              ))}
            </select>
          </label>
          <label>
            Numero factura
            <input name="invoiceNumber" required />
          </label>
          <label>
            Emision
            <input name="issueDate" type="date" required />
          </label>
          <label>
            Vencimiento
            <input name="dueDate" type="date" />
          </label>
          <label>
            Monto valorizacion
            <input
              value={selectedValuation ? String(selectedValuation.calculatedAmount) : ''}
              readOnly
            />
          </label>
          <label>
            Monto factura
            <input
              name="totalAmount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder={selectedValuation ? String(selectedValuation.calculatedAmount) : ''}
            />
          </label>
          <label>
            Moneda
            <select name="currency" defaultValue={selectedValuation?.currency ?? 'PEN'}>
              <option value="PEN">Soles</option>
              <option value="USD">Dolares</option>
            </select>
          </label>
          <label>
            Estado
            <select name="status">
              <option value="PENDIENTE">Pendiente</option>
              <option value="OBSERVADA">Observada</option>
            </select>
          </label>
          <label>
            Factura PDF/imagen
            <input name="invoiceFile" type="file" accept="application/pdf,image/*" required />
          </label>
          <label>
            Valorizacion proveedor
            <input name="valuationFile" type="file" accept="application/pdf,image/*" required />
          </label>
          <label className="check-row wide-field">
            <input
              type="checkbox"
              checked={acceptMismatch}
              onChange={(event) => setAcceptMismatch(event.target.checked)}
            />
            <span>Aceptar diferencia si monto o moneda no coincide con la valorizacion</span>
          </label>
          <label className="wide-field">
            Observaciones
            <textarea name="notes" rows={3} />
          </label>
          {error && <div className="inline-alert wide-field">{error}</div>}
          <div className="form-actions wide-field">
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar factura'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function PaymentForm({
  invoice,
  onClose,
  onSubmit,
}: {
  invoice: ApiInvoice
  onClose: () => void
  onSubmit: (input: MarkInvoicePaidInput & { paymentFile: File }) => Promise<void>
}) {
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const paymentFile = formData.get('paymentFile')

    if (!(paymentFile instanceof File) || paymentFile.size === 0) {
      setError('Debe adjuntar el comprobante de pago')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      await onSubmit({
        paidAt: String(formData.get('paidAt') ?? ''),
        notes: String(formData.get('notes') ?? ''),
        paymentFile,
      })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo registrar el pago')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="payment-form-title">
        <div className="section-heading">
          <div>
            <h2 id="payment-form-title">Registrar pago</h2>
            <p>
              {invoice.invoiceNumber} - {money(Number(invoice.totalAmount), invoice.currency)}
            </p>
          </div>
          <button type="button" className="icon-button" aria-label="Cerrar formulario" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form className="quick-form" onSubmit={handleSubmit}>
          <label>
            Fecha de pago
            <input name="paidAt" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
          </label>
          <label className="wide-field">
            Comprobante de pago
            <input name="paymentFile" type="file" accept="application/pdf,image/*" required />
          </label>
          <label className="wide-field">
            Observaciones
            <textarea name="notes" rows={3} />
          </label>
          {error && <div className="inline-alert wide-field">{error}</div>}
          <div className="form-actions wide-field">
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Registrando...' : 'Registrar pago'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function InvoiceExtensionForm({
  invoice,
  onClose,
  onSubmit,
}: {
  invoice: ApiInvoice
  onClose: () => void
  onSubmit: (input: UpdateInvoiceInput) => Promise<void>
}) {
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const input: UpdateInvoiceInput = {
      paymentExtensionDate: String(formData.get('paymentExtensionDate') ?? ''),
      paymentExtensionReason: String(formData.get('paymentExtensionReason') ?? ''),
      notes: String(formData.get('notes') ?? invoice.notes ?? ''),
    }

    setIsSubmitting(true)
    setError('')
    try {
      await onSubmit(input)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo registrar la prorroga')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="extension-form-title">
        <div className="section-heading">
          <div>
            <h2 id="extension-form-title">Registrar prorroga</h2>
            <p>
              {invoice.invoiceNumber} - vence {invoice.dueDate.slice(0, 10)}
            </p>
          </div>
          <button type="button" className="icon-button" aria-label="Cerrar formulario" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form className="quick-form" onSubmit={handleSubmit}>
          <label>
            Nueva fecha acordada
            <input
              name="paymentExtensionDate"
              type="date"
              required
              defaultValue={invoice.paymentExtensionDate?.slice(0, 10) ?? invoice.dueDate.slice(0, 10)}
            />
          </label>
          <label className="wide-field">
            Motivo o acuerdo
            <textarea
              name="paymentExtensionReason"
              rows={3}
              required
              defaultValue={invoice.paymentExtensionReason ?? ''}
              placeholder="Ej. proveedor acepta pago el viernes por programacion de tesoreria"
            />
          </label>
          <label className="wide-field">
            Observaciones internas
            <textarea name="notes" rows={3} defaultValue={invoice.notes ?? ''} />
          </label>
          {error && <div className="inline-alert wide-field">{error}</div>}
          <div className="form-actions wide-field">
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar prorroga'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function AttachmentManager({
  title,
  attachments,
  entityType,
  entityId,
  categories,
  onUploadAttachment,
  onDownloadAttachment,
}: {
  title: string
  attachments: ApiAttachment[]
  entityType: AttachmentEntityType
  entityId: string
  categories: Array<{ value: string; label: string }>
  onUploadAttachment: (input: {
    entityType: AttachmentEntityType
    entityId: string
    category: string
    file: File
  }) => Promise<void>
  onDownloadAttachment: (attachment: ApiAttachment) => Promise<void>
}) {
  const [category, setCategory] = useState(categories[0]?.value ?? 'OTRO')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) {
      setError('Debe seleccionar un archivo')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      await onUploadAttachment({ entityType, entityId, category, file })
      form.reset()
      setCategory(categories[0]?.value ?? 'OTRO')
      setError('')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo subir el adjunto')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="attachment-manager">
      <div className="attachment-heading">
        <h3>{title}</h3>
        <FolderOpen size={18} aria-hidden="true" />
      </div>
      <form className="attachment-form" onSubmit={handleSubmit}>
        <label>
          Tipo
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Archivo
          <input name="file" type="file" accept="application/pdf,image/*" required />
        </label>
        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? 'Subiendo...' : 'Subir'}
        </button>
      </form>
      {error && <div className="inline-alert">{error}</div>}
      <div className="attachment-list">
        {attachments.map((attachment) => (
          <article key={attachment.id} className="attachment-row">
            <div>
              <strong>{attachment.category} v{attachment.version}</strong>
              <span>{attachment.fileName}</span>
              <small>{attachment.storagePath}</small>
            </div>
            <button type="button" className="text-button" onClick={() => void onDownloadAttachment(attachment)}>
              Descargar
            </button>
          </article>
        ))}
        {attachments.length === 0 && <p>No hay adjuntos registrados.</p>}
      </div>
    </section>
  )
}

function InvoiceDetail({
  invoice,
  attachments,
  onUploadAttachment,
  onDownloadAttachment,
  onDelete,
  onClose,
}: {
  invoice: ApiInvoice
  attachments: ApiAttachment[]
  onUploadAttachment: (input: {
    entityType: AttachmentEntityType
    entityId: string
    category: string
    file: File
  }) => Promise<void>
  onDownloadAttachment: (attachment: ApiAttachment) => Promise<void>
  onDelete?: () => void
  onClose: () => void
}) {
  const valuationAmount = Number(invoice.valuation.calculatedAmount)
  const invoiceAmount = Number(invoice.totalAmount)
  const hasMismatch =
    Math.abs(valuationAmount - invoiceAmount) > 0.01 || invoice.currency !== invoice.valuation.currency

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal supplier-detail" role="dialog" aria-modal="true" aria-labelledby="invoice-detail-title">
        <div className="section-heading">
          <div>
            <h2 id="invoice-detail-title">{invoice.invoiceNumber}</h2>
            <p>{invoice.supplier.businessName} - {invoice.contract.contractNumber}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {onDelete && (
              <button
                type="button"
                className="text-button"
                style={{
                  color: 'var(--danger)',
                  background: 'var(--soft-red)',
                  borderColor: 'rgba(239, 68, 68, 0.25)',
                }}
                onClick={onDelete}
              >
                Eliminar factura
              </button>
            )}
            <button type="button" className="icon-button" aria-label="Cerrar detalle" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="detail-grid">
          <Metric icon={FileText} label="Factura" value={money(invoiceAmount, invoice.currency)} detail={prettyStatus(invoice.status)} />
          <Metric icon={BadgeDollarSign} label="Valorizacion" value={money(valuationAmount, invoice.valuation.currency)} detail={invoice.valuation.valuationNumber} />
          <Metric icon={CalendarClock} label="Vencimiento" value={invoice.dueDate.slice(0, 10)} detail="Fecha limite" />
          <Metric icon={Truck} label="Equipo" value={invoice.valuation.equipment.plateOrInternalCode ?? 'Equipo'} detail={invoice.valuation.equipment.description} />
        </div>

        {hasMismatch && (
          <div className="inline-alert">
            El monto o moneda de la factura no coincide con la valorizacion. Revision requerida.
          </div>
        )}

        <div className="folder-row">
          <div>
            <strong>Carpeta de la factura</strong>
            <span>{invoice.folderPath ?? 'Sin carpeta registrada'}</span>
          </div>
          <button
            type="button"
            className="text-button"
            onClick={() => invoice.folderPath && navigator.clipboard.writeText(invoice.folderPath)}
          >
            Copiar ruta
          </button>
        </div>

        <div className="invoice-timeline" aria-label="Flujo documental de factura">
          <article>
            <span>Emision</span>
            <strong>{invoice.issueDate.slice(0, 10)}</strong>
          </article>
          <article>
            <span>Vencimiento</span>
            <strong>{invoice.dueDate.slice(0, 10)}</strong>
          </article>
          <article>
            <span>Pago efectivo</span>
            <strong>{invoice.paidAt ? invoice.paidAt.slice(0, 10) : 'Pendiente'}</strong>
          </article>
          <article>
            <span>Prorroga</span>
            <strong>{invoice.paymentExtensionDate ? invoice.paymentExtensionDate.slice(0, 10) : 'Sin prorroga'}</strong>
          </article>
        </div>

        <AttachmentManager
          title="Adjuntos de factura"
          attachments={attachments}
          entityType="INVOICE"
          entityId={invoice.id}
          categories={[
            { value: 'FACTURA', label: 'Factura' },
            { value: 'VALORIZACION_PROVEEDOR', label: 'Valorizacion proveedor' },
            { value: 'COMPROBANTE_PAGO', label: 'Comprobante pago' },
            { value: 'OTRO', label: 'Otro' },
          ]}
          onUploadAttachment={onUploadAttachment}
          onDownloadAttachment={onDownloadAttachment}
        />
      </section>
    </div>
  )
}

function ContractDetail({
  contract,
  valuations,
  invoices,
  attachments,
  onUploadAttachment,
  onDownloadAttachment,
  onGeneratePdf,
  onDelete,
  onClose,
}: {
  contract: ApiContract
  valuations: ApiValuation[]
  invoices: ApiInvoice[]
  attachments: ApiAttachment[]
  onUploadAttachment: (input: {
    entityType: AttachmentEntityType
    entityId: string
    category: string
    file: File
  }) => Promise<void>
  onDownloadAttachment: (attachment: ApiAttachment) => Promise<void>
  onGeneratePdf: (contract: ApiContract) => Promise<void>
  onDelete?: () => void
  onClose: () => void
}) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [generatePdfError, setGeneratePdfError] = useState('')
  const contractValuations = valuations.filter((valuation) => valuation.contractId === contract.id)
  const contractInvoices = invoices.filter((invoice) => invoice.contractId === contract.id)
  const hasSignedContract = attachments.some((attachment) => attachment.category === 'CONTRATO_FIRMADO')
  const hasServiceOrder = attachments.some((attachment) => attachment.category === 'ORDEN_SERVICIO')
  const pendingDocs = [
    !hasSignedContract ? 'Contrato firmado' : null,
    !hasServiceOrder ? 'Orden de servicio' : null,
  ].filter(Boolean)

  const totals = contractInvoices
    .filter((invoice) => invoice.status !== 'PAGADA')
    .reduce(
      (acc, invoice) => {
        acc[invoice.currency] += Number(invoice.totalAmount)
        return acc
      },
      { PEN: 0, USD: 0 },
    )

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal supplier-detail" role="dialog" aria-modal="true" aria-labelledby="contract-detail-title">
        <div className="section-heading">
          <div>
            <h2 id="contract-detail-title">{contract.contractNumber}</h2>
            <p>{contract.supplier.businessName} - {contract.site.name}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {onDelete && (
              <button
                type="button"
                className="text-button"
                style={{
                  color: 'var(--danger)',
                  background: 'var(--soft-red)',
                  borderColor: 'rgba(239, 68, 68, 0.25)',
                }}
                onClick={onDelete}
              >
                Eliminar contrato
              </button>
            )}
            <button type="button" className="icon-button" aria-label="Cerrar detalle" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {pendingDocs.length > 0 && (
          <div className="inline-alert">
            Documentos pendientes: {pendingDocs.join(', ')}
          </div>
        )}

        <div className="detail-grid">
          <Metric icon={Truck} label="Equipos" value={contract.contractEquipment.length.toString()} detail="Incluidos" />
          <Metric icon={BadgeDollarSign} label="Tarifa" value={money(Number(contract.rate), contract.currency)} detail={contract.billingMode} />
          <Metric icon={FileText} label="Pendiente PEN" value={money(totals.PEN, 'PEN')} detail="Facturas no pagadas" />
          <Metric icon={FileText} label="Pendiente USD" value={money(totals.USD, 'USD')} detail="Facturas no pagadas" />
        </div>

        <div className="folder-row">
          <span>{contract.folderPath ?? 'Sin carpeta registrada'}</span>
          <div className="row-actions">
            <button
              type="button"
              className="text-button"
              onClick={() => contract.folderPath && navigator.clipboard.writeText(contract.folderPath)}
            >
              Copiar ruta
            </button>
            <button
              type="button"
              className="primary-button"
              disabled={isGeneratingPdf}
              onClick={async () => {
                setIsGeneratingPdf(true)
                setGeneratePdfError('')
                try {
                  await onGeneratePdf(contract)
                } catch (error) {
                  setGeneratePdfError(error instanceof Error ? error.message : 'No se pudo generar el PDF')
                } finally {
                  setIsGeneratingPdf(false)
                }
              }}
            >
              {isGeneratingPdf ? 'Generando...' : 'Generar PDF'}
            </button>
          </div>
        </div>
        {generatePdfError && <div className="inline-alert">{generatePdfError}</div>}

        <div className="plain-sections">
          <section>
            <h3>Equipos</h3>
            {contract.contractEquipment.map((entry) => (
              <p key={entry.equipment.id}>
                {entry.equipment.plateOrInternalCode ?? entry.equipment.description}
              </p>
            ))}
          </section>
          <section>
            <h3>Valorizaciones</h3>
            {contractValuations.map((valuation) => (
              <p key={valuation.id}>
                {valuation.valuationNumber} - {money(Number(valuation.calculatedAmount), valuation.currency)} -{' '}
                {prettyStatus(valuation.status)}
              </p>
            ))}
            {contractValuations.length === 0 && <p>Sin valorizaciones.</p>}
          </section>
          <section>
            <h3>Facturas</h3>
            {contractInvoices.map((invoice) => (
              <p key={invoice.id}>
                {invoice.invoiceNumber} - {money(Number(invoice.totalAmount), invoice.currency)} -{' '}
                {prettyStatus(invoice.status)}
              </p>
            ))}
            {contractInvoices.length === 0 && <p>Sin facturas.</p>}
          </section>
          <AttachmentManager
            title="Adjuntos del contrato"
            attachments={attachments}
            entityType="CONTRACT"
            entityId={contract.id}
            categories={[
              { value: 'CONTRATO_FIRMADO', label: 'Contrato firmado' },
              { value: 'ORDEN_SERVICIO', label: 'Orden de servicio' },
              { value: 'CONTRATO_GENERADO', label: 'Contrato generado' },
              { value: 'OTRO', label: 'Otro documento' },
            ]}
            onUploadAttachment={onUploadAttachment}
            onDownloadAttachment={onDownloadAttachment}
          />
        </div>
      </section>
    </div>
  )
}

function EquipmentDetail({
  equipment,
  contracts,
  valuations,
  invoices,
  attachments,
  onUploadAttachment,
  onDownloadAttachment,
  onClose,
  onDelete,
}: {
  equipment: ApiEquipment
  contracts: ApiContract[]
  valuations: ApiValuation[]
  invoices: ApiInvoice[]
  attachments: ApiAttachment[]
  onUploadAttachment: (input: {
    entityType: AttachmentEntityType
    entityId: string
    category: string
    file: File
  }) => Promise<void>
  onDownloadAttachment: (attachment: ApiAttachment) => Promise<void>
  onClose: () => void
  onDelete?: () => void
}) {
  const equipmentContracts = contracts.filter((contract) =>
    contract.contractEquipment.some((entry) => entry.equipment.id === equipment.id),
  )
  const equipmentValuations = valuations.filter((valuation) => valuation.equipmentId === equipment.id)
  const valuationIds = new Set(equipmentValuations.map((valuation) => valuation.id))
  const equipmentInvoices = invoices.filter((invoice) => valuationIds.has(invoice.valuationId))
  const pendingTotals = equipmentInvoices
    .filter((invoice) => invoice.status !== 'PAGADA')
    .reduce(
      (acc, invoice) => {
        acc[invoice.currency] += Number(invoice.totalAmount)
        return acc
      },
      { PEN: 0, USD: 0 },
    )

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal supplier-detail" role="dialog" aria-modal="true" aria-labelledby="equipment-detail-title">
        <div className="section-heading">
          <div>
            <h2 id="equipment-detail-title">{equipment.plateOrInternalCode ?? equipment.description}</h2>
            <p>{equipment.supplier.businessName} - {equipment.equipmentType.name}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {onDelete && (
              <button
                type="button"
                className="text-button"
                style={{
                  color: 'var(--danger)',
                  background: 'var(--soft-red)',
                  borderColor: 'rgba(239, 68, 68, 0.25)',
                }}
                onClick={onDelete}
              >
                Eliminar equipo
              </button>
            )}
            <button type="button" className="icon-button" aria-label="Cerrar detalle" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="detail-grid">
          <Metric icon={ClipboardList} label="Contratos" value={equipmentContracts.length.toString()} detail="Historial del equipo" />
          <Metric icon={BadgeDollarSign} label="Valorizaciones" value={equipmentValuations.length.toString()} detail="Registradas" />
          <Metric icon={FileText} label="Pendiente PEN" value={money(pendingTotals.PEN, 'PEN')} detail="Por pagar" />
          <Metric icon={FileText} label="Pendiente USD" value={money(pendingTotals.USD, 'USD')} detail="Por pagar" />
        </div>

        <div className="folder-row">
          <span>{equipment.folderPath ?? 'Sin carpeta registrada'}</span>
          <button
            type="button"
            className="text-button"
            onClick={() => equipment.folderPath && navigator.clipboard.writeText(equipment.folderPath)}
          >
            Copiar ruta
          </button>
        </div>

        <div className="plain-sections">
          <section>
            <h3>Ficha tecnica</h3>
            <p>
              {equipment.brand ?? 'Sin marca'} {equipment.model ?? ''} {equipment.year ? `- ${equipment.year}` : ''} -{' '}
              {equipment.currentSite?.name ?? 'Sin sede'} - {prettyStatus(equipment.status)}
            </p>
          </section>
          <section>
            <h3>Contratos</h3>
            {equipmentContracts.map((contract) => (
              <p key={contract.id}>
                {contract.contractNumber} - {contract.site.name} - {prettyStatus(contract.status)}
              </p>
            ))}
            {equipmentContracts.length === 0 && <p>Sin contratos asociados.</p>}
          </section>
          <section>
            <h3>Valorizaciones</h3>
            {equipmentValuations.map((valuation) => (
              <p key={valuation.id}>
                {valuation.valuationNumber} - {money(Number(valuation.calculatedAmount), valuation.currency)} -{' '}
                {prettyStatus(valuation.status)}
              </p>
            ))}
            {equipmentValuations.length === 0 && <p>Sin valorizaciones.</p>}
          </section>
          <AttachmentManager
            title="Documentos del equipo"
            attachments={attachments}
            entityType="EQUIPMENT"
            entityId={equipment.id}
            categories={[
              { value: 'DOCUMENTO', label: 'Documento' },
              { value: 'FOTO', label: 'Foto' },
            ]}
            onUploadAttachment={onUploadAttachment}
            onDownloadAttachment={onDownloadAttachment}
          />
        </div>
      </section>
    </div>
  )
}

function ValuationDetail({
  valuation,
  invoice,
  attachments,
  onUploadAttachment,
  onDownloadAttachment,
  onDelete,
  onClose,
}: {
  valuation: ApiValuation
  invoice: ApiInvoice | null
  attachments: ApiAttachment[]
  onUploadAttachment: (input: {
    entityType: AttachmentEntityType
    entityId: string
    category: string
    file: File
  }) => Promise<void>
  onDownloadAttachment: (attachment: ApiAttachment) => Promise<void>
  onDelete?: () => void
  onClose: () => void
}) {
  const invoiceAmount = invoice ? Number(invoice.totalAmount) : 0
  const valuationAmount = Number(valuation.calculatedAmount)
  const hasMismatch =
    invoice && (Math.abs(invoiceAmount - valuationAmount) > 0.01 || invoice.currency !== valuation.currency)
  const providerValuation = attachments.filter((attachment) => attachment.category === 'VALORIZACION_PROVEEDOR')

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal supplier-detail" role="dialog" aria-modal="true" aria-labelledby="valuation-detail-title">
        <div className="section-heading">
          <div>
            <h2 id="valuation-detail-title">{valuation.valuationNumber}</h2>
            <p>
              {valuation.contract.supplier.businessName} - {valuation.contract.contractNumber}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {onDelete && (
              <button
                type="button"
                className="text-button"
                style={{
                  color: 'var(--danger)',
                  background: 'var(--soft-red)',
                  borderColor: 'rgba(239, 68, 68, 0.25)',
                }}
                onClick={onDelete}
              >
                Eliminar valorización
              </button>
            )}
            <button type="button" className="icon-button" aria-label="Cerrar detalle" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {hasMismatch && (
          <div className="inline-alert">
            La factura asociada no coincide exactamente con el monto o moneda de esta valorizacion.
          </div>
        )}

        <div className="detail-grid">
          <Metric icon={BadgeDollarSign} label="Valorizacion" value={money(valuationAmount, valuation.currency)} detail={prettyStatus(valuation.status)} />
          <Metric icon={Truck} label="Equipo" value={valuation.equipment.plateOrInternalCode ?? 'Equipo'} detail={valuation.equipment.description} />
          <Metric icon={CalendarClock} label="Corte" value={valuation.cutoffDate.slice(0, 10)} detail="Fecha de control" />
          <Metric icon={FileText} label="Factura" value={invoice?.invoiceNumber ?? 'Pendiente'} detail={invoice ? prettyStatus(invoice.status) : 'Sin factura'} />
        </div>

        <div className="folder-row">
          <span>{valuation.folderPath ?? invoice?.folderPath ?? 'Sin carpeta registrada'}</span>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              const folderPath = valuation.folderPath ?? invoice?.folderPath
              if (folderPath) navigator.clipboard.writeText(folderPath)
            }}
          >
            Copiar ruta
          </button>
        </div>

        <div className="plain-sections">
          <section>
            <h3>Calculo</h3>
            <p>
              {Number(valuation.quantity)} {valuation.contract.billingMode === 'DIA' ? 'dias' : 'horas'} x{' '}
              {money(Number(valuation.unitRate), valuation.currency)} = {money(valuationAmount, valuation.currency)}
            </p>
          </section>
          <section>
            <h3>Periodo</h3>
            <p>
              {valuation.periodStart?.slice(0, 10) ?? 'Sin inicio'} al{' '}
              {valuation.periodEnd?.slice(0, 10) ?? 'Sin fin'} - corte {valuation.cutoffDate.slice(0, 10)}
            </p>
          </section>
          <section>
            <h3>Factura asociada</h3>
            {invoice ? (
              <p>
                {invoice.invoiceNumber} - {money(invoiceAmount, invoice.currency)} - vence {invoice.dueDate.slice(0, 10)}
              </p>
            ) : (
              <p>Esta valorizacion todavia esta pendiente de factura.</p>
            )}
          </section>
          <AttachmentManager
            title="Valorizacion del proveedor"
            attachments={providerValuation}
            entityType={invoice ? 'INVOICE' : 'VALUATION'}
            entityId={invoice?.id ?? valuation.id}
            categories={[
              { value: 'VALORIZACION_PROVEEDOR', label: 'Valorizacion proveedor' },
              { value: 'OTRO', label: 'Otro documento' },
            ]}
            onUploadAttachment={onUploadAttachment}
            onDownloadAttachment={onDownloadAttachment}
          />
        </div>
      </section>
    </div>
  )
}

function Reports({
  token,
  report,
  costReport,
  onLoadReport,
  onLoadCostReport,
}: {
  token: string
  report: DueInvoicesReport | null
  costReport: CostSummaryReport | null
  onLoadReport: () => Promise<void>
  onLoadCostReport: () => Promise<void>
}) {
  const [reportType, setReportType] = useState<'due-invoices' | 'cost-summary'>('due-invoices')
  const activeCostReport = reportType === 'cost-summary'
  const dueReportStatus = useMemo(() => {
    if (!report) return []
    const totals = new Map<string, number>()
    report.rows.forEach((row) => totals.set(row.status, (totals.get(row.status) ?? 0) + 1))
    return Array.from(totals.entries()).map(([status, count]) => ({ status, count }))
  }, [report])
  const supplierCostChart = useMemo(() => {
    if (!costReport) return []
    return costReport.suppliers
      .map((row) => ({
        supplier: row.supplier,
        amount: row.PEN,
      }))
      .filter((row) => row.amount > 0)
      .sort((first, second) => second.amount - first.amount)
      .slice(0, 5)
  }, [costReport])
  const maxSupplierCost = Math.max(...supplierCostChart.map((row) => row.amount), 1)

  const downloadReport = async (format: 'xlsx' | 'pdf') => {
    const response = await fetch(reportDownloadUrl(reportType, format), {
      headers: { Authorization: `Bearer ${token}` },
    })
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const baseName = activeCostReport ? 'reporte-costos' : 'facturas-vencimientos'
    link.download = `${baseName}.${format}`
    link.click()
    URL.revokeObjectURL(url)
  }

  const generateReport = async () => {
    if (activeCostReport) {
      await onLoadCostReport()
      return
    }
    await onLoadReport()
  }

  return (
    <section className="work-panel report-panel">
      <div className="section-heading">
        <div>
          <h2>{activeCostReport ? 'Reporte consolidado de costos' : 'Facturas por vencer y vencidas'}</h2>
          <p>{activeCostReport ? 'Costo por proveedor, equipo y valorizacion.' : 'Control de pagos programados separado por moneda.'}</p>
        </div>
        <FileBarChart size={21} aria-hidden="true" />
      </div>
      <div className="report-form">
        <label>
          Tipo de reporte
          <select
            value={reportType}
            onChange={(event) => setReportType(event.target.value as 'due-invoices' | 'cost-summary')}
          >
            <option value="due-invoices">Facturas por vencer y vencidas</option>
            <option value="cost-summary">Costos por proveedor, equipo y valorizacion</option>
          </select>
        </label>
      </div>
      <div className="export-actions">
        <button type="button" className="primary-button" onClick={() => void generateReport()}>
          Generar
        </button>
        <button type="button" onClick={() => void downloadReport('xlsx')}>Exportar Excel</button>
        <button type="button" onClick={() => void downloadReport('pdf')}>Exportar PDF</button>
      </div>
      {!activeCostReport && report && (
        <div className="report-result">
          <div className="metric-grid compact-metrics">
            <Metric icon={BadgeDollarSign} label="Total PEN" value={money(report.totals.PEN, 'PEN')} detail="Por pagar" />
            <Metric icon={BadgeDollarSign} label="Total USD" value={money(report.totals.USD, 'USD')} detail="Por pagar" />
          </div>
          <div className="report-insight-grid">
            {dueReportStatus.map((item) => (
              <article key={item.status}>
                <span>{prettyStatus(item.status)}</span>
                <strong>{item.count}</strong>
              </article>
            ))}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Factura</th>
                  <th>Proveedor</th>
                  <th>Contrato</th>
                  <th>Vence</th>
                  <th>Moneda</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.invoiceNumber}</td>
                    <td>{row.supplier}</td>
                    <td>{row.contractNumber}</td>
                    <td>{row.dueDate}</td>
                    <td>{row.currency}</td>
                    <td>{money(row.totalAmount, row.currency)}</td>
                    <td><StatusPill status={row.status} /></td>
                  </tr>
                ))}
                {report.rows.length === 0 && (
                  <tr>
                    <td colSpan={7}>No hay facturas pendientes o vencidas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {activeCostReport && costReport && (
        <div className="report-result">
          <div className="metric-grid compact-metrics">
            <Metric icon={BadgeDollarSign} label="Total PEN" value={money(costReport.totals.PEN, 'PEN')} detail="Facturado" />
            <Metric icon={BadgeDollarSign} label="Total USD" value={money(costReport.totals.USD, 'USD')} detail="Facturado" />
          </div>
          <div className="report-bars" aria-label="Ranking de costo por proveedor en soles">
            {supplierCostChart.map((row) => (
              <article key={row.supplier}>
                <span>{row.supplier}</span>
                <div>
                  <i style={{ width: `${Math.max(8, (row.amount / maxSupplierCost) * 100)}%` }} />
                </div>
                <strong>{money(row.amount, 'PEN')}</strong>
              </article>
            ))}
          </div>
          <ReportTable
            title="Costo por proveedor"
            columns={['Proveedor', 'Facturas', 'PEN', 'USD']}
            rows={costReport.suppliers.map((row) => [
              row.supplier,
              String(row.invoices),
              money(row.PEN, 'PEN'),
              money(row.USD, 'USD'),
            ])}
          />
          <ReportTable
            title="Costo por equipo"
            columns={['Equipo', 'Proveedor', 'PEN', 'USD']}
            rows={costReport.equipment.map((row) => [
              row.equipment,
              row.supplier,
              money(row.PEN, 'PEN'),
              money(row.USD, 'USD'),
            ])}
          />
          <ReportTable
            title="Valorizaciones"
            columns={['Valorizacion', 'Factura', 'Equipo', 'Monto factura', 'Estado']}
            rows={costReport.valuations.map((row) => [
              row.valuationNumber,
              row.invoiceNumber,
              row.equipment,
              money(row.invoiceAmount, row.invoiceCurrency),
              prettyStatus(row.invoiceStatus),
            ])}
          />
        </div>
      )}
    </section>
  )
}

function ReportTable({
  title,
  columns,
  rows,
}: {
  title: string
  columns: string[]
  rows: string[][]
}) {
  return (
    <section className="report-subsection">
      <h3>{title}</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${title}-${index}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${title}-${index}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length}>No hay datos para mostrar.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function SettingsView({
  users,
  userLoadError,
  currentUser,
  onCreateUser,
  onToggleUser,
  onChangeUserRole,
  equipmentTypes,
  sites,
  onCreateEquipmentType,
  onToggleEquipmentType,
  onToggleSite,
  alertSettings,
  onUpdateAlertSettings,
  contractTemplate,
  onUpdateContractTemplate,
  onDownloadImportTemplate,
  onImportExcel,
}: {
  users: ApiUser[]
  userLoadError: string
  currentUser: AuthUser | null
  onCreateUser: (input: CreateUserInput) => Promise<void>
  onToggleUser: (targetUser: ApiUser, isActive: boolean) => Promise<void>
  onChangeUserRole: (targetUser: ApiUser, role: AuthUser['role']) => Promise<void>
  equipmentTypes: ApiEquipmentType[]
  sites: ApiSite[]
  onCreateEquipmentType: (name: string) => Promise<void>
  onToggleEquipmentType: (id: string, isActive: boolean) => Promise<void>
  onToggleSite: (id: string, isActive: boolean) => Promise<void>
  alertSettings: AlertSettings | null
  onUpdateAlertSettings: (input: AlertSettings) => Promise<void>
  contractTemplate: ContractTemplateSettings | null
  onUpdateContractTemplate: (input: ContractTemplateSettings) => Promise<void>
  onDownloadImportTemplate: () => Promise<void>
  onImportExcel: (file: File, commit: boolean) => Promise<ImportResult>
}) {
  const [userError, setUserError] = useState('')
  const [equipmentTypeError, setEquipmentTypeError] = useState('')
  const [alertError, setAlertError] = useState('')
  const [templateError, setTemplateError] = useState('')
  const [templateValue, setTemplateValue] = useState(contractTemplate?.template ?? '')
  const [importError, setImportError] = useState('')
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null)
  const [isSubmittingUser, setIsSubmittingUser] = useState(false)
  const [isSubmittingType, setIsSubmittingType] = useState(false)
  const [isSubmittingAlerts, setIsSubmittingAlerts] = useState(false)
  const [isSubmittingTemplate, setIsSubmittingTemplate] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)

  const activeTypes = equipmentTypes.filter((item) => item.isActive)
  const activeSites = sites.filter((item) => item.isActive)
  const activeUsers = users.filter((item) => item.isActive)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTemplateValue(contractTemplate?.template ?? '')
  }, [contractTemplate?.template])

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const input: CreateUserInput = {
      name: String(formData.get('name') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim().toLowerCase(),
      password: String(formData.get('password') ?? ''),
      role: String(formData.get('role') ?? 'OPERATIVO') as CreateUserInput['role'],
    }

    setIsSubmittingUser(true)
    setUserError('')
    try {
      await onCreateUser(input)
      form.reset()
    } catch (error) {
      setUserError(error instanceof Error ? error.message : 'No se pudo crear el usuario')
    } finally {
      setIsSubmittingUser(false)
    }
  }

  const handleCreateType = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const name = String(formData.get('name') ?? '').trim()
    if (!name) return

    setIsSubmittingType(true)
    setEquipmentTypeError('')
    try {
      await onCreateEquipmentType(name)
      form.reset()
    } catch (error) {
      setEquipmentTypeError(error instanceof Error ? error.message : 'No se pudo crear el tipo')
    } finally {
      setIsSubmittingType(false)
    }
  }

  const handleUpdateAlerts = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const input: AlertSettings = {
      invoiceDaysBeforeDue: Number(formData.get('invoiceDaysBeforeDue') ?? 3),
      contractDaysBeforeDue: Number(formData.get('contractDaysBeforeDue') ?? 3),
      dailyOverdueReminderEnabled: formData.get('dailyOverdueReminderEnabled') === 'on',
    }

    setIsSubmittingAlerts(true)
    setAlertError('')
    try {
      await onUpdateAlertSettings(input)
    } catch (error) {
      setAlertError(error instanceof Error ? error.message : 'No se pudieron guardar las alertas')
    } finally {
      setIsSubmittingAlerts(false)
    }
  }

  const handleUpdateTemplate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmittingTemplate(true)
    setTemplateError('')
    try {
      await onUpdateContractTemplate({ template: templateValue })
    } catch (error) {
      setTemplateError(error instanceof Error ? error.message : 'No se pudo guardar la plantilla')
    } finally {
      setIsSubmittingTemplate(false)
    }
  }

  const runImport = async (commit: boolean) => {
    if (!selectedImportFile) {
      setImportError('Selecciona un archivo Excel primero')
      return
    }

    setIsImporting(true)
    setImportError('')
    try {
      setImportResult(await onImportExcel(selectedImportFile, commit))
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'No se pudo procesar el Excel')
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = async () => {
    setIsDownloadingTemplate(true)
    setImportError('')
    try {
      await onDownloadImportTemplate()
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'No se pudo descargar la plantilla')
    } finally {
      setIsDownloadingTemplate(false)
    }
  }

  return (
    <section className="settings-grid">
      <article className="work-panel">
        <div className="section-heading">
          <div>
            <h2>Usuarios</h2>
            <p>Administrador y operativo con permisos diferenciados.</p>
          </div>
          <Users size={20} aria-hidden="true" />
        </div>
        <form className="settings-form user-settings-form" onSubmit={handleCreateUser}>
          <label>
            Nombre
            <input name="name" placeholder="Nombre completo" autoComplete="off" required />
          </label>
          <label>
            Correo
            <input name="email" type="email" placeholder="usuario@isem.local" autoComplete="off" required />
          </label>
          <label>
            Contrasena temporal
            <input name="password" type="password" minLength={8} autoComplete="new-password" required />
          </label>
          <label>
            Rol
            <select name="role" defaultValue="OPERATIVO">
              <option value="OPERATIVO">Operativo</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </label>
          <button type="submit" className="primary-button" disabled={isSubmittingUser}>
            {isSubmittingUser ? 'Guardando...' : 'Crear usuario'}
          </button>
        </form>
        {(userError || userLoadError) && <div className="inline-alert">{userError || userLoadError}</div>}
        <ul className="plain-list">
          {users.map((item) => (
            <li key={item.id}>
              <span>
                {item.name}
                <small>{item.email}</small>
                <small>
                  Ultimo ingreso: {item.lastLoginAt ? item.lastLoginAt.slice(0, 10) : 'Sin ingreso'}
                </small>
              </span>
              <div className="row-actions">
                <select
                  className="compact-select"
                  value={item.role}
                  onChange={(event) => void onChangeUserRole(item, event.target.value as AuthUser['role'])}
                  disabled={item.id === currentUser?.id}
                >
                  <option value="OPERATIVO">Operativo</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <StatusPill status={item.isActive ? 'ACTIVO' : 'INACTIVO'} />
                <button
                  type="button"
                  className="text-button"
                  onClick={() => void onToggleUser(item, !item.isActive)}
                  disabled={item.id === currentUser?.id}
                >
                  {item.isActive ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </li>
          ))}
          {users.length === 0 && <li>No hay usuarios configurados.</li>}
        </ul>
      </article>
      <article className="work-panel">
        <div className="section-heading">
          <div>
            <h2>Alertas</h2>
            <p>Parametros usados por el evaluador de vencimientos.</p>
          </div>
          <Bell size={20} aria-hidden="true" />
        </div>
        <form className="settings-form" onSubmit={handleUpdateAlerts}>
          <label>
            Facturas por vencer
            <input
              name="invoiceDaysBeforeDue"
              type="number"
              min="0"
              max="30"
              defaultValue={alertSettings?.invoiceDaysBeforeDue ?? 3}
              required
            />
          </label>
          <label>
            Contratos por vencer
            <input
              name="contractDaysBeforeDue"
              type="number"
              min="0"
              max="90"
              defaultValue={alertSettings?.contractDaysBeforeDue ?? 3}
              required
            />
          </label>
          <label className="check-row settings-check">
            <input
              name="dailyOverdueReminderEnabled"
              type="checkbox"
              defaultChecked={alertSettings?.dailyOverdueReminderEnabled ?? true}
            />
            <span>Recordar vencidas cada evaluacion</span>
          </label>
          <button type="submit" className="primary-button" disabled={isSubmittingAlerts}>
            {isSubmittingAlerts ? 'Guardando...' : 'Guardar alertas'}
          </button>
        </form>
        {alertError && <div className="inline-alert">{alertError}</div>}
      </article>
      <article className="work-panel wide-panel">
        <div className="section-heading">
          <div>
            <h2>Plantilla de contrato</h2>
            <p>Texto base usado al generar el PDF desde cada contrato.</p>
          </div>
          <FileText size={20} aria-hidden="true" />
        </div>
        <form className="settings-form" onSubmit={handleUpdateTemplate}>
          <label>
            Texto editable
            <textarea
              name="template"
              rows={16}
              value={templateValue}
              onChange={(event) => setTemplateValue(event.target.value)}
              placeholder="Escribe la plantilla del contrato"
              required
            />
          </label>
          <p className="helper-text">
            Variables disponibles: {'{{contractNumber}}'}, {'{{supplierName}}'}, {'{{supplierRuc}}'}, {'{{siteName}}'}, {'{{equipmentList}}'}, {'{{startDate}}'}, {'{{endDate}}'}, {'{{billingMode}}'}, {'{{rate}}'}, {'{{currency}}'}, {'{{invoiceDueDays}}'}, {'{{notes}}'}.
          </p>
          <button type="submit" className="primary-button" disabled={isSubmittingTemplate}>
            {isSubmittingTemplate ? 'Guardando...' : 'Guardar plantilla'}
          </button>
        </form>
        {templateError && <div className="inline-alert">{templateError}</div>}
      </article>
      <article className="work-panel wide-panel">
        <div className="section-heading">
          <div>
            <h2>Importacion desde Excel</h2>
            <p>Descarga la plantilla, pega tus datos y revisa errores antes de grabar.</p>
          </div>
          <FileBarChart size={20} aria-hidden="true" />
        </div>
        <div className="import-actions">
          <button type="button" className="secondary-button" disabled={isDownloadingTemplate} onClick={() => void downloadTemplate()}>
            {isDownloadingTemplate ? 'Descargando...' : 'Descargar plantilla'}
          </button>
          <label className="file-picker">
            Archivo Excel
            <input
              type="file"
              accept=".xlsx,.xlsm"
              onChange={(event) => {
                setSelectedImportFile(event.target.files?.[0] ?? null)
                setImportResult(null)
              }}
            />
          </label>
          <button type="button" className="secondary-button" disabled={isImporting || !selectedImportFile} onClick={() => void runImport(false)}>
            {isImporting ? 'Revisando...' : 'Previsualizar'}
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={isImporting || !selectedImportFile || Boolean(importResult?.summary && Object.values(importResult.summary).some((item) => item.error > 0))}
            onClick={() => void runImport(true)}
          >
            {isImporting ? 'Importando...' : 'Importar datos'}
          </button>
        </div>
        {importError && <div className="inline-alert">{importError}</div>}
        {importResult && (
          <div className="import-result">
            <div className="report-result">
              {Object.entries(importResult.summary).map(([section, item]) => (
                <div key={section} className="metric-card compact-metric">
                  <span>{section}</span>
                  <strong>{item.create}</strong>
                  <small>{item.skip} omitidos · {item.error} errores</small>
                </div>
              ))}
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Hoja</th>
                    <th>Fila</th>
                    <th>Accion</th>
                    <th>Referencia</th>
                    <th>Mensaje</th>
                  </tr>
                </thead>
                <tbody>
                  {importResult.results.slice(0, 50).map((item, index) => (
                    <tr key={`${item.section}-${item.row}-${index}`}>
                      <td>{item.section}</td>
                      <td>{item.row}</td>
                      <td><StatusPill status={item.action} /></td>
                      <td>{item.reference ?? '-'}</td>
                      <td>{item.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </article>
      <article className="work-panel">
        <div className="section-heading">
          <div>
            <h2>Tipos de equipo</h2>
            <p>Campos usados al registrar maquinaria o vehiculos.</p>
          </div>
          <Wrench size={20} aria-hidden="true" />
        </div>
        <form className="settings-form" onSubmit={handleCreateType}>
          <label>
            Nuevo tipo
            <input name="name" placeholder="Ej. Plataforma elevadora" required />
          </label>
          <button type="submit" className="primary-button" disabled={isSubmittingType}>
            {isSubmittingType ? 'Guardando...' : 'Agregar'}
          </button>
        </form>
        {equipmentTypeError && <div className="inline-alert">{equipmentTypeError}</div>}
        <ul className="plain-list">
          {equipmentTypes.map((item) => (
            <li key={item.id}>
              <span>{item.name}</span>
              <div className="row-actions">
                <StatusPill status={item.isActive ? 'ACTIVO' : 'INACTIVO'} />
                <button
                  type="button"
                  className="text-button"
                  onClick={() => void onToggleEquipmentType(item.id, !item.isActive)}
                >
                  {item.isActive ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </li>
          ))}
          {equipmentTypes.length === 0 && <li>No hay tipos configurados.</li>}
        </ul>
      </article>
      <article className="work-panel">
        <div className="section-heading">
          <div>
            <h2>Sedes</h2>
            <p>Ubicaciones disponibles para contratos y equipos.</p>
          </div>
          <Building2 size={20} aria-hidden="true" />
        </div>
        <ul className="plain-list">
          {sites.map((site) => (
            <li key={site.id}>
              <span>
                {site.name}
                {site.address ? <small>{site.address}</small> : null}
              </span>
              <div className="row-actions">
                <StatusPill status={site.isActive ? 'ACTIVO' : 'INACTIVO'} />
                <button
                  type="button"
                  className="text-button"
                  onClick={() => void onToggleSite(site.id, !site.isActive)}
                >
                  {site.isActive ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </li>
          ))}
          {sites.length === 0 && <li>No hay sedes configuradas.</li>}
        </ul>
      </article>
      <article className="work-panel">
        <div className="section-heading">
          <div>
            <h2>Resumen</h2>
            <p>Estado de parametros principales.</p>
          </div>
          <Settings size={20} aria-hidden="true" />
        </div>
        <ul className="plain-list">
          <li>
            <span>Usuarios activos</span>
            <strong>{activeUsers.length}</strong>
          </li>
          <li>
            <span>Tipos activos</span>
            <strong>{activeTypes.length}</strong>
          </li>
          <li>
            <span>Sedes activas</span>
            <strong>{activeSites.length}</strong>
          </li>
          <li>
            <span>Plantilla de contrato</span>
            <StatusPill status={contractTemplate?.template ? 'ACTIVO' : 'PENDIENTE'} />
          </li>
        </ul>
      </article>
    </section>
  )
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  const className = normalized.includes('vencida')
    || normalized.includes('error')
    ? 'status danger'
    : normalized.includes('pagada') || normalized.includes('activo') || normalized.includes('admin') || normalized.includes('create')
      ? 'status success'
      : normalized.includes('observada') || normalized.includes('pendiente') || normalized.includes('skip')
        ? 'status warning'
        : 'status'

  return (
    <span className={className}>
      {normalized.includes('pagada') || normalized.includes('activo') ? <CheckCircle2 size={13} /> : null}
      {prettyStatus(status)}
    </span>
  )
}

export default App

