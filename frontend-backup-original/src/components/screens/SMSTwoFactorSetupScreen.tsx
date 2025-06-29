import React, { useState, useEffect } from 'react';
import type { ScreenProps } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { MobileLayout } from '../layout/MobileLayout';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  loading?: boolean;
  error?: boolean;
}

const OTPInput: React.FC<OTPInputProps> = ({ length = 6, onComplete, loading, error }) => {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
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
          disabled={loading}
          className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-lg bg-gray-800 text-white
            ${error 
              ? 'border-red-500 bg-red-900/20' 
              : digit 
                ? 'border-green-500 bg-green-900/20' 
                : 'border-gray-600'
            }
            focus:border-green-500 focus:outline-none transition-colors
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
      ))}
    </div>
  );
};

export const SMSTwoFactorSetupScreen: React.FC<ScreenProps> = ({ onBack, onNavigate }) => {
  const [step, setStep] = useState<'confirm' | 'verify' | 'complete'>('confirm');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { user } = useApp();

  // Get phone number from user context (already verified)
  useEffect(() => {
    if (user?.phone) {
      setPhoneNumber(user.phone);
    }
  }, [user]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const enableSMS2FA = async () => {
    setLoading(true);
    setError('');

    try {
      // Send SMS verification code
      const result = await apiService.sendSMS2FA(phoneNumber);
      
      if (result.success) {
        setStep('verify');
        setCountdown(60); // 60 second cooldown
      } else {
        throw new Error(result.message || 'Failed to send SMS code');
      }
      
    } catch (error) {
      console.error('SMS 2FA setup error:', error);
      setError('Failed to enable SMS 2FA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendTestCode = async () => {
    setLoading(true);
    setError('');

    try {
      // Send new SMS verification code
      const result = await apiService.sendSMS2FA(phoneNumber);
      
      if (result.success) {
        setCountdown(60); // 60 second cooldown
      } else {
        throw new Error(result.message || 'Failed to send SMS code');
      }
      
    } catch (error) {
      console.error('SMS sending error:', error);
      setError('Failed to send SMS code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (otp: string) => {
    setVerifying(true);
    setOtpError(false);
    setError('');

    try {
      // Verify SMS code with backend
      const result = await apiService.verifySMS2FA(phoneNumber, otp);
      
      if (result.success && result.verified) {
        // Code verified, now complete the 2FA setup
        const setupResult = await apiService.setupSMS2FA(phoneNumber);
        
        if (setupResult.success) {
          setStep('complete');
        } else {
          throw new Error(setupResult.message || 'Failed to setup SMS 2FA');
        }
      } else {
        throw new Error(result.message || 'Invalid verification code');
      }
      
    } catch (error) {
      console.error('OTP verification error:', error);
      setOtpError(true);
      setError('Invalid verification code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleComplete = () => {
    // Navigate to verification success or next step
    onNavigate?.('verification-success');
  };

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display (e.g., +1 (555) 123-4567)
    if (phone.startsWith('+1') && phone.length === 12) {
      return `${phone.slice(0, 2)} (${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8)}`;
    }
    return phone;
  };

  return (
    <MobileLayout>
      <ScreenHeader title="Setup SMS 2FA" onBack={onBack} />

      {step === 'confirm' && (
        <>
          <Card className="mb-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              
              <h2 className="text-xl font-bold text-white mb-2">Enable SMS 2FA</h2>
              <p className="text-gray-400 text-sm">
                We'll send 6-digit codes to your verified phone number for secure login and transactions
              </p>
            </div>

            {/* Phone Number Display */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Phone Number</p>
                  <p className="text-white font-semibold">{formatPhoneNumber(phoneNumber)}</p>
                  <p className="text-xs text-green-400">✓ Already verified</p>
                </div>
                <div className="text-green-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </Card>

          {/* Benefits */}
          <Card className="mb-6 bg-gray-900/50 border-gray-700">
            <h4 className="font-semibold mb-3 text-white flex items-center gap-2">
              <span>📱</span>
              SMS 2FA Benefits
            </h4>
            <div className="text-sm text-gray-300 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Works on any phone with SMS capability</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>No additional apps required</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Instant delivery worldwide</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Backup codes available for emergencies</span>
              </div>
            </div>
          </Card>

          {/* Security Notice */}
          <Card className="mb-6 border-yellow-500/30 bg-yellow-900/20">
            <div className="flex items-start gap-3">
              <div className="text-yellow-400 text-xl">🔒</div>
              <div>
                <h4 className="text-yellow-400 font-semibold mb-2">Security Note</h4>
                <p className="text-sm text-yellow-200">
                  SMS 2FA provides good security for most users. For maximum security with large investments, 
                  consider using an authenticator app as your primary or backup method.
                </p>
              </div>
            </div>
          </Card>

          <Button
            onClick={enableSMS2FA}
            disabled={loading}
            fullWidth
            size="lg"
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Enabling SMS 2FA...' : 'Enable SMS 2FA'}
          </Button>
        </>
      )}

      {step === 'verify' && (
        <>
          <Card className="mb-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <h2 className="text-xl font-bold text-white mb-2">Verify SMS 2FA</h2>
              <p className="text-gray-400 text-sm mb-2">
                Enter the 6-digit code we sent to your phone
              </p>
              <p className="text-white font-medium">{formatPhoneNumber(phoneNumber)}</p>
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
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 text-green-400">
                  <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                  Verifying code...
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <div className="text-center">
              <Button
                onClick={sendTestCode}
                variant="secondary"
                size="sm"
                disabled={countdown > 0 || loading}
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </Button>
            </div>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700">
            <h4 className="font-semibold mb-2 text-white">💡 Tips:</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Codes expire after 5 minutes</li>
              <li>• Check your spam/junk folder if needed</li>
              <li>• Make sure you have cellular signal</li>
              <li>• International SMS may take longer to arrive</li>
            </ul>
          </Card>
        </>
      )}

      {step === 'complete' && (
        <>
          <Card className="mb-6 border-green-500/30 bg-green-900/20">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-xl font-bold text-white mb-2">SMS 2FA Setup Complete!</h2>
              <p className="text-gray-300 text-sm">
                Your phone number is now your 2FA method for secure access
              </p>
            </div>
          </Card>

          <Card className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <span>📱</span>
              Your SMS 2FA Settings
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-gray-800 rounded-lg p-3">
                <div>
                  <p className="text-white font-medium">Phone Number</p>
                  <p className="text-sm text-gray-400">{formatPhoneNumber(phoneNumber)}</p>
                </div>
                <span className="text-green-400 font-semibold">Active</span>
              </div>
              
              <div className="flex justify-between items-center bg-gray-800 rounded-lg p-3">
                <div>
                  <p className="text-white font-medium">2FA Method</p>
                  <p className="text-sm text-gray-400">SMS Text Messages</p>
                </div>
                <span className="text-green-400">✓</span>
              </div>
            </div>
          </Card>

          <Card className="mb-6 bg-blue-900/20 border-blue-500/30">
            <h4 className="font-semibold mb-3 text-white flex items-center gap-2">
              <span>🔐</span>
              What Happens Next
            </h4>
            <div className="text-sm text-blue-200 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>You'll receive SMS codes when logging in</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Codes required for all investments and withdrawals</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>You can add a backup method in security settings</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Contact support if you lose access to your phone</span>
              </div>
            </div>
          </Card>

          <Button
            onClick={handleComplete}
            fullWidth
            size="lg"
            className="bg-green-600 hover:bg-green-700"
          >
            Complete 2FA Setup
          </Button>
        </>
      )}
    </MobileLayout>
  );
};