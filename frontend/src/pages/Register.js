import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Şifreler eşleşmiyor!');
      return;
    }

    setLoading(true);

    try {
      await register(email, phone, password);
      toast.success('Kayıt başarılı!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kayıt başarısız!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-blue-950/40 backdrop-blur border-blue-700/50">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              size="sm"
              className="text-blue-300 hover:text-blue-100 hover:bg-blue-800/50"
              data-testid="back-to-home-btn"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ana Sayfa
            </Button>
          </div>
          <CardTitle className="text-2xl text-white text-center">Kayıt Ol</CardTitle>
          <CardDescription className="text-blue-200 text-center">
            Yeni hesap oluşturun
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-blue-200">Email *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-blue-900/50 border-blue-700 text-white"
                placeholder="ornek@email.com"
                data-testid="register-email-input"
              />
            </div>
            <div>
              <Label className="text-blue-200">Telefon (Opsiyonel)</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-blue-900/50 border-blue-700 text-white"
                placeholder="05XX XXX XX XX"
                data-testid="register-phone-input"
              />
            </div>
            <div>
              <Label className="text-blue-200">Şifre *</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-blue-900/50 border-blue-700 text-white"
                placeholder="••••••••"
                data-testid="register-password-input"
              />
            </div>
            <div>
              <Label className="text-blue-200">Şifre Tekrar *</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="bg-blue-900/50 border-blue-700 text-white"
                placeholder="••••••••"
                data-testid="register-confirm-password-input"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
              data-testid="register-submit-btn"
            >
              {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </Button>
          </form>
          <div className="mt-4 text-center text-blue-200">
            Zaten hesabınız var mı?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 underline">
              Giriş Yap
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;