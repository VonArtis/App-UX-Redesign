import React, { useState } from 'react';
import type { AuthScreenProps } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { LanguageSelector } from '../common/LanguageSelector';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';

export const LoginScreen: React.FC<AuthScreenProps> = ({ onLogin, onCreateAccount, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { login, loading } = useAuth();
  const { t } = useLanguage();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = t('auth:login.validation.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('auth:login.validation.emailInvalid');
    }
    
    if (!password) {
      newErrors.password = t('auth:login.validation.passwordRequired');
    } else if (password.length < 6) {
      newErrors.password = t('auth:login.validation.passwordTooShort');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    const user = await login(email, password);
    if (user && onLogin) {
      onLogin(user);
    } else {
      setErrors({ password: t('auth:login.validation.invalidCredentials') });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8 flex flex-col">
      {/* Language Selector in Header */}
      <div className="absolute top-4 right-4">
        <LanguageSelector variant="compact" />
      </div>
      
      <ScreenHeader title={t('auth:login.title')} onBack={onBack} />

      <div className="space-y-5">
        <Input
          label={t('auth:login.emailLabel')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('auth:login.emailPlaceholder')}
          required
          error={errors.email}
        />
        
        <Input
          label={t('auth:login.passwordLabel')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('auth:login.passwordPlaceholder')}
          required
          error={errors.password}
        />
      </div>

      <div className="mt-8">
        <Button 
          onClick={handleLogin}
          loading={loading}
          fullWidth
          size="lg"
        >
          {t('auth:login.signInButton')}
        </Button>
        
        <p className="text-center text-sm text-white mt-4">
          {t('auth:login.noAccountPrefix')}{' '}
          <span 
            className="text-purple-400 font-medium cursor-pointer hover:text-purple-300 transition-colors" 
            onClick={onCreateAccount}
          >
            {t('auth:login.createAccountLink')}
          </span>
        </p>
      </div>
    </div>
  );
};