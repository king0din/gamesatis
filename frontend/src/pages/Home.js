import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Video, LogIn, LogOut, UserPlus, Shield, Search, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [settings, setSettings] = useState({ site_name: 'Hesap Vitrini' });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchAccounts();
    fetchSettings();
    trackVisit();
  }, []);

  const trackVisit = async () => {
    try {
      await axios.post(`${API}/track/visit`);
    } catch (error) {
      console.error('Error tracking visit:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchAccounts = async (categoryId = null) => {
    try {
      const params = new URLSearchParams();
      if (categoryId) params.append('category_id', categoryId);
      if (searchTerm) params.append('search', searchTerm);
      params.append('status', 'available');
      
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

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    fetchAccounts(categoryId);
  };

  const handleSearch = () => {
    fetchAccounts(selectedCategory);
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success(`${type} kopyalandı!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAccountClick = (accountId) => {
    if (!user) {
      toast.error('Hesap detaylarını görmek için giriş yapmalısınız!');
      navigate('/login');
      return;
    }
    navigate(`/account/${accountId}`);
  };

  const filteredAccounts = selectedCategory
    ? accounts.filter(acc => acc.category_id === selectedCategory)
    : accounts;

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
      {/* Header */}
      <header className="bg-blue-900/50 backdrop-blur-sm border-b border-blue-700/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-white">{settings.site_name}</Link>
          <div className="flex gap-3">
            {user ? (
              <>
                {user.is_admin && (
                  <Button
                    onClick={() => navigate('/admin')}
                    variant="outline"
                    className="bg-blue-600 text-white hover:bg-blue-700 border-blue-500"
                    data-testid="admin-panel-btn"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Panel
                  </Button>
                )}
                <Button
                  onClick={logout}
                  variant="outline"
                  className="border-blue-400 text-blue-200 hover:bg-blue-800"
                  data-testid="logout-btn"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Çıkış
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => navigate('/login')}
                  variant="outline"
                  className="border-blue-400 text-blue-200 hover:bg-blue-800"
                  data-testid="login-nav-btn"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Giriş
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="register-nav-btn"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Kayıt Ol
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-6 flex gap-3">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Hesap adı veya ID ile ara..."
            className="bg-blue-900/50 border-blue-700 text-white placeholder:text-blue-400"
            data-testid="search-input"
          />
          <Button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="search-btn"
          >
            <Search className="w-4 h-4 mr-2" />
            Ara
          </Button>
        </div>

        {/* Categories */}
        <div className="flex gap-4 flex-wrap mb-8">
          <Button
            onClick={() => {
              setSelectedCategory(null);
              setSearchTerm('');
              fetchAccounts();
            }}
            variant={!selectedCategory ? 'default' : 'outline'}
            className={!selectedCategory ? 'bg-blue-600 text-white' : 'border-blue-400 text-blue-200 hover:bg-blue-800'}
            data-testid="all-categories-btn"
          >
            Tümü
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              className={selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'border-blue-400 text-blue-200 hover:bg-blue-800'}
              data-testid={`category-${cat.id}-btn`}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Accounts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredAccounts.map(account => {
            // Medya önceliği: 1. Resim, 2. Video dosyası, 3. YouTube
            const hasImage = account.image_file;
            const hasVideoFile = account.video_file;
            const hasYoutubeUrl = account.video_url && getVideoEmbedUrl(account.video_url);
            const hasAnyMedia = hasImage || hasVideoFile || hasYoutubeUrl;
            
            return (
              <Card key={account.id} className="bg-blue-950/40 backdrop-blur border-blue-700/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all" data-testid={`account-card-${account.id}`}>
                {/* Media Thumbnail */}
                {hasAnyMedia && (
                  <div className="relative w-full aspect-video bg-black rounded-t-lg overflow-hidden">
                    {hasImage ? (
                      // Önce resmi göster
                      <img
                        src={`${BACKEND_URL}${account.image_file}`}
                        alt={account.name}
                        className="w-full h-full object-cover"
                      />
                    ) : hasVideoFile ? (
                      // Resim yoksa video dosyasını göster
                      <video
                        src={`${BACKEND_URL}${account.video_file}`}
                        className="w-full h-full object-cover"
                        controls
                      />
                    ) : hasYoutubeUrl ? (
                      // Video dosyası da yoksa YouTube'u göster
                      <iframe
                        src={hasYoutubeUrl}
                        className="w-full h-full"
                        allowFullScreen
                        title={account.name}
                      />
                    ) : null}
                    
                    {/* Medya tipi göstergesi */}
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
                      {hasImage && <span>🖼️ Resim</span>}
                      {!hasImage && hasVideoFile && <span>🎥 Video</span>}
                      {!hasImage && !hasVideoFile && hasYoutubeUrl && <span>▶️ YouTube</span>}
                    </div>
                  </div>
                )}
                
                <CardHeader className="p-4">
                  <CardTitle className="text-white text-lg md:text-xl flex items-center justify-between gap-2">
                    <span className="truncate">{account.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(account.id, 'ID')}
                      className="text-blue-300 hover:text-blue-100 shrink-0"
                    >
                      {copiedId === account.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </CardTitle>
                  <CardDescription className="text-blue-200 text-sm">
                    {categories.find(c => c.id === account.category_id)?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-4 pt-0">
                  <p className="text-blue-100 line-clamp-2 text-sm">{account.description}</p>
                  <div className="text-xl md:text-2xl font-bold text-blue-300">{account.price}₺</div>
                </CardContent>
                <CardFooter className="flex gap-2 p-4 pt-0">
                  <Button
                    onClick={() => handleAccountClick(account.id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm md:text-base"
                    data-testid={`view-account-btn-${account.id}`}
                  >
                    İncele
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(`${window.location.origin}/account/${account.id}`, 'Link')}
                    className="border-blue-500 text-blue-200 hover:bg-blue-800 shrink-0"
                    data-testid={`copy-link-btn-${account.id}`}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {filteredAccounts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-blue-200 text-lg">Henüz hesap eklenmemiş veya arama sonucu bulunamadı.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;