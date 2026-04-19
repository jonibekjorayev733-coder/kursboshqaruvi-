import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password.trim();

      const response = await api.login({ email: normalizedEmail, password: normalizedPassword });
      
      // Store token and user info in localStorage
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user_id', response.user_id.toString());
      localStorage.setItem('role', response.role);
      localStorage.setItem('name', response.name);
      localStorage.setItem('email', response.email);

      // Dispatch custom event for AppContext to update
      window.dispatchEvent(new CustomEvent('roleChanged', { detail: { role: response.role } }));

      // Redirect based on role
      if (response.role === 'admin') {
        navigate('/admin');
      } else if (response.role === 'teacher') {
        navigate('/teacher');
      } else if (response.role === 'student') {
        navigate('/student');
      }
    } catch (err: any) {
      const msg = err?.message || 'Email yoki parol noto\'g\'ri';
      setError(msg === 'Invalid credentials' ? 'Email yoki parol noto\'g\'ri' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-white shadow-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center text-gray-800">EduGrow</h1>
          <p className="text-center text-gray-600 mt-2">Tizimga kirish</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parol
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Kirish jarayonida...' : 'Kirish'}
          </Button>
        </form>

      </Card>
    </div>
  );
}
