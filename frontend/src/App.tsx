
              <Label htmlFor="bank-logo">Logo</Label>
              <Input
                id="bank-logo"
                value={bankFormData.logo}
                onChange={(e) => setBankFormData({...bankFormData, logo: e.target.value})}
                placeholder="Logo kısaltması (örn: AB)"
              />
            </div>
            
            <div>
              <Label htmlFor="bank-campaign">Kampanya</Label>
              <Input
                id="bank-campaign"
                value={bankFormData.campaign}
                onChange={(e) => setBankFormData({...bankFormData, campaign: e.target.value})}
                placeholder="Kampanya açıklaması"
              />
            </div>
            
            <div>
              <Label htmlFor="bank-color">Renk</Label>
              <Input
                id="bank-color"
                type="color"
                value={bankFormData.color}
                onChange={(e) => setBankFormData({...bankFormData, color: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="bank-max-apps">Maksimum Başvuru Sayısı</Label>
              <Input
                id="bank-max-apps"
                type="number"
                value={bankFormData.max_applications}
                onChange={(e) => setBankFormData({...bankFormData, max_applications: Number(e.target.value)})}
                placeholder="100"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="bank-active"
                checked={bankFormData.is_active}
                onCheckedChange={(checked) => setBankFormData({...bankFormData, is_active: checked})}
              />
              <Label htmlFor="bank-active">Aktif</Label>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowBankForm(false)} className="flex-1">
                İptal
              </Button>
              <Button 
                onClick={editingBank ? updateBank : createBank} 
                className="flex-1"
              >
                {editingBank ? 'Güncelle' : 'Ekle'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App
