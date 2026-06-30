import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const LOGIN = 'Iconfood_Audit';
const PASSWORD = '2501Iconfood';
const STORAGE_KEY = 'auth_session';

export const isAuthenticated = () => sessionStorage.getItem(STORAGE_KEY) === '1';

interface Props {
  onAuth: () => void;
}

const LoginScreen = ({ onAuth }: Props) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login === LOGIN && password === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, '1');
      onAuth();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className={`w-full max-w-sm ${shake ? 'animate-[shake_0.4s_ease]' : ''}`}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Icon name="ShieldCheck" size={32} className="text-primary" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Вход в систему</h1>
          <p className="text-muted-foreground text-sm mt-1">Iconfood Audit</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Логин</label>
            <Input
              autoComplete="username"
              value={login}
              onChange={(e) => { setLogin(e.target.value); setError(false); }}
              className={`rounded-2xl h-12 ${error ? 'border-destructive' : ''}`}
              placeholder="Введите логин"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Пароль</label>
            <div className="relative">
              <Input
                autoComplete="current-password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                className={`rounded-2xl h-12 pr-12 ${error ? 'border-destructive' : ''}`}
                placeholder="Введите пароль"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name={showPass ? 'EyeOff' : 'Eye'} size={18} />
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <Icon name="CircleAlert" size={14} />
              Неверный логин или пароль
            </p>
          )}

          <Button type="submit" className="w-full rounded-2xl h-12 mt-2">
            Войти
          </Button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
};

export default LoginScreen;
