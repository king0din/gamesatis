import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  LayoutDashboard, Package, Settings as SettingsIcon, BarChart3, 
  Plus, Trash2, Edit, Eye, Search, Home, LogOut, Copy, Check, Upload, Video, X
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Data states
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [settings, setSettings] = useState({});
  const [analytics, setAnalytics] = useState({});
  
  // Form states
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [newAccount, setNewAccount] = useState({
    category_id: '',
    name: '',
    price: '',
    description: '',
    details: '',
    video_url: ''
  });
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editAccount, setEditAccount] = useState(null);
  const [editVideoFile, setEditVideoFile] = useState(null);
  const [editVideoPreview, setEditVideoPreview] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [viewAccount, setViewAccount] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchAccounts();
    fetchSettings();
    fetchAnalytics();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await axios.get(`${API}/accounts?${params.toString()}`);
      setAccounts(response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
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

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/stats`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  // Video file handler for new account
  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
      toast.success('Video seçildi!');
    }
  };

  // Image file handler for new account
  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      toast.success('Resim seçildi!');
    }
  };

  // Video file handler for edit account
  const handleEditVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditVideoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setEditVideoPreview(previewUrl);
      toast.success('Yeni video seçildi!');
    }
  };

  // Image file handler for edit account
  const handleEditImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setEditImagePreview(previewUrl);
      toast.success('Yeni resim seçildi!');
    }
  };

  // Remove video from new account
  const removeVideoFile = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setNewAccount({ ...newAccount, video_url: '' });
    toast.info('Video kaldırıldı');
  };

  // Remove image from new account
  const removeImageFile = () => {
    setImageFile(null);
    setImagePreview(null);
    toast.info('Resim kaldırıldı');
  };

  // Remove video from edit account
  const removeEditVideoFile = () => {
    setEditVideoFile(null);
    setEditVideoPreview(null);
    if (editAccount) {
      setEditAccount({ ...editAccount, video_url: '', video_file: '' });
    }
    toast.info('Video kaldırıldı');
  };

  // Remove image from edit account
  const removeEditImageFile = () => {
    setEditImageFile(null);
    setEditImagePreview(null);
    if (editAccount) {
      setEditAccount({ ...editAccount, image_file: '' });
    }
    toast.info('Resim kaldırıldı');
  };

  // Category operations
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategory.name.trim()) {
      toast.error('Kategori adı boş olamaz!');
      return;
    }

    try {
      await axios.post(`${API}/categories`, newCategory);
      toast.success('✅ Kategori başarıyla eklendi!');
      setNewCategory({ name: '', description: '' });
      fetchCategories();
    } catch (error) {
      toast.error('❌ Kategori eklenirken hata oluştu!');
      console.error(error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Bu kategoriyi ve tüm hesaplarını silmek istediğinizden emin misiniz?')) return;
    
    try {
      await axios.delete(`${API}/categories/${categoryId}`);
      toast.success('✅ Kategori silindi!');
      fetchCategories();
      fetchAccounts();
      fetchAnalytics();
    } catch (error) {
      toast.error('❌ Kategori silinirken hata oluştu!');
      console.error(error);
    }
  };

  // Account operations
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    
    if (!newAccount.category_id) {
      toast.error('Kategori seçmelisiniz!');
      return;
    }
    if (!newAccount.name.trim()) {
      toast.error('Hesap adı boş olamaz!');
      return;
    }
    if (!newAccount.price || parseFloat(newAccount.price) <= 0) {
      toast.error('Geçerli bir fiyat giriniz!');
      return;
    }

    setUploadingVideo(true);
    const loadingToast = toast.loading('Hesap ekleniyor...');

    try {
      let videoFileUrl = '';
      let imageFileUrl = '';
      
      if (videoFile) {
        toast.loading('Video yükleniyor...', { id: loadingToast });
        const formData = new FormData();
        formData.append('file', videoFile);
        const uploadResponse = await axios.post(`${API}/upload/video`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        videoFileUrl = uploadResponse.data.url;
      }
      
      if (imageFile) {
        toast.loading('Resim yükleniyor...', { id: loadingToast });
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadResponse = await axios.post(`${API}/upload/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageFileUrl = uploadResponse.data.url;
      }
      
      const accountData = {
        ...newAccount,
        price: parseFloat(newAccount.price),
        video_file: videoFileUrl,
        image_file: imageFileUrl
      };
      
      await axios.post(`${API}/accounts`, accountData);
      toast.success('✅ Hesap başarıyla eklendi!', { id: loadingToast });
      
      // Reset form
      setNewAccount({
        category_id: '',
        name: '',
        price: '',
        description: '',
        details: '',
        video_url: ''
      });
      setVideoFile(null);
      setVideoPreview(null);
      setImageFile(null);
      setImagePreview(null);
      
      fetchAccounts();
      fetchAnalytics();
    } catch (error) {
      toast.error('❌ Hesap eklenirken hata oluştu!', { id: loadingToast });
      console.error(error);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    
    if (!editAccount.name.trim()) {
      toast.error('Hesap adı boş olamaz!');
      return;
    }
    if (!editAccount.price || parseFloat(editAccount.price) <= 0) {
      toast.error('Geçerli bir fiyat giriniz!');
      return;
    }

    setUploadingVideo(true);
    const loadingToast = toast.loading('Hesap güncelleniyor...');

    try {
      let videoFileUrl = editAccount.video_file || '';
      let imageFileUrl = editAccount.image_file || '';
      
      if (editVideoFile) {
        toast.loading('Yeni video yükleniyor...', { id: loadingToast });
        const formData = new FormData();
        formData.append('file', editVideoFile);
        const uploadResponse = await axios.post(`${API}/upload/video`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        videoFileUrl = uploadResponse.data.url;
      }
      
      if (editImageFile) {
        toast.loading('Yeni resim yükleniyor...', { id: loadingToast });
        const formData = new FormData();
        formData.append('file', editImageFile);
        const uploadResponse = await axios.post(`${API}/upload/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageFileUrl = uploadResponse.data.url;
      }
      
      await axios.put(`${API}/accounts/${editAccount.id}`, {
        name: editAccount.name,
        price: parseFloat(editAccount.price),
        description: editAccount.description,
        details: editAccount.details,
        video_url: editAccount.video_url,
        video_file: videoFileUrl,
        image_file: imageFileUrl,
        status: editAccount.status
      });
      
      toast.success('✅ Hesap başarıyla güncellendi!', { id: loadingToast });
      setEditAccount(null);
      setEditVideoFile(null);
      setEditVideoPreview(null);
      setEditImageFile(null);
      setEditImagePreview(null);
      fetchAccounts();
      fetchAnalytics();
    } catch (error) {
      toast.error('❌ Hesap güncellenirken hata oluştu!', { id: loadingToast });
      console.error(error);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (!window.confirm('Bu hesabı silmek istediğinizden emin misiniz?')) return;
    
    const loadingToast = toast.loading('Hesap siliniyor...');
    
    try {
      await axios.delete(`${API}/accounts/${accountId}`);
      toast.success('✅ Hesap başarıyla silindi!', { id: loadingToast });
      fetchAccounts();
      fetchAnalytics();
    } catch (error) {
      toast.error('❌ Hesap silinirken hata oluştu!', { id: loadingToast });
      console.error(error);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Ayarlar kaydediliyor...');
    
    try {
      await axios.put(`${API}/settings`, settings);
      toast.success('✅ Ayarlar başarıyla güncellendi!', { id: loadingToast });
    } catch (error) {
      toast.error('❌ Ayarlar güncellenirken hata oluştu!', { id: loadingToast });
      console.error(error);
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

  const getStatusBadge = (status) => {
    const badges = {
      available: <span className="px-2 py-1 bg-green-600 text-white rounded text-xs">Satışta</span>,
      pending: <span className="px-2 py-1 bg-yellow-600 text-white rounded text-xs">Beklemede</span>,
      sold: <span className="px-2 py-1 bg-red-600 text-white rounded text-xs">Satıldı</span>
    };
    return badges[status] || badges.available;
  };

  const getVideoEmbedUrl = (url) => {
    if (!url) return null;
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950">
      <header className="bg-blue-900/50 backdrop-blur-sm border-b border-blue-700/50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/')} variant="outline" className="border-blue-400 text-blue-200 hover:bg-blue-800">
              <Home className="w-4 h-4 mr-2" />Ana Sayfa
            </Button>
            <Button onClick={logout} variant="outline" className="border-blue-400 text-blue-200 hover:bg-blue-800">
              <LogOut className="w-4 h-4 mr-2" />Çıkış
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-blue-900/50 border border-blue-700/50">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-blue-200">
              <BarChart3 className="w-4 h-4 mr-2" />Dashboard
            </TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-blue-200">
              <Package className="w-4 h-4 mr-2" />Kategoriler
            </TabsTrigger>
            <TabsTrigger value="accounts" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-blue-200">
              <LayoutDashboard className="w-4 h-4 mr-2" />Hesaplar
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-blue-200">
              <SettingsIcon className="w-4 h-4 mr-2" />Ayarlar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-blue-950/40 backdrop-blur border-blue-700/50">
                <CardHeader><CardTitle className="text-blue-200 text-sm">Toplam Hesap</CardTitle></CardHeader>
                <CardContent><div className="text-4xl font-bold text-white">{analytics.total_accounts || 0}</div></CardContent>
              </Card>
              <Card className="bg-blue-950/40 backdrop-blur border-blue-700/50">
                <CardHeader><CardTitle className="text-green-400 text-sm">Satışta</CardTitle></CardHeader>
                <CardContent><div className="text-4xl font-bold text-white">{analytics.available_accounts || 0}</div></CardContent>
              </Card>
              <Card className="bg-blue-950/40 backdrop-blur border-blue-700/50">
                <CardHeader><CardTitle className="text-red-400 text-sm">Satıldı</CardTitle></CardHeader>
                <CardContent><div className="text-4xl font-bold text-white">{analytics.sold_accounts || 0}</div></CardContent>
              </Card>
              <Card className="bg-blue-950/40 backdrop-blur border-blue-700/50">
                <CardHeader><CardTitle className="text-yellow-400 text-sm">Beklemede</CardTitle></CardHeader>
                <CardContent><div className="text-4xl font-bold text-white">{analytics.pending_accounts || 0}</div></CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-blue-950/40 backdrop-blur border-blue-700/50">
                <CardHeader><CardTitle className="text-white">Genel İstatistikler</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-blue-200">Kategori Sayısı:</span>
                    <span className="text-white font-semibold">{analytics.total_categories || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Kullanıcı Sayısı:</span>
                    <span className="text-white font-semibold">{analytics.total_users || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Son 30 Gün Ziyaret:</span>
                    <span className="text-white font-semibold">{analytics.visits_last_30_days || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-950/40 backdrop-blur border-blue-700/50">
                <CardHeader><CardTitle className="text-white">En Çok Görüntülenen Hesaplar</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.most_viewed_accounts?.slice(0, 5).map(acc => (
                      <div key={acc.id} className="flex justify-between items-center text-sm">
                        <span className="text-blue-200 truncate flex-1">{acc.name}</span>
                        <span className="text-white font-semibold ml-2">{acc.views} görüntüleme</span>
                      </div>
                    ))}
                    {!analytics.most_viewed_accounts?.length && <p className="text-blue-300 text-sm">Henüz veri yok</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card className="bg-blue-950/40 backdrop-blur border-blue-700/50">
              <CardHeader><CardTitle className="text-white">Yeni Kategori Ekle</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div>
                    <Label className="text-blue-200">Kategori Adı *</Label>
                    <Input value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} required className="bg-blue-900/50 border-blue-700 text-white" placeholder="Örn: Fortnite" />
                  </div>
                  <div>
                    <Label className="text-blue-200">Açıklama</Label>
                    <Textarea value={newCategory.description} onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })} className="bg-blue-900/50 border-blue-700 text-white" placeholder="Kategori açıklaması..." />
                  </div>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />Kategori Ekle
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {categories.map(cat => (
                <Card key={cat.id} className="bg-blue-950/40 backdrop-blur border-blue-700/50">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-white">{cat.name}</CardTitle>
                      <CardDescription className="text-blue-200">{cat.description}</CardDescription>
                    </div>
                    <Button onClick={() => handleDeleteCategory(cat.id)} variant="destructive" size="icon">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-6">
            <Card className="bg-blue-950/40 backdrop-blur border-blue-700/50">
              <CardHeader><CardTitle className="text-white">Yeni Hesap Ekle</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleCreateAccount} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-blue-200">Kategori *</Label>
                      <select value={newAccount.category_id} onChange={(e) => setNewAccount({ ...newAccount, category_id: e.target.value })} required className="w-full px-3 py-2 bg-blue-900/50 border border-blue-700 text-white rounded-md">
                        <option value="">Kategori Seçin</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-blue-200">Hesap Adı *</Label>
                      <Input value={newAccount.name} onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })} required className="bg-blue-900/50 border-blue-700 text-white" placeholder="Örn: Level 50 Hesap" />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-blue-200">Fiyat (₺) *</Label>
                    <Input type="number" step="0.01" value={newAccount.price} onChange={(e) => setNewAccount({ ...newAccount, price: e.target.value })} required className="bg-blue-900/50 border-blue-700 text-white" placeholder="99.99" />
                  </div>
                  
                  <div>
                    <Label className="text-blue-200">Kısa Açıklama</Label>
                    <Textarea value={newAccount.description} onChange={(e) => setNewAccount({ ...newAccount, description: e.target.value })} className="bg-blue-900/50 border-blue-700 text-white" placeholder="Kısa açıklama..." rows={2} />
                  </div>
                  
                  <div>
                    <Label className="text-blue-200">Detaylı Bilgi (Opsiyonel)</Label>
                    <Textarea value={newAccount.details} onChange={(e) => setNewAccount({ ...newAccount, details: e.target.value })} className="bg-blue-900/50 border-blue-700 text-white" placeholder="Level, rank, skin sayısı vs..." rows={4} />
                  </div>

                  {/* Image Section */}
                  <div className="space-y-3">
                    <Label className="text-blue-200">Kapak Resmi (Opsiyonel)</Label>
                    <p className="text-xs text-blue-300">Ana sayfada gösterilecek ön kapak resmi</p>
                    {imagePreview && (
                      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <Button type="button" onClick={removeImageFile} variant="destructive" size="sm" className="absolute top-2 right-2">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {!imagePreview && (
                      <label>
                        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-900/50 border-2 border-dashed border-blue-700 rounded-lg cursor-pointer hover:bg-blue-800/50 transition-colors">
                          <Upload className="w-5 h-5 text-blue-300" />
                          <span className="text-blue-200">Resim Dosyası Yükle (JPG, PNG)</span>
                        </div>
                        <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                      </label>
                    )}
                  </div>

                  {/* Video Section */}
                  <div className="space-y-3">
                    <Label className="text-blue-200">Video (Opsiyonel)</Label>
                    {(videoPreview || newAccount.video_url) && (
                      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                        {videoPreview ? (
                          <video src={videoPreview} controls className="w-full h-full" />
                        ) : newAccount.video_url && getVideoEmbedUrl(newAccount.video_url) ? (
                          <iframe src={getVideoEmbedUrl(newAccount.video_url)} className="w-full h-full" allowFullScreen />
                        ) : null}
                        <Button type="button" onClick={removeVideoFile} variant="destructive" size="sm" className="absolute top-2 right-2">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {!videoPreview && !newAccount.video_url && (
                      <label className="flex-1">
                        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-900/50 border-2 border-dashed border-blue-700 rounded-lg cursor-pointer hover:bg-blue-800/50 transition-colors">
                          <Upload className="w-5 h-5 text-blue-300" />
                          <span className="text-blue-200">Video Dosyası Yükle</span>
                        </div>
                        <input type="file" accept="video/*" onChange={handleVideoFileChange} className="hidden" />
                      </label>
                    )}
                    {!videoPreview && (
                      <div>
                        <Label className="text-blue-200 text-sm">VEYA YouTube Video URL</Label>
                        <Input value={newAccount.video_url} onChange={(e) => setNewAccount({ ...newAccount, video_url: e.target.value })} className="bg-blue-900/50 border-blue-700 text-white" placeholder="https://www.youtube.com/watch?v=..." />
                      </div>
                    )}
                  </div>
                  
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white w-full" disabled={uploadingVideo}>
                    {uploadingVideo ? (
                      <><Video className="w-4 h-4 mr-2 animate-pulse" />Yükleniyor...</>
                    ) : (
                      <><Plus className="w-4 h-4 mr-2" />Hesap Ekle</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Search and Filter */}
            <Card className="bg-blue-950/40 backdrop-blur border-blue-700/50">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Hesap adı veya ID ile ara..." className="bg-blue-900/50 border-blue-700 text-white flex-1" />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-blue-900/50 border border-blue-700 text-white rounded-md">
                    <option value="all">Tüm Durumlar</option>
                    <option value="available">Satışta</option>
                    <option value="pending">Beklemede</option>
                    <option value="sold">Satıldı</option>
                  </select>
                  <Button onClick={fetchAccounts} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Search className="w-4 h-4 mr-2" />Ara
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Accounts List */}
            <div className="grid gap-4">
              {accounts.map(account => (
                <Card key={account.id} className="bg-blue-950/40 backdrop-blur border-blue-700/50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white flex items-center gap-3">
                          {account.name}
                          {getStatusBadge(account.status)}
                        </CardTitle>
                        <CardDescription className="text-blue-200">
                          {categories.find(c => c.id === account.category_id)?.name} - {account.price}₺
                        </CardDescription>
                        <div className="mt-2 flex items-center gap-2 text-xs text-blue-300">
                          <span>ID: {account.id.slice(0, 8)}...</span>
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(account.id, 'ID')} className="h-5 w-5 p-0">
                            {copiedId === account.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </Button>
                          <span className="ml-3">{account.views} görüntüleme</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => setViewAccount(account)} variant="outline" size="icon" className="border-blue-500 text-blue-200 hover:bg-blue-800">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => setEditAccount(account)} variant="outline" size="icon" className="border-blue-500 text-blue-200 hover:bg-blue-800">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => handleDeleteAccount(account.id)} variant="destructive" size="icon">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="bg-blue-950/40 backdrop-blur border-blue-700/50">
              <CardHeader>
                <CardTitle className="text-white">Site Ayarları</CardTitle>
                <CardDescription className="text-blue-200">Genel ayarları buradan yönetin</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateSettings} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white border-b border-blue-700 pb-2">Genel Ayarlar</h3>
                    <div>
                      <Label className="text-blue-200">Site Adı</Label>
                      <Input value={settings.site_name || ''} onChange={(e) => setSettings({ ...settings, site_name: e.target.value })} className="bg-blue-900/50 border-blue-700 text-white" placeholder="Hesap Vitrini" />
                    </div>
                    <div>
                      <Label className="text-blue-200">WhatsApp Numarası</Label>
                      <Input value={settings.whatsapp_number || ''} onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })} placeholder="905551234567 (ülke kodu ile)" className="bg-blue-900/50 border-blue-700 text-white" />
                      <p className="text-sm text-blue-300 mt-1">Ülke kodu ile birlikte girin (örn: 905551234567)</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white border-b border-blue-700 pb-2">Banka Bilgileri</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-blue-200">Hesap Sahibi Adı *</Label>
                        <Input value={settings.iban_name || ''} onChange={(e) => setSettings({ ...settings, iban_name: e.target.value })} placeholder="Ahmet" className="bg-blue-900/50 border-blue-700 text-white" />
                      </div>
                      <div>
                        <Label className="text-blue-200">Hesap Sahibi Soyadı *</Label>
                        <Input value={settings.iban_surname || ''} onChange={(e) => setSettings({ ...settings, iban_surname: e.target.value })} placeholder="Yılmaz" className="bg-blue-900/50 border-blue-700 text-white" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-blue-200">Banka Adı *</Label>
                      <Input value={settings.bank_name || ''} onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })} placeholder="Ziraat Bankası" className="bg-blue-900/50 border-blue-700 text-white" />
                    </div>
                    <div>
                      <Label className="text-blue-200">IBAN *</Label>
                      <Input value={settings.iban || ''} onChange={(e) => setSettings({ ...settings, iban: e.target.value })} placeholder="TR00 0000 0000 0000 0000 0000 00" className="bg-blue-900/50 border-blue-700 text-white" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white border-b border-blue-700 pb-2">Shopier Entegrasyonu</h3>
                    <div className="bg-blue-800/30 rounded-lg p-4 mb-4">
                      <p className="text-sm text-blue-200 mb-2"><strong>Webhook/Callback URL'i:</strong></p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-blue-950 px-3 py-2 rounded text-blue-100 text-xs break-all">{BACKEND_URL}/api/payment/shopier/callback</code>
                        <Button type="button" size="sm" variant="outline" onClick={() => {
                          navigator.clipboard.writeText(`${BACKEND_URL}/api/payment/shopier/callback`);
                          toast.success('Callback URL kopyalandı!');
                        }} className="border-blue-500 text-blue-200 hover:bg-blue-800 flex-shrink-0">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-blue-300 mt-2">Bu URL'i Shopier panelinde "Bildirim URL" olarak ekleyin</p>
                    </div>
                    <div>
                      <Label className="text-blue-200">Shopier API Key *</Label>
                      <Input value={settings.shopier_api_key || ''} onChange={(e) => setSettings({ ...settings, shopier_api_key: e.target.value })} placeholder="Shopier API anahtarı" className="bg-blue-900/50 border-blue-700 text-white" />
                    </div>
                    <div>
                      <Label className="text-blue-200">Shopier API Secret *</Label>
                      <Input type="password" value={settings.shopier_api_secret || ''} onChange={(e) => setSettings({ ...settings, shopier_api_secret: e.target.value })} placeholder="Shopier API gizli anahtarı" className="bg-blue-900/50 border-blue-700 text-white" />
                    </div>
                    <div>
                      <Label className="text-blue-200">Website Index (Varsayılan: 1)</Label>
                      <Input value={settings.shopier_website_index || '1'} onChange={(e) => setSettings({ ...settings, shopier_website_index: e.target.value })} placeholder="1" className="bg-blue-900/50 border-blue-700 text-white" />
                      <p className="text-xs text-blue-300 mt-1">Shopier panelinde birden fazla siteniz varsa, ilgili sitenin index numarasını girin</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white border-b border-blue-700 pb-2">Ödeme Metodları</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-blue-900/30 rounded-lg">
                        <div>
                          <Label className="text-blue-200 font-semibold">IBAN ile Ödeme</Label>
                          <p className="text-sm text-blue-300 mt-1">Havale/EFT ile ödeme seçeneğini aktif et</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={settings.enable_iban_payment !== false} onChange={(e) => setSettings({ ...settings, enable_iban_payment: e.target.checked })} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-blue-900/30 rounded-lg">
                        <div>
                          <Label className="text-blue-200 font-semibold">Kart ile Ödeme</Label>
                          <p className="text-sm text-blue-300 mt-1">Shopier ile kredi kartı ödemesini aktif et</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={settings.enable_card_payment !== false} onChange={(e) => setSettings({ ...settings, enable_card_payment: e.target.checked })} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Ayarları Kaydet</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* View Account Dialog */}
      <Dialog open={!!viewAccount} onOpenChange={() => setViewAccount(null)}>
        <DialogContent className="max-w-2xl bg-blue-950 border-blue-700 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{viewAccount?.name}</DialogTitle>
            <DialogDescription className="text-blue-200">Hesap Detayları</DialogDescription>
          </DialogHeader>
          {viewAccount && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-blue-200">Kategori:</span><p className="text-white">{categories.find(c => c.id === viewAccount.category_id)?.name}</p></div>
                <div><span className="text-blue-200">Fiyat:</span><p className="text-white">{viewAccount.price}₺</p></div>
                <div><span className="text-blue-200">Durum:</span><div className="mt-1">{getStatusBadge(viewAccount.status)}</div></div>
                <div><span className="text-blue-200">Görüntülenme:</span><p className="text-white">{viewAccount.views} kez</p></div>
                <div className="col-span-2"><span className="text-blue-200">ID:</span><p className="text-white font-mono text-xs">{viewAccount.id}</p></div>
                <div><span className="text-blue-200">Eklenme Tarihi:</span><p className="text-white text-xs">{formatDate(viewAccount.created_at)}</p></div>
                <div><span className="text-blue-200">Güncellenme:</span><p className="text-white text-xs">{formatDate(viewAccount.updated_at)}</p></div>
                {viewAccount.sold_at && <div className="col-span-2"><span className="text-blue-200">Satış Tarihi:</span><p className="text-white text-xs">{formatDate(viewAccount.sold_at)}</p></div>}
              </div>
              
              {viewAccount.image_file && (
                <div>
                  <span className="text-blue-200 text-sm">Resim:</span>
                  <div className="mt-2 bg-black rounded-lg overflow-hidden aspect-video">
                    <img src={`${BACKEND_URL}${viewAccount.image_file}`} alt={viewAccount.name} className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
              
              {(viewAccount.video_url || viewAccount.video_file) && (
                <div>
                  <span className="text-blue-200 text-sm">Video:</span>
                  <div className="mt-2 bg-black rounded-lg overflow-hidden aspect-video">
                    {viewAccount.video_url && getVideoEmbedUrl(viewAccount.video_url) ? (
                      <iframe src={getVideoEmbedUrl(viewAccount.video_url)} className="w-full h-full" allowFullScreen />
                    ) : viewAccount.video_file ? (
                      <video src={`${BACKEND_URL}${viewAccount.video_file}`} controls className="w-full h-full" />
                    ) : null}
                  </div>
                </div>
              )}
              
              <div><span className="text-blue-200 text-sm">Açıklama:</span><p className="text-white mt-1 whitespace-pre-wrap">{viewAccount.description}</p></div>
              {viewAccount.details && <div><span className="text-blue-200 text-sm">Detaylar:</span><p className="text-white mt-1 whitespace-pre-wrap bg-blue-900/30 p-3 rounded">{viewAccount.details}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={!!editAccount} onOpenChange={() => {
        setEditAccount(null);
        setEditVideoFile(null);
        setEditVideoPreview(null);
        setEditImageFile(null);
        setEditImagePreview(null);
      }}>
        <DialogContent className="max-w-2xl bg-blue-950 border-blue-700 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Hesap Düzenle</DialogTitle>
            <DialogDescription className="text-blue-200">{editAccount?.name}</DialogDescription>
          </DialogHeader>
          {editAccount && (
            <form onSubmit={handleUpdateAccount} className="space-y-4">
              <div><Label className="text-blue-200">Hesap Adı *</Label><Input value={editAccount.name} onChange={(e) => setEditAccount({ ...editAccount, name: e.target.value })} className="bg-blue-900/50 border-blue-700 text-white" required /></div>
              <div><Label className="text-blue-200">Fiyat (₺) *</Label><Input type="number" step="0.01" value={editAccount.price} onChange={(e) => setEditAccount({ ...editAccount, price: e.target.value })} className="bg-blue-900/50 border-blue-700 text-white" required /></div>
              <div>
                <Label className="text-blue-200">Durum</Label>
                <select value={editAccount.status} onChange={(e) => setEditAccount({ ...editAccount, status: e.target.value })} className="w-full px-3 py-2 bg-blue-900/50 border border-blue-700 text-white rounded-md">
                  <option value="available">Satışta</option>
                  <option value="pending">Beklemede</option>
                  <option value="sold">Satıldı</option>
                </select>
              </div>
              <div><Label className="text-blue-200">Açıklama</Label><Textarea value={editAccount.description} onChange={(e) => setEditAccount({ ...editAccount, description: e.target.value })} className="bg-blue-900/50 border-blue-700 text-white" rows={3} /></div>
              <div><Label className="text-blue-200">Detaylar</Label><Textarea value={editAccount.details || ''} onChange={(e) => setEditAccount({ ...editAccount, details: e.target.value })} className="bg-blue-900/50 border-blue-700 text-white" rows={4} /></div>

              {/* Image Section */}
              <div className="space-y-3">
                <Label className="text-blue-200">Kapak Resmi</Label>
                {(editImagePreview || editAccount.image_file) && (
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    {editImagePreview ? (
                      <img src={editImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : editAccount.image_file ? (
                      <img src={`${BACKEND_URL}${editAccount.image_file}`} alt="Current" className="w-full h-full object-cover" />
                    ) : null}
                    <Button type="button" onClick={removeEditImageFile} variant="destructive" size="sm" className="absolute top-2 right-2">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {!editImagePreview && !editAccount.image_file && (
                  <label>
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-900/50 border-2 border-dashed border-blue-700 rounded-lg cursor-pointer hover:bg-blue-800/50 transition-colors">
                      <Upload className="w-5 h-5 text-blue-300" />
                      <span className="text-blue-200">Yeni Resim Yükle</span>
                    </div>
                    <input type="file" accept="image/*" onChange={handleEditImageFileChange} className="hidden" />
                  </label>
                )}
              </div>

              {/* Video Section */}
              <div className="space-y-3">
                <Label className="text-blue-200">Video</Label>
                {(editVideoPreview || editAccount.video_file || editAccount.video_url) && (
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    {editVideoPreview ? (
                      <video src={editVideoPreview} controls className="w-full h-full" />
                    ) : editAccount.video_file ? (
                      <video src={`${BACKEND_URL}${editAccount.video_file}`} controls className="w-full h-full" />
                    ) : editAccount.video_url && getVideoEmbedUrl(editAccount.video_url) ? (
                      <iframe src={getVideoEmbedUrl(editAccount.video_url)} className="w-full h-full" allowFullScreen />
                    ) : null}
                    <Button type="button" onClick={removeEditVideoFile} variant="destructive" size="sm" className="absolute top-2 right-2">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {!editVideoPreview && !editAccount.video_file && !editAccount.video_url && (
                  <label>
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-900/50 border-2 border-dashed border-blue-700 rounded-lg cursor-pointer hover:bg-blue-800/50 transition-colors">
                      <Upload className="w-5 h-5 text-blue-300" />
                      <span className="text-blue-200">Yeni Video Yükle</span>
                    </div>
                    <input type="file" accept="video/*" onChange={handleEditVideoFileChange} className="hidden" />
                  </label>
                )}
                {!editVideoPreview && !editAccount.video_file && (
                  <div>
                    <Label className="text-blue-200 text-sm">VEYA YouTube Video URL</Label>
                    <Input value={editAccount.video_url || ''} onChange={(e) => setEditAccount({ ...editAccount, video_url: e.target.value })} className="bg-blue-900/50 border-blue-700 text-white" placeholder="https://www.youtube.com/watch?v=..." />
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setEditAccount(null);
                  setEditVideoFile(null);
                  setEditVideoPreview(null);
                  setEditImageFile(null);
                  setEditImagePreview(null);
                }} className="border-blue-500 text-blue-200">İptal</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={uploadingVideo}>
                  {uploadingVideo ? 'Güncelleniyor...' : 'Güncelle'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;