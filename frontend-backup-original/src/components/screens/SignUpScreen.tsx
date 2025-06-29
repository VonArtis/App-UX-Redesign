import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AuthScreenProps } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { LanguageSelector } from '../common/LanguageSelector';
import { PasswordStrength } from '../common/PasswordStrength';
import { PasswordInput } from '../common/PasswordInput';
import { EmailInput } from '../common/EmailInput';
import { ThemeToggle } from '../common/ThemeToggle';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { formatPhoneNumber, validatePhoneNumber, cleanPhoneNumber, getUserCountryCode, detectCountryFromIP } from '../../utils/phoneFormatter';
import { validateEmailSmart, EmailValidationResult } from '../../utils/emailValidator';

export const SignUpScreen: React.FC<AuthScreenProps> = ({ onContinue, onGoToLogin, onNavigate }) => {
  const { user, signup } = useAuth(); // Get current user for verification status
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    countryCode: getUserCountryCode() // Auto-detect user's country
  });

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Smart loading states
  const [loadingState, setLoadingState] = useState<{
    isLoading: boolean;
    message: string;
    stage: 'idle' | 'validating' | 'creating' | 'securing' | 'finalizing';
  }>({
    isLoading: false,
    message: '',
    stage: 'idle'
  });

  // Country detection state
  const [countryDetection, setCountryDetection] = useState<{
    isDetecting: boolean;
    detected: boolean;
    method: 'ip' | 'language' | 'fallback';
    countryName: string;
  }>({
    isDetecting: true,
    detected: false,
    method: 'fallback',
    countryName: 'Unknown'
  });

  // Error shake animations state
  const [shakeErrors, setShakeErrors] = useState<Record<string, boolean>>({});

  // Field refs for auto-focus
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  // Auto-focus logic
  useEffect(() => {
    // Focus name field when component mounts
    if (nameRef.current) {
      nameRef.current.focus();
    }
  }, []);

  // Smart country detection
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const detection = await detectCountryFromIP();
        
        // Update form with detected country code
        setForm(prev => ({
          ...prev,
          countryCode: detection.countryCode
        }));
        
        // Update detection state
        setCountryDetection({
          isDetecting: false,
          detected: detection.detected,
          method: detection.method,
          countryName: detection.countryName
        });
        
      } catch (error) {
        console.error('Country detection failed:', error);
        
        // Fallback to default
        setCountryDetection({
          isDetecting: false,
          detected: false,
          method: 'fallback',
          countryName: 'United States'
        });
      }
    };
    
    detectCountry();
  }, []);

  // Auto-focus next field when current field is completed
  useEffect(() => {
    // Name is complete (at least 2 words, 3+ chars each)
    if (form.name.trim().length >= 6 && form.name.includes(' ') && emailRef.current && !form.email) {
      emailRef.current.focus();
    }
  }, [form.name, form.email]);

  useEffect(() => {
    // Email is complete (valid format)
    if (form.email && validateEmailSmart(form.email).isValid && passwordRef.current && !form.password) {
      passwordRef.current.focus();
    }
  }, [form.email, form.password]);

  useEffect(() => {
    // Password is complete (meets strength requirements)
    if (form.password.length >= 8 && confirmPasswordRef.current && !form.confirmPassword) {
      confirmPasswordRef.current.focus();
    }
  }, [form.password, form.confirmPassword]);

  useEffect(() => {
    // Confirm password matches
    if (form.confirmPassword && form.password === form.confirmPassword && phoneRef.current && !form.phone) {
      phoneRef.current.focus();
    }
  }, [form.confirmPassword, form.password, form.phone]);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailValidation, setEmailValidation] = useState<EmailValidationResult>({ isValid: true, type: 'valid' });
  const [phoneFormatted, setPhoneFormatted] = useState('');
  const { loading } = useAuth();
  const { t } = useLanguage();

  // Auto-format phone number as user types
  useEffect(() => {
    const formatted = formatPhoneNumber(form.phone, form.countryCode);
    setPhoneFormatted(formatted);
  }, [form.phone, form.countryCode]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (field === 'phone') {
      // Only allow numeric input for phone
      const cleaned = value.replace(/\D/g, '');
      setForm({ ...form, [field]: cleaned });
    } else if (field === 'email') {
      setForm({ ...form, [field]: value });
      // Real-time email validation
      const validation = validateEmailSmart(value);
      setEmailValidation(validation);
    } else {
      setForm({ ...form, [field]: value });
    }
    
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  // Trigger shake animation for error fields
  const triggerShakeError = (fieldName: string) => {
    setShakeErrors(prev => ({ ...prev, [fieldName]: true }));
    
    // Reset shake after animation completes
    setTimeout(() => {
      setShakeErrors(prev => ({ ...prev, [fieldName]: false }));
    }, 600);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Name validation
    if (!form.name.trim()) {
      newErrors.name = t('auth:signup.validation.nameRequired');
    }
    
    // Enhanced email validation
    if (!form.email) {
      newErrors.email = t('auth:signup.validation.emailRequired');
    } else {
      const emailCheck = validateEmailSmart(form.email);
      if (!emailCheck.isValid) {
        newErrors.email = emailCheck.message || t('auth:signup.validation.emailInvalid');
      }
    }
    
    // Enhanced password validation (minimum 8 characters + complexity)
    if (!form.password) {
      newErrors.password = t('auth:signup.validation.passwordRequired');
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else {
      // Check password complexity
      const hasUpper = /[A-Z]/.test(form.password);
      const hasLower = /[a-z]/.test(form.password);
      const hasNumber = /\d/.test(form.password);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(form.password);
      
      if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
        newErrors.password = 'Password must include uppercase, lowercase, number, and special character';
      }
    }
    
    // Confirm password validation
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Smart phone validation
    if (!form.phone) {
      newErrors.phone = t('auth:signup.validation.phoneRequired');
    } else {
      const phoneCheck = validatePhoneNumber(form.phone, form.countryCode);
      if (!phoneCheck.isValid) {
        newErrors.phone = phoneCheck.message || t('auth:signup.validation.phoneInvalid');
      }
    }
    
    // Terms agreement
    if (!agreed) {
      newErrors.terms = t('auth:signup.validation.termsRequired');
    }
    
    setErrors(newErrors);
    
    // Trigger shake animations for fields with errors
    Object.keys(newErrors).forEach(fieldName => {
      triggerShakeError(fieldName);
    });
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    try {
      // Stage 1: Validating form data
      setLoadingState({
        isLoading: true,
        message: 'Validating your information...',
        stage: 'validating'
      });
      
      await new Promise(resolve => setTimeout(resolve, 800)); // Brief validation delay
      
      // Stage 2: Creating account
      setLoadingState({
        isLoading: true,
        message: 'Creating your VonVault account...',
        stage: 'creating'
      });
      
      // Extract confirmPassword and countryCode, then add country_code
      const { confirmPassword, countryCode, ...signupData } = form;
      
      const user = await signup({
        ...signupData,
        phone: cleanPhoneNumber(form.phone), // Clean phone number for API
        country_code: countryCode  // Convert camelCase to snake_case for API
      });
      
      // Stage 3: Setting up security
      setLoadingState({
        isLoading: true,
        message: 'Setting up security features...',
        stage: 'securing'
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Security setup delay
      
      // Stage 4: Finalizing
      setLoadingState({
        isLoading: true,
        message: 'Finalizing your account setup...',
        stage: 'finalizing'
      });
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Final delay
      
      // Reset loading state
      setLoadingState({
        isLoading: false,
        message: '',
        stage: 'idle'
      });
      
      if (user && onContinue) {
        onContinue(user);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Reset loading state on error
      setLoadingState({
        isLoading: false,
        message: '',
        stage: 'idle'
      });
      
      // Show error to user
      setErrors({ 
        submit: error.message || 'Failed to create account. Please try again.' 
      });
    }
  };

  // Calculate form completion progress based on verification status
  const calculateProgress = () => {
    let completedSteps = 0;
    const totalSteps = 5; // Form fields + Email + Phone + 2FA + Terms
    
    // Step 1: Basic form completion (name, email, password, confirm, phone)
    const hasValidName = form.name.trim().length >= 6 && form.name.includes(' ') && !errors.name;
    const hasValidEmail = form.email && emailValidation.isValid && !errors.email;
    const hasValidPassword = form.password && form.password.length >= 8 && !errors.password;
    const hasValidConfirmPassword = form.confirmPassword && form.password === form.confirmPassword && !errors.confirmPassword;
    const hasValidPhone = form.phone && validatePhoneNumber(form.phone) && !errors.phone;
    
    if (hasValidName && hasValidEmail && hasValidPassword && hasValidConfirmPassword && hasValidPhone) {
      completedSteps++; // Form complete = 20%
    }
    
    // Step 2: Email verified (20%)
    if (user?.email_verified) {
      completedSteps++;
    }
    
    // Step 3: Phone verified (20%) 
    if (user?.phone_verified) {
      completedSteps++;
    }
    
    // Step 4: 2FA enabled (20%)
    if (user?.biometric_2fa_enabled || user?.push_2fa_enabled) {
      completedSteps++;
    }
    
    // Step 5: Terms agreed (20%)
    if (agreed) {
      completedSteps++;
    }
    
    return Math.round((completedSteps / totalSteps) * 100);
  };

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-black dark:bg-black bg-white light:bg-white text-black dark:text-white px-6 pt-12 pb-8 flex flex-col transition-colors duration-300">
      {/* Header with Language Selector and Theme Toggle */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <ThemeToggle variant="minimal" showLabel={false} />
        <LanguageSelector variant="compact" />
      </div>
      
      <ScreenHeader title={t('auth:signup.title')} onBack={onGoToLogin} />

      {/* Form Progress Indicator */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400 dark:text-gray-400 text-gray-600">Form Progress</span>
          <span className="text-sm font-medium text-black dark:text-white">{progress}%</span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden transition-colors duration-300">
          <motion.div
            className={`h-full rounded-full transition-all duration-500 ${
              progress < 40 ? 'bg-red-500' : 
              progress < 80 ? 'bg-yellow-500' : 
              'bg-green-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ 
              type: "spring", 
              stiffness: 100, 
              damping: 20 
            }}
          />
        </div>
        
        {/* Progress milestones */}
        <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-500 light:text-gray-400">
          <span className={progress >= 20 ? 'text-green-400 dark:text-green-400 light:text-green-600' : ''}>Form</span>
          <span className={progress >= 40 ? 'text-green-400 dark:text-green-400 light:text-green-600' : ''}>Email ✓</span>
          <span className={progress >= 60 ? 'text-green-400 dark:text-green-400 light:text-green-600' : ''}>Phone ✓</span>
          <span className={progress >= 80 ? 'text-green-400 dark:text-green-400 light:text-green-600' : ''}>2FA ✓</span>
          <span className={progress >= 100 ? 'text-green-400 dark:text-green-400 light:text-green-600' : ''}>Complete</span>
        </div>
        
        {/* Completion message */}
        {progress === 100 && (
          <AnimatePresence>
            <motion.div
              className="mt-3 p-3 bg-green-900/20 dark:bg-green-900/20 light:bg-green-100 border border-green-500/30 dark:border-green-500/30 light:border-green-300 rounded-lg transition-colors duration-300"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 20 
              }}
            >
              <div className="flex items-center space-x-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 500, 
                    delay: 0.1 
                  }}
                >
                  <span className="text-green-400 dark:text-green-400 light:text-green-600 text-lg">🔒</span>
                </motion.div>
                <span className="text-green-400 dark:text-green-400 light:text-green-700 text-sm font-medium">
                  Excellent! Your account is fully verified and secure.
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
        
        {/* Next steps hint when form is complete but verification pending */}
        {progress >= 20 && progress < 100 && (
          <div className="mt-2 text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">
            {progress < 40 && "Next: Verify your email address"}
            {progress >= 40 && progress < 60 && "Next: Verify your phone number"}
            {progress >= 60 && progress < 80 && "Next: Enable 2FA for security"}
            {progress >= 80 && progress < 100 && "Next: Accept terms and conditions"}
          </div>
        )}
      </motion.div>

      <div className="space-y-5">
        {/* Name Field with Shake Animation */}
        <motion.div
          animate={shakeErrors.name ? { x: [0, -10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <Input
            ref={nameRef}
            label={t('auth:signup.nameLabel')}
            value={form.name}
            onChange={handleChange('name')}
            placeholder={t('auth:signup.namePlaceholder')}
            required
            error={errors.name}
            autoComplete="given-name"
          />
        </motion.div>
        
        {/* Enhanced Email Input with Smart Validation and Shake Animation */}
        <motion.div
          animate={shakeErrors.email ? { x: [0, -10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <EmailInput
            ref={emailRef}
            label={t('auth:signup.emailLabel')}
            value={form.email}
            onChange={handleChange('email')}
            placeholder={t('auth:signup.emailPlaceholder')}
            required
            error={errors.email}
            className="flex-1"
          />
          
          {/* Email Suggestion */}
          {emailValidation.type === 'suggestion' && emailValidation.suggestion && (
            <div className="mt-2 bg-blue-900/20 rounded-lg p-2">
              <p className="text-sm text-blue-300">
                💡 {emailValidation.message}
              </p>
              <button
                type="button"
                onClick={() => {
                  setForm({ ...form, email: emailValidation.suggestion! });
                  setEmailValidation({ isValid: true, type: 'valid' });
                }}
                className="text-blue-400 hover:text-blue-300 text-sm underline mt-1"
              >
                Use {emailValidation.suggestion}
              </button>
            </div>
          )}
          
          {/* Email Warning */}
          {emailValidation.type === 'warning' && (
            <div className="mt-2 bg-yellow-900/20 rounded-lg p-2">
              <p className="text-sm text-yellow-300">
                ⚠️ {emailValidation.message}
              </p>
            </div>
          )}
        </motion.div>
        
        {/* Enhanced Password Input with Strength Indicator and Shake Animation */}
        <motion.div
          animate={shakeErrors.password ? { x: [0, -10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <PasswordInput
            ref={passwordRef}
            label={t('auth:signup.passwordLabel')}
            value={form.password}
            onChange={handleChange('password')}
            placeholder={t('auth:signup.passwordPlaceholder')}
            required
            error={errors.password}
            showPassword={showPassword}
            onToggleVisibility={() => setShowPassword(!showPassword)}
          />
          
          {/* Password Strength Indicator */}
          <PasswordStrength password={form.password} />
        </motion.div>
        
        {/* Confirm Password Input with Shake Animation */}
        <motion.div
          animate={shakeErrors.confirmPassword ? { x: [0, -10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <PasswordInput
            ref={confirmPasswordRef}
            label="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange('confirmPassword')}
            placeholder="Re-enter your password"
            required
            error={errors.confirmPassword}
            showPassword={showConfirmPassword}
            onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
            preventCopyPaste={true}
          />
          
          {/* Password Match Indicator */}
          {form.confirmPassword && form.password && form.password === form.confirmPassword && !errors.confirmPassword && (
            <AnimatePresence>
              <motion.div 
                className="mt-2 flex items-center space-x-2"
                initial={{ opacity: 0, y: -10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.8 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 20,
                  duration: 0.4 
                }}
              >
                <motion.span 
                  className="text-green-400 text-sm"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 500, 
                    damping: 15,
                    delay: 0.1 
                  }}
                >
                  ✓
                </motion.span>
                <span className="text-green-400 text-sm font-medium">Passwords match</span>
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>
        
        {/* Enhanced Phone Input with Auto-formatting and Shake Animation */}
        <motion.div 
          className="space-y-1"
          animate={shakeErrors.phone ? { x: [0, -10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <label className="block text-sm font-medium text-white">
            {t('auth:signup.phoneLabel')} <span className="text-red-400 ml-1">*</span>
          </label>
          <div className="flex gap-2 relative">
            <select
              value={form.countryCode}
              onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
              className={`p-3 bg-gray-900 border rounded-lg text-white focus:border-purple-400 focus:outline-none w-48 transition-all duration-200 ${
                countryDetection.detected && countryDetection.method === 'ip'
                  ? 'border-green-500 shadow-sm shadow-green-500/20'
                  : 'border-purple-500'
              }`}
            >
              <option value="+54">🇦🇷 Argentina (+54)</option>
              <option value="+43">🇦🇹 Austria (+43)</option>
              <option value="+61">🇦🇺 Australia (+61)</option>
              <option value="+32">🇧🇪 Belgium (+32)</option>
              <option value="+55">🇧🇷 Brazil (+55)</option>
              <option value="+1">🇨🇦 Canada (+1)</option>
              <option value="+56">🇨🇱 Chile (+56)</option>
              <option value="+86">🇨🇳 China (+86)</option>
              <option value="+57">🇨🇴 Colombia (+57)</option>
              <option value="+420">🇨🇿 Czech Republic (+420)</option>
              <option value="+45">🇩🇰 Denmark (+45)</option>
              <option value="+20">🇪🇬 Egypt (+20)</option>
              <option value="+358">🇫🇮 Finland (+358)</option>
              <option value="+33">🇫🇷 France (+33)</option>
              <option value="+49">🇩🇪 Germany (+49)</option>
              <option value="+30">🇬🇷 Greece (+30)</option>
              <option value="+852">🇭🇰 Hong Kong (+852)</option>
              <option value="+36">🇭🇺 Hungary (+36)</option>
              <option value="+91">🇮🇳 India (+91)</option>
              <option value="+62">🇮🇩 Indonesia (+62)</option>
              <option value="+353">🇮🇪 Ireland (+353)</option>
              <option value="+39">🇮🇹 Italy (+39)</option>
              <option value="+81">🇯🇵 Japan (+81)</option>
              <option value="+60">🇲🇾 Malaysia (+60)</option>
              <option value="+52">🇲🇽 Mexico (+52)</option>
              <option value="+31">🇳🇱 Netherlands (+31)</option>
              <option value="+64">🇳🇿 New Zealand (+64)</option>
              <option value="+234">🇳🇬 Nigeria (+234)</option>
              <option value="+47">🇳🇴 Norway (+47)</option>
              <option value="+51">🇵🇪 Peru (+51)</option>
              <option value="+63">🇵🇭 Philippines (+63)</option>
              <option value="+48">🇵🇱 Poland (+48)</option>
              <option value="+351">🇵🇹 Portugal (+351)</option>
              <option value="+40">🇷🇴 Romania (+40)</option>
              <option value="+7">🇷🇺 Russia (+7)</option>
              <option value="+966">🇸🇦 Saudi Arabia (+966)</option>
              <option value="+65">🇸🇬 Singapore (+65)</option>
              <option value="+27">🇿🇦 South Africa (+27)</option>
              <option value="+82">🇰🇷 South Korea (+82)</option>
              <option value="+34">🇪🇸 Spain (+34)</option>
              <option value="+46">🇸🇪 Sweden (+46)</option>
              <option value="+41">🇨🇭 Switzerland (+41)</option>
              <option value="+886">🇹🇼 Taiwan (+886)</option>
              <option value="+66">🇹🇭 Thailand (+66)</option>
              <option value="+90">🇹🇷 Turkey (+90)</option>
              <option value="+380">🇺🇦 Ukraine (+380)</option>
              <option value="+971">🇦🇪 UAE (+971)</option>
              <option value="+44">🇬🇧 United Kingdom (+44)</option>
              <option value="+1">🇺🇸 United States (+1)</option>
              <option value="+84">🇻🇳 Vietnam (+84)</option>
            </select>
            
            {/* Smart Country Detection Indicator */}
            <div className="absolute top-full left-0 mt-1 z-10">
              {countryDetection.isDetecting ? (
                <motion.div
                  className="flex items-center space-x-2 text-xs text-blue-400"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                  <span>Detecting your location...</span>
                </motion.div>
              ) : countryDetection.detected && (
                <AnimatePresence>
                  <motion.div
                    className="flex items-center space-x-2 text-xs text-green-400"
                    initial={{ opacity: 0, y: -5, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.9 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 20 
                    }}
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 500, 
                        delay: 0.1 
                      }}
                    >
                      {countryDetection.method === 'ip' ? '🌍' : '🌐'}
                    </motion.span>
                    <span>
                      {countryDetection.method === 'ip' 
                        ? `Auto-detected: ${countryDetection.countryName}`
                        : `Detected from browser: ${countryDetection.countryName}`
                      }
                    </span>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
            
            {/* Phone input with auto-formatting */}
            <div className="flex-1">
              <Input
                ref={phoneRef}
                type="tel"
                inputMode="tel"
                value={phoneFormatted}
                onChange={handleChange('phone')}
                placeholder={t('auth:signup.phonePlaceholder')}
                required
                error={errors.phone}
                className="flex-1"
                autoComplete="tel"
              />
              {/* Show cleaned number count */}
              {form.phone && (
                <p className="text-xs text-gray-400 mt-1">
                  {form.phone.length} digits entered
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Terms Agreement with Shake Animation */}
        <motion.div 
          className="flex items-start"
          animate={shakeErrors.terms ? { x: [0, -10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 mr-2 accent-purple-600"
          />
          <p className="text-sm text-gray-400">
            {t('auth:signup.termsPrefix')}{' '}
            <span 
              className="text-purple-400 cursor-pointer hover:text-purple-300 transition-colors underline"
              onClick={() => onNavigate?.('terms-of-service')}
            >
              {t('auth:signup.termsOfService')}
            </span>{' '}
            {t('auth:signup.and')}{' '}
            <span 
              className="text-purple-400 cursor-pointer hover:text-purple-300 transition-colors underline"
              onClick={() => onNavigate?.('privacy-policy')}
            >
              {t('auth:signup.privacyPolicy')}
            </span>
          </p>
        </motion.div>
        {errors.terms && (
          <motion.p 
            className="text-red-400 text-sm"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {errors.terms}
          </motion.p>
        )}
      </div>

      <div className="mt-8">
        <Button
          onClick={handleSignUp}
          loading={loadingState.isLoading}
          fullWidth
          size="lg"
          disabled={loadingState.isLoading}
        >
          {loadingState.isLoading ? loadingState.message : t('auth:signup.createAccountButton')}
        </Button>
        
        {/* Smart Loading Overlay */}
        {loadingState.isLoading && (
          <AnimatePresence>
            <motion.div
              className="mt-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center space-x-3">
                {/* Animated loading indicator */}
                <motion.div
                  className="flex space-x-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-purple-400 rounded-full"
                      animate={{
                        y: [0, -8, 0],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </motion.div>
                
                {/* Stage-specific messages */}
                <div className="flex-1">
                  <motion.p
                    className="text-purple-300 text-sm font-medium"
                    key={loadingState.message}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {loadingState.message}
                  </motion.p>
                  
                  {/* Stage progress indicators */}
                  <div className="flex items-center space-x-2 mt-2">
                    {['validating', 'creating', 'securing', 'finalizing'].map((stage, index) => (
                      <motion.div
                        key={stage}
                        className={`w-2 h-2 rounded-full ${
                          loadingState.stage === stage 
                            ? 'bg-purple-400' 
                            : index < ['validating', 'creating', 'securing', 'finalizing'].indexOf(loadingState.stage)
                              ? 'bg-green-400'
                              : 'bg-gray-600'
                        }`}
                        animate={{
                          scale: loadingState.stage === stage ? [1, 1.3, 1] : 1
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: loadingState.stage === stage ? Infinity : 0
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Stage icon */}
                <motion.div
                  key={loadingState.stage}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 20 
                  }}
                  className="text-lg"
                >
                  {loadingState.stage === 'validating' && '🔍'}
                  {loadingState.stage === 'creating' && '⚙️'}
                  {loadingState.stage === 'securing' && '🔐'}
                  {loadingState.stage === 'finalizing' && '✨'}
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
        
        {/* Display signup error with Shake Animation */}
        {errors.submit && (
          <motion.div 
            className="mt-3 bg-red-900/20 rounded-lg p-3"
            initial={{ opacity: 0, scale: 0.9, x: -10 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              x: shakeErrors.submit ? [0, -10, 10, -10, 10, 0] : 0 
            }}
            transition={{ 
              duration: shakeErrors.submit ? 0.5 : 0.3,
              ease: "easeInOut" 
            }}
          >
            <p className="text-red-400 text-sm text-center">
              {errors.submit}
            </p>
          </motion.div>
        )}
        
        <p className="text-center text-sm text-white mt-4">
          {t('auth:signup.haveAccountPrefix')}{' '}
          <span 
            className="text-purple-400 font-medium cursor-pointer hover:text-purple-300 transition-colors" 
            onClick={onGoToLogin}
          >
            {t('auth:signup.signInLink')}
          </span>
        </p>
      </div>
    </div>
  );
};