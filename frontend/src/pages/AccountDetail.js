import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MessageCircle, CreditCard, Building2, Video, Copy, Check, User, Building } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AccountDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [account, setAccount] = useState(null);
  const [category, setCategory] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [videoPreview, setVideoPreview] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (!user) {
      toast.error('Bu sayfayı görüntülemek için giriş yapmalısınız!');
      navigate('/login');
      return;
    }
    fetchAccount();
    fetchSettings();
  }, [id, user]);

  const fetchAccount = async () => {
    try {
      const response = await axios.get(`${API}/accounts/${id}`);
      setAccount(response.data);
      
      const categoriesResponse = await axios.get(`${API}/categories`);
      const cat = categoriesResponse.data.find(c => c.id === response.data.category_id);
      setCategory(cat);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching account:', error);
      toast.error('Hesap bulunamadı!');
      navigate('/');
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const getVideoEmbedUrl = (url) => {
    if (!url) return null;
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    return null;
  };

  const handleWhatsAppPurchase = () => {
    if (!settings.whatsapp_number) {
      toast.error('WhatsApp numarası ayarlanmamış!');
      return;
    }
    const message = `Merhaba, ${account.name} (ID: ${account.id}) hesabını satın almak istiyorum. Fiyat: ${account.price}₺`;
    const url = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleBankTransfer = () => {
    if (!settings.iban) {
      toast.error('IBAN bilgisi ayarlanmamış!');
      return;
    }
    
    toast.success('IBAN kopyalandı! WhatsApp\'tan dekont gönderin.');
    navigator.clipboard.writeText(settings.iban);
    
    setTimeout(() => {
      const message = `Merhaba, ${account.name} (ID: ${account.id}) hesabı için havale yaptım. Dekont gönderiyorum.`;
      const url = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    }, 1000);
  };

  const handleCardPayment = async () => {
    if (!settings.shopier_api_key) {
      toast.error('Shopier entegrasyonu yapılmamış!');
      return;
    }
    
    try {
      toast.loading('Ödeme sayfası hazırlanıyor...');
      const response = await axios.post(`${API}/payment/shopier`, null, {
        params: { account_id: account.id }
      });
      
      if (response.data.payment_url) {
        window.open(response.data.payment_url, '_blank');
        toast.success('Ödeme sayfasına yönlendirildiniz!');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Ödeme başlatılamadı!');
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success(`${type} kopyalandı!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Bilinmiyor';
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Ödeme metodlarını kontrol et
  const hasIbanPayment = settings.enable_iban_payment !== false && settings.iban;
  const hasCardPayment = settings.enable_card_payment !== false && settings.shopier_api_key;
  const hasAnyPayment = hasIbanPayment || hasCardPayment;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 flex items-center justify-center">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

  if (!account) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950">
      <header className="bg-blue-900/50 backdrop-blur-sm border-b border-blue-700/50">
        <div className="container mx-auto px-4 py-4">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="text-blue-200 hover:text-white"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri Dön
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-blue-950/40 backdrop-blur border-blue-700/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl text-white mb-2">{account.name}</CardTitle>
                    <CardDescription className="text-blue-200 text-lg">
                      {category?.name}
                    </CardDescription>
                  </div>
                  <div className="text-3xl font-bold text-blue-300">
                    {account.price}₺
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Açıklama</h3>
                  <p className="text-blue-100 whitespace-pre-wrap">{account.description || 'Açıklama bulunmuyor.'}</p>
                </div>

                {account.details && (
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">Detaylar</h3>
                    <div className="bg-blue-900/30 rounded-lg p-4 text-blue-100 whitespace-pre-wrap">
                      {account.details}
                    </div>
                  </div>
                )}

                {/* Medya Önizleme */}
                {(account.image_file || account.video_url || account.video_file) && (
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">Medya Önizleme</h3>
                    
                    {/* Önce resim varsa onu göster */}
                    {account.image_file && (
                      <div className="bg-black rounded-lg overflow-hidden aspect-video mb-4">
                        <img 
                          src={`${BACKEND_URL}${account.image_file}`} 
                          alt={account.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Video önizleme butonu */}
                    {(account.video_url || account.video_file) && (
                      <Button
                        onClick={() => setVideoPreview(true)}
                        variant="outline"
                        className="border-blue-500 text-blue-200 hover:bg-blue-800"
                        data-testid="video-preview-btn"
                      >
                        <Video className="w-4 h-4 mr-2" />
                        {account.video_url && getVideoEmbedUrl(account.video_url) ? 'YouTube Videoyu İzle' : 'Videoyu İzle'}
                      </Button>
                    )}
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Hesap Bilgileri</h3>
                  <div className="bg-blue-900/30 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-200">Hesap ID:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-100 font-mono text-sm">{account.id}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(account.id, 'ID')}
                          className="text-blue-300 hover:text-blue-100 h-6 w-6 p-0"
                        >
                          {copiedId === account.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-200">Eklenme Tarihi:</span>
                      <span className="text-blue-100">{formatDate(account.created_at)}</span>
                    </div>
                    {account.updated_at && (
                      <div className="flex justify-between">
                        <span className="text-blue-200">Güncellenme Tarihi:</span>
                        <span className="text-blue-100">{formatDate(account.updated_at)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-blue-200">Görüntülenme:</span>
                      <span className="text-blue-100">{account.views} kez</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-200">Durum:</span>
                      <span className="text-green-400 font-semibold">Satışta</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="bg-blue-950/40 backdrop-blur border-blue-700/50 sticky top-24">
              <CardHeader>
                <CardTitle className="text-white">Satın Alma Seçenekleri</CardTitle>
                <CardDescription className="text-blue-200">
                  Ödeme yönteminizi seçin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleWhatsAppPurchase}
                  className="w-full bg-green-600 hover:bg-green-700 text-white justify-start"
                  data-testid="whatsapp-purchase-btn"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp ile İletişime Geç
                </Button>
                
                {hasAnyPayment && (
                  <Button
                    onClick={() => setPaymentDialog(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start"
                    data-testid="payment-options-btn"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Ödeme Yap
                  </Button>
                )}

                <div className="pt-4 border-t border-blue-700">
                  <Button
                    onClick={() => copyToClipboard(`${window.location.origin}/account/${account.id}`, 'Link')}
                    variant="outline"
                    className="w-full border-blue-500 text-blue-200 hover:bg-blue-800"
                    data-testid="share-link-btn"
                  >
                    {copiedId === `${window.location.origin}/account/${account.id}` ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    Linki Paylaş
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Video Preview Modal */}
      <Dialog open={videoPreview} onOpenChange={setVideoPreview}>
        <DialogContent className="max-w-4xl bg-blue-950 border-blue-700">
          <DialogHeader>
            <DialogTitle className="text-white">{account.name} - Video</DialogTitle>
            <DialogDescription className="text-blue-200">Video Önizleme</DialogDescription>
          </DialogHeader>
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {account.video_url && getVideoEmbedUrl(account.video_url) ? (
              <iframe
                src={getVideoEmbedUrl(account.video_url)}
                className="w-full h-full"
                allowFullScreen
                title="Video Preview"
              />
            ) : account.video_file ? (
              <video
                src={`${BACKEND_URL}${account.video_file}`}
                controls
                className="w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-blue-300">
                Video yüklenemedi
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="max-w-md bg-blue-950 border-blue-700">
          <DialogHeader>
            <DialogTitle className="text-white">Ödeme Yöntemi Seçin</DialogTitle>
            <DialogDescription className="text-blue-200">
              {account.name} - {account.price}₺
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue={hasIbanPayment ? "bank" : "card"} className="w-full">
            {(hasIbanPayment && hasCardPayment) && (
              <TabsList className="grid w-full grid-cols-2 bg-blue-900/50">
                <TabsTrigger value="bank" className="data-[state=active]:bg-blue-600">
                  <Building2 className="w-4 h-4 mr-2" />
                  Havale/EFT
                </TabsTrigger>
                <TabsTrigger value="card" className="data-[state=active]:bg-blue-600">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Kart ile
                </TabsTrigger>
              </TabsList>
            )}
            
            {hasIbanPayment && (
              <TabsContent value="bank" className="space-y-4">
                <div className="bg-blue-900/30 rounded-lg p-4 space-y-3">
                  <p className="text-blue-200 text-sm font-semibold">Banka Bilgileri:</p>
                  
                  <div className="space-y-2">
                    {settings.bank_name && (
                      <div className="flex items-start gap-2">
                        <Building className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-blue-300">Banka:</p>
                          <p className="text-white font-semibold">{settings.bank_name}</p>
                        </div>
                      </div>
                    )}
                    
                    {(settings.iban_name || settings.iban_surname) && (
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-blue-300">Hesap Sahibi:</p>
                          <p className="text-white font-semibold">
                            {settings.iban_name} {settings.iban_surname}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-950 p-3 rounded">
                    <p className="text-xs text-blue-300 mb-1">IBAN:</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-white font-mono text-xs break-all">{settings.iban}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(settings.iban, 'IBAN')}
                        className="text-blue-300 flex-shrink-0"
                      >
                        {copiedId === settings.iban ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="border-t border-blue-700 pt-3 mt-3">
                    <p className="text-blue-200 text-sm">1. Yukarıdaki IBAN'a <span className="font-semibold text-white">{account.price}₺</span> gönderin</p>
                    <p className="text-blue-200 text-sm mt-2">2. WhatsApp'tan dekont ve hesap ID'si gönderin</p>
                    <p className="text-blue-300 text-xs mt-2">Hesap ID: <span className="font-mono">{account.id}</span></p>
                  </div>
                </div>
                <Button
                  onClick={handleBankTransfer}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  data-testid="bank-transfer-btn"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  IBAN'ı Kopyala ve WhatsApp'a Git
                </Button>
              </TabsContent>
            )}
            
            {hasCardPayment && (
              <TabsContent value="card" className="space-y-4">
                <div className="bg-blue-900/30 rounded-lg p-4 space-y-3">
                  <p className="text-blue-200 text-sm">Kart ile ödeme için Shopier entegrasyonu kullanılır.</p>
                  <p className="text-blue-300 text-xs">Ödeme sonrası hesap ID'si ile WhatsApp'tan iletişime geçin.</p>
                  <p className="text-blue-300 text-xs">Hesap ID: <span className="font-mono">{account.id}</span></p>
                </div>
                <Button
                  onClick={handleCardPayment}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="card-payment-btn"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Kart ile Öde
                </Button>
              </TabsContent>
            )}

            {!hasAnyPayment && (
              <div className="p-4">
                <p className="text-blue-200 text-center">
                  Şu anda aktif ödeme yöntemi bulunmamaktadır. Lütfen WhatsApp ile iletişime geçin.
                </p>
              </div>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountDetail;