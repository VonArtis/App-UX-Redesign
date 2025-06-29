import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import type { ScreenProps } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
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
                ? 'border-purple-500 bg-purple-900/20' 
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

export const AuthenticatorSetupScreen: React.FC<ScreenProps> = ({ onBack, onNavigate }) => {
  const [step, setStep] = useState<'qr' | 'verify' | 'recovery'>('qr');
  const [qrData, setQrData] = useState<{
    qr_code: string;
    secret: string;
    provisioning_uri: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [codesCopied, setCodesCopied] = useState(false);
  const { user } = useApp();

  useEffect(() => {
    generateQRCode();
  }, []);

  const generateQRCode = async () => {
    setLoading(true);
    setError('');

    try {
      // Setup TOTP 2FA with backend
      const result = await apiService.setupTOTP2FA();
      
      if (result.success) {
        setQrData({
          qr_code: result.qr_code,
          secret: result.secret,
          provisioning_uri: result.provisioning_uri || ""
        });
        
        // Store the secret for verification
        // The backup codes will be provided after verification
      } else {
        throw new Error(result.message || 'Failed to setup TOTP 2FA');
      }
      
    } catch (error) {
      console.error('Error generating QR code:', error);
      
      // More specific error handling
      if (error.response) {
        console.error('API Error Response:', error.response.data);
        console.error('API Error Status:', error.response.status);
        
        if (error.response.status === 401) {
          setError('Authentication required. Please log in first.');
        } else if (error.response.status === 422) {
          setError('Invalid request. Please check your authentication.');
        } else {
          setError(`API Error: ${error.response.data?.detail || 'Failed to generate QR code'}`);
        }
      } else if (error.request) {
        console.error('Network Error:', error.request);
        setError('Network error. Please check your connection.');
      } else {
        console.error('Error:', error.message);
        setError('Failed to generate QR code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (otp: string) => {
    setVerifying(true);
    setOtpError(false);
    setError('');

    try {
      // Verify TOTP code with backend
      const result = await apiService.verifyTOTP2FA(otp);
      
      if (result.success && result.verified) {
        // TOTP verified successfully, get backup codes
        if (result.backup_codes) {
          setRecoveryCodes(result.backup_codes);
        }
        setStep('recovery');
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

  const copySecret = async () => {
    if (qrData?.secret) {
      try {
        await navigator.clipboard.writeText(qrData.secret);
        alert('Secret key copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy secret:', error);
      }
    }
  };

  const copyRecoveryCodes = async () => {
    try {
      const codesText = recoveryCodes.join('\n');
      await navigator.clipboard.writeText(codesText);
      setCodesCopied(true);
      setTimeout(() => setCodesCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy recovery codes:', error);
    }
  };

  const handleComplete = () => {
    // Navigate to verification success or next step
    onNavigate?.('verification-success');
  };

  const supportedApps = [
    { name: 'Google Authenticator', icon: '📱' },
    { name: 'Microsoft Authenticator', icon: '🔐' },
    { name: 'Authy', icon: '🛡️' },
    { name: '1Password', icon: '🔑' },
  ];

  return (
    <MobileLayout>
      <ScreenHeader title="Setup Authenticator" onBack={onBack} />

      {step === 'qr' && (
        <>
          {/* Instructions */}
          <Card className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-white">Scan QR Code with Your Authenticator App</h3>
            
            {/* Supported Apps */}
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-3">Supported authenticator apps:</p>
              <div className="grid grid-cols-2 gap-2">
                {supportedApps.map((app, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                    <span>{app.icon}</span>
                    <span>{app.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* QR Code */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : qrData ? (
              <div className="text-center">
                <div className="bg-white p-4 rounded-xl inline-block mb-4">
                  <QRCode
                    size={180}
                    value={qrData.provisioning_uri}
                    level="M"
                  />
                </div>
                
                {/* Manual Entry Option */}
                <div className="bg-gray-800 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-400 mb-2">Can't scan? Enter this code manually:</p>
                  <div className="flex items-center justify-between bg-gray-700 rounded px-3 py-2">
                    <code className="text-sm text-white font-mono">{qrData.secret}</code>
                    <Button
                      onClick={copySecret}
                      size="sm"
                      variant="secondary"
                      className="ml-2"
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-red-400">Failed to generate QR code</p>
                <Button onClick={generateQRCode} className="mt-4">
                  Try Again
                </Button>
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mt-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </Card>

          {/* Setup Steps */}
          <Card className="mb-6 bg-gray-900/50 border-gray-700">
            <h4 className="font-semibold mb-3 text-white">Setup Steps:</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <span className="text-purple-400">1.</span>
                <span>Download an authenticator app if you don't have one</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-400">2.</span>
                <span>Open the app and tap "Add Account" or "+"</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-400">3.</span>
                <span>Scan the QR code above</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-400">4.</span>
                <span>Your app will start generating 6-digit codes</span>
              </div>
            </div>
          </Card>

          <Button
            onClick={() => setStep('verify')}
            disabled={!qrData || loading}
            fullWidth
            size="lg"
            className="bg-purple-600 hover:bg-purple-700"
          >
            I've Scanned the QR Code
          </Button>
        </>
      )}

      {step === 'verify' && (
        <>
          <Card className="mb-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <h2 className="text-xl font-bold text-white mb-2">Verify Your Authenticator</h2>
              <p className="text-gray-400 text-sm">
                Enter the 6-digit code from your authenticator app to complete setup
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
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 text-purple-400">
                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                  Verifying code...
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}
          </Card>

          <Card className="bg-gray-900/50 border-gray-700">
            <h4 className="font-semibold mb-2 text-white">💡 Tips:</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Codes change every 30 seconds</li>
              <li>• Make sure your device time is correct</li>
              <li>• The code should be 6 digits long</li>
              <li>• Try a new code if the current one doesn't work</li>
            </ul>
          </Card>
        </>
      )}

      {step === 'recovery' && (
        <>
          <Card className="mb-6 border-green-500/30 bg-green-900/20">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-xl font-bold text-white mb-2">Authenticator Setup Complete!</h2>
              <p className="text-gray-300 text-sm">
                Save these recovery codes in case you lose access to your authenticator app
              </p>
            </div>
          </Card>

          <Card className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <span>🔑</span>
              Recovery Codes
            </h3>
            
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                {recoveryCodes.map((code, index) => (
                  <div key={index} className="text-white bg-gray-700 rounded px-2 py-1 text-center">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={copyRecoveryCodes}
              variant="secondary"
              fullWidth
              className="mb-4"
            >
              {codesCopied ? '✓ Copied!' : '📋 Copy All Codes'}
            </Button>

            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-yellow-400 text-lg">⚠️</span>
                <div className="text-sm">
                  <p className="text-yellow-400 font-medium">Important:</p>
                  <ul className="text-yellow-200 mt-1 space-y-1">
                    <li>• Save these codes in a secure location</li>
                    <li>• Each code can only be used once</li>
                    <li>• Use them if you lose your authenticator app</li>
                    <li>• Keep them separate from your device</li>
                  </ul>
                </div>
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