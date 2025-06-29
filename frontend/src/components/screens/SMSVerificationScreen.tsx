import React, { useState, useRef, useEffect } from 'react';
import type { ScreenProps } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { MobileLayout } from '../layout/MobileLayout';
import { useApp } from '../../context/AppContext';

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  loading?: boolean;
  error?: boolean;
}

const OTPInput: React.FC<OTPInputProps> = ({ length = 6, onComplete, loading, error }) => {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Complete OTP when all fields are filled
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === length) {
      onComplete(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length && i < length; i++) {
      if (/\d/.test(pastedData[i])) {
        newOtp[i] = pastedData[i];
      }
    }
    
    setOtp(newOtp);
    if (newOtp.every(digit => digit !== '')) {
      onComplete(newOtp.join(''));
    }
  };

  // Clear OTP when error occurs
  useEffect(() => {
    if (error) {
      setOtp(new Array(length).fill(''));
      inputRefs.current[0]?.focus();
    }
  }, [error, length]);

  return (
    <div className="flex justify-center gap-2 mb-6">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={el => inputRefs.current[index] = el}
          type="tel"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={loading}
          className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-lg bg-gray-800 text-white
            ${error 
              ? 'border-red-500 bg-red-900/20' 
              : digit 
                ? 'border-green-500 bg-green-900/20' 
                : 'border-gray-600'
            }
            focus:border-purple-500 focus:outline-none transition-colors
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
      ))}
    </div>
  );
};

export const SMSVerificationScreen: React.FC<ScreenProps> = ({ onBack, onNavigate }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const { user } = useApp();

  // Pre-fill phone if user already has one
  useEffect(() => {
    if (user?.phone && !phoneNumber) {
      // Parse existing phone number with proper country code detection
      const phone = user.phone;
      if (phone.startsWith('+')) {
        // List of valid country codes (longest first to match correctly)
        const countryCodes = [
          '+971', '+966', '+380', '+886', '+852', '+420', '+358', '+353', '+351', '+234',
          '+90', '+91', '+86', '+81', '+82', '+65', '+60', '+66', '+84', '+63', '+62',
          '+61', '+64', '+55', '+52', '+54', '+56', '+57', '+51', '+27', '+20',
          '+49', '+33', '+39', '+34', '+44', '+43', '+32', '+31', '+41', '+45',
          '+46', '+47', '+48', '+30', '+36', '+40', '+7', '+1'
        ];
        
        // Find the matching country code
        let matchedCode = '';
        for (const code of countryCodes) {
          if (phone.startsWith(code)) {
            matchedCode = code;
            break;
          }
        }
        
        if (matchedCode) {
          setCountryCode(matchedCode);
          setPhoneNumber(phone.substring(matchedCode.length));
        } else {
          // Fallback to original regex if no known country code matches
          const match = phone.match(/^(\+\d{1,3})(.+)$/);
          if (match) {
            setCountryCode(match[1]);
            setPhoneNumber(match[2]);
          }
        }
      } else {
        setPhoneNumber(phone);
      }
    }
  }, [user, phoneNumber]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendSMSCode = async () => {
    if (!phoneNumber || phoneNumber.length < 7) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const fullPhone = `${countryCode}${phoneNumber}`;
      
      // Call real SMS verification API
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token && { 'Authorization': `Bearer ${user.token}` })
        },
        body: JSON.stringify({ phone_number: fullPhone })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send SMS verification');
      }
      
      setCodeSent(true);
      setMessage(`6-digit verification code sent to ${fullPhone}`);
      setResendCount(resendCount + 1);
      setCountdown(60); // 60 second cooldown
      
    } catch (error: any) {
      console.error('SMS sending error:', error);
      setError(error.message || 'Failed to send SMS. Please check your phone number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (otp: string) => {
    setVerifying(true);
    setOtpError(false);
    setError('');

    try {
      const fullPhone = `${countryCode}${phoneNumber}`;
      
      // Call real SMS verification API
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/sms/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token && { 'Authorization': `Bearer ${user.token}` })
        },
        body: JSON.stringify({ 
          phone_number: fullPhone,
          code: otp 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Invalid verification code');
      }

      // Success - phone verified
      setMessage('Phone verified successfully!');
      
      // Navigate to 2FA setup
      setTimeout(() => {
        onNavigate?.('2fa-setup');
      }, 1500);
      
    } catch (error: any) {
      console.error('SMS verification error:', error);
      setError(error.message || 'Invalid verification code. Please try again.');
      setOtpError(true);
    } finally {
      setVerifying(false);
    }
  };

  const resendCode = async () => {
    setCodeSent(false);
    await sendSMSCode();
  };

  // Comprehensive global country codes
  const countryCodes = [
    // North America
    { code: '+1', country: 'United States', flag: '🇺🇸' },
    { code: '+1', country: 'Canada', flag: '🇨🇦' },
    
    // Europe
    { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+39', country: 'Italy', flag: '🇮🇹' },
    { code: '+34', country: 'Spain', flag: '🇪🇸' },
    { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
    { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
    { code: '+43', country: 'Austria', flag: '🇦🇹' },
    { code: '+32', country: 'Belgium', flag: '🇧🇪' },
    { code: '+45', country: 'Denmark', flag: '🇩🇰' },
    { code: '+46', country: 'Sweden', flag: '🇸🇪' },
    { code: '+47', country: 'Norway', flag: '🇳🇴' },
    { code: '+358', country: 'Finland', flag: '🇫🇮' },
    { code: '+48', country: 'Poland', flag: '🇵🇱' },
    { code: '+420', country: 'Czech Republic', flag: '🇨🇿' },
    { code: '+36', country: 'Hungary', flag: '🇭🇺' },
    { code: '+351', country: 'Portugal', flag: '🇵🇹' },
    { code: '+30', country: 'Greece', flag: '🇬🇷' },
    { code: '+7', country: 'Russia', flag: '🇷🇺' },
    { code: '+380', country: 'Ukraine', flag: '🇺🇦' },
    
    // Asia-Pacific
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+82', country: 'South Korea', flag: '🇰🇷' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
    { code: '+852', country: 'Hong Kong', flag: '🇭🇰' },
    { code: '+886', country: 'Taiwan', flag: '🇹🇼' },
    { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
    { code: '+66', country: 'Thailand', flag: '🇹🇭' },
    { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
    { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
    { code: '+63', country: 'Philippines', flag: '🇵🇭' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
    { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
    { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
    { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
    
    // Middle East
    { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+974', country: 'Qatar', flag: '🇶🇦' },
    { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
    { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
    { code: '+968', country: 'Oman', flag: '🇴🇲' },
    { code: '+972', country: 'Israel', flag: '🇮🇱' },
    { code: '+90', country: 'Turkey', flag: '🇹🇷' },
    { code: '+98', country: 'Iran', flag: '🇮🇷' },
    { code: '+964', country: 'Iraq', flag: '🇮🇶' },
    { code: '+961', country: 'Lebanon', flag: '🇱🇧' },
    { code: '+962', country: 'Jordan', flag: '🇯🇴' },
    { code: '+20', country: 'Egypt', flag: '🇪🇬' },
    
    // Africa
    { code: '+27', country: 'South Africa', flag: '🇿🇦' },
    { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
    { code: '+254', country: 'Kenya', flag: '🇰🇪' },
    { code: '+233', country: 'Ghana', flag: '🇬🇭' },
    { code: '+212', country: 'Morocco', flag: '🇲🇦' },
    { code: '+213', country: 'Algeria', flag: '🇩🇿' },
    { code: '+216', country: 'Tunisia', flag: '🇹🇳' },
    { code: '+218', country: 'Libya', flag: '🇱🇾' },
    { code: '+251', country: 'Ethiopia', flag: '🇪🇹' },
    { code: '+256', country: 'Uganda', flag: '🇺🇬' },
    
    // Latin America
    { code: '+55', country: 'Brazil', flag: '🇧🇷' },
    { code: '+52', country: 'Mexico', flag: '🇲🇽' },
    { code: '+54', country: 'Argentina', flag: '🇦🇷' },
    { code: '+56', country: 'Chile', flag: '🇨🇱' },
    { code: '+57', country: 'Colombia', flag: '🇨🇴' },
    { code: '+51', country: 'Peru', flag: '🇵🇪' },
    { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
    { code: '+593', country: 'Ecuador', flag: '🇪🇨' },
    { code: '+595', country: 'Paraguay', flag: '🇵🇾' },
    { code: '+598', country: 'Uruguay', flag: '🇺🇾' },
    
    // Caribbean
    { code: '+1', country: 'Jamaica', flag: '🇯🇲' },
    { code: '+1', country: 'Trinidad and Tobago', flag: '🇹🇹' },
    { code: '+1', country: 'Barbados', flag: '🇧🇧' },
    
    // Central Asia
    { code: '+7', country: 'Kazakhstan', flag: '🇰🇿' },
    { code: '+996', country: 'Kyrgyzstan', flag: '🇰🇬' },
    { code: '+998', country: 'Uzbekistan', flag: '🇺🇿' },
    { code: '+992', country: 'Tajikistan', flag: '🇹🇯' },
    { code: '+993', country: 'Turkmenistan', flag: '🇹🇲' },
  ];

  return (
    <MobileLayout>
      <ScreenHeader title="Verify Phone" onBack={onBack} />

      <Card className="mb-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">SMS Verification</h2>
          <p className="text-gray-400 text-sm">
            {!codeSent 
              ? "We'll send a 6-digit code to your phone number for verification."
              : "Enter the 6-digit code we sent to your phone."
            }
          </p>
        </div>

        {!codeSent ? (
          <div className="space-y-4">
            {/* Country Code Selector */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Country Code</label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full p-3 border border-purple-500 bg-gray-800 text-white rounded-lg focus:border-purple-400 focus:outline-none"
                disabled={loading}
              >
                {countryCodes.map(({ code, country, flag }) => (
                  <option key={code} value={code}>
                    {flag} {code} ({country})
                  </option>
                ))}
              </select>
            </div>

            {/* Phone Number Input */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Phone Number</label>
              <div className="flex gap-2">
                <div className="flex items-center bg-gray-800 border border-gray-600 rounded-lg px-3 py-3 text-white font-medium">
                  {countryCode}
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="1234567890"
                  className="flex-1 p-3 border border-purple-500 bg-gray-800 text-white rounded-lg focus:border-purple-400 focus:outline-none"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter your phone number without the country code
              </p>
            </div>

            <Button
              onClick={sendSMSCode}
              loading={loading}
              disabled={!phoneNumber || loading}
              fullWidth
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </Button>

            {/* Skip SMS Button - Available Always */}
            <Button
              onClick={() => {
                console.log('SMS verification skipped from initial screen');
                onNavigate?.('2fa-setup');
              }}
              variant="secondary"
              fullWidth
              size="lg"
              className="mt-3"
            >
              Skip SMS Verification - Setup 2FA
            </Button>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-gray-400 text-sm mb-2">
                Code sent to: <span className="text-white font-medium">{countryCode}{phoneNumber}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-3 text-center">
                Enter 6-Digit Code
              </label>
              <OTPInput 
                length={6} 
                onComplete={verifyOTP} 
                loading={verifying}
                error={otpError}
              />
            </div>

            {verifying && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-blue-400">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  Verifying code...
                </div>
              </div>
            )}

            {message && !error && (
              <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3">
                <p className="text-green-400 text-sm text-center">{message}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <div className="text-center space-y-2">
              <Button
                onClick={resendCode}
                variant="secondary"
                size="sm"
                disabled={countdown > 0 || loading}
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </Button>
              
              {/* Skip Button */}
              <Button
                onClick={() => {
                  console.log('SMS verification skipped');
                  // TODO: Update user context to reflect phone as verified or skipped
                  onNavigate?.('2fa-setup');
                }}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Skip SMS Verification - Setup 2FA
              </Button>
              
              <div className="text-xs text-gray-500">
                Didn't receive the code? Check if your phone number is correct or try resending.
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Instructions */}
      <Card className="bg-gray-900/50 border-gray-700">
        <h4 className="font-semibold mb-2 text-white">📱 SMS Verification Tips</h4>
        <div className="bg-blue-900/20 rounded-lg p-3 mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-blue-400">ℹ️</span>
            <div>
              <p className="text-sm text-blue-300 font-medium">SMS Verification Optional During Setup</p>
              <p className="text-xs text-blue-400">You can verify your phone later. SMS verification will be required for withdrawals and secure transactions.</p>
            </div>
          </div>
        </div>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Make sure your phone has signal and can receive SMS</li>
          <li>• Codes expire after 5 minutes for security</li>
          <li>• You can resend the code if you don't receive it</li>
          <li>• International SMS may take a few minutes to arrive</li>
          <li>• Contact support if you continue having issues</li>
        </ul>
      </Card>
    </MobileLayout>
  );
};