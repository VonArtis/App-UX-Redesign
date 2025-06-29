import React, { useState } from 'react';
import type { ScreenProps } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';

export const Enhanced2FASetupScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const { user } = useApp();
  const [loading, setLoading] = useState(false);
  const [setupStep, setSetupStep] = useState<'choose' | 'biometric' | 'push' | 'complete'>('choose');
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [message, setMessage] = useState('');

  // Check for biometric support on component mount
  React.useEffect(() => {
    checkBiometricSupport();
    checkPushSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      if (window.PublicKeyCredential) {
        const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setBiometricSupported(available);
      }
    } catch (error) {
      console.log('Biometric check failed:', error);
      setBiometricSupported(false);
    }
  };

  const checkPushSupport = () => {
    // Check if notifications are supported
    setPushSupported('Notification' in window && 'serviceWorker' in navigator);
  };

  const setupBiometric2FA = async () => {
    if (!user?.token) return;
    
    setLoading(true);
    setSetupStep('biometric');
    
    try {
      // Begin registration
      const registrationOptions = await apiService.beginBiometricRegistration(
        user.token, 
        'User Device'
      );

      if (!registrationOptions.success) {
        throw new Error('Failed to begin biometric registration');
      }

      // Convert challenge and user ID from base64
      const challenge = Uint8Array.from(
        atob(registrationOptions.options.challenge.replace(/-/g, '+').replace(/_/g, '/')), 
        c => c.charCodeAt(0)
      );
      
      const userId = Uint8Array.from(
        atob(registrationOptions.options.user.id.replace(/-/g, '+').replace(/_/g, '/')), 
        c => c.charCodeAt(0)
      );

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: registrationOptions.options.rp,
          user: {
            ...registrationOptions.options.user,
            id: userId
          },
          pubKeyCredParams: registrationOptions.options.pubKeyCredParams,
          timeout: registrationOptions.options.timeout,
          excludeCredentials: registrationOptions.options.excludeCredentials,
          authenticatorSelection: registrationOptions.options.authenticatorSelection,
          attestation: registrationOptions.options.attestation
        }
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      // Complete registration
      const response = credential.response as AuthenticatorAttestationResponse;
      const credentialData = {
        credential_id: credential.id,
        public_key: btoa(String.fromCharCode(...new Uint8Array(response.getPublicKey()!))),
        sign_count: 0
      };

      const result = await apiService.completeBiometricRegistration(user.token, credentialData);
      
      if (result.success) {
        setMessage('🎉 Biometric authentication enabled successfully!');
        setSetupStep('complete');
      } else {
        throw new Error(result.message || 'Failed to complete biometric setup');
      }

    } catch (error: any) {
      console.error('Biometric setup error:', error);
      setMessage(`❌ Biometric setup failed: ${error.message}`);
      setSetupStep('choose');
    } finally {
      setLoading(false);
    }
  };

  const setupPush2FA = async () => {
    if (!user?.token) return;
    
    setLoading(true);
    setSetupStep('push');
    
    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // For demonstration, we'll use a mock push token
      // In production, you'd get this from Firebase or your push service
      const mockPushToken = `mock_token_${user.id}_${Date.now()}`;
      const deviceType = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'ios' : 
                        /Android/.test(navigator.userAgent) ? 'android' : 'web';

      const result = await apiService.registerPushNotifications(
        user.token, 
        mockPushToken, 
        deviceType, 
        'User Device'
      );
      
      if (result.success) {
        setMessage('🎉 Push notification 2FA enabled successfully!');
        setSetupStep('complete');
      } else {
        throw new Error(result.message || 'Failed to register for push notifications');
      }

    } catch (error: any) {
      console.error('Push setup error:', error);
      setMessage(`❌ Push notification setup failed: ${error.message}`);
      setSetupStep('choose');
    } finally {
      setLoading(false);
    }
  };

  const testPushNotification = async () => {
    if (!user?.token) return;
    
    setLoading(true);
    
    try {
      const result = await apiService.sendPushNotification(user.token);
      
      if (result.success) {
        // Show a local notification as demo
        new Notification('VonVault Security', {
          body: `Verification code: ${result.test_challenge_code}`,
          icon: '/favicon.ico'
        });
        
        setMessage(`📱 Push notification sent! Test code: ${result.test_challenge_code}`);
      }
    } catch (error: any) {
      setMessage(`❌ Failed to send push notification: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (setupStep === 'choose') {
    return (
      <div className="min-h-screen bg-black text-white">
        <ScreenHeader 
          title="Enhanced 2FA Setup"
          onBack={() => onNavigate('profile')}
        />
        
        <div className="p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-purple-400 mb-2">
              🛡️ Phase 2 Security
            </h2>
            <p className="text-gray-300">
              Choose your preferred advanced authentication method
            </p>
          </div>

          <div className="space-y-4">
            {/* Biometric Option */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    📱 Biometric Authentication
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    Use your device's fingerprint, Face ID, or other biometric authentication
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${biometricSupported ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-xs text-gray-400">
                      {biometricSupported ? 'Device supports biometrics' : 'Device does not support biometrics'}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={setupBiometric2FA}
                  disabled={!biometricSupported || loading}
                  variant="secondary"
                  size="sm"
                >
                  {loading && setupStep === 'biometric' ? 'Setting up...' : 'Setup'}
                </Button>
              </div>
            </Card>

            {/* Push Notification Option */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    🔔 Push Notification 2FA
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    Receive instant approval notifications for secure login
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${pushSupported ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-xs text-gray-400">
                      {pushSupported ? 'Device supports push notifications' : 'Device does not support push notifications'}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={setupPush2FA}
                  disabled={!pushSupported || loading}
                  variant="secondary"
                  size="sm"
                >
                  {loading && setupStep === 'push' ? 'Setting up...' : 'Setup'}
                </Button>
              </div>
            </Card>

            {/* Existing TOTP Option */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    🔐 Authenticator App (TOTP)
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    Use Google Authenticator, Authy, or similar apps
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs text-gray-400">
                      Available on all devices
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => onNavigate('authenticator-setup')}
                  variant="secondary"
                  size="sm"
                >
                  Setup
                </Button>
              </div>
            </Card>
          </div>

          {message && (
            <div className={`p-4 rounded-lg ${message.includes('❌') ? 'bg-red-900/50 border border-red-500' : 'bg-green-900/50 border border-green-500'}`}>
              <p className="text-sm text-white">{message}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (setupStep === 'complete') {
    return (
      <div className="min-h-screen bg-black text-white">
        <ScreenHeader 
          title="Setup Complete"
          onBack={() => onNavigate('profile')}
        />
        
        <div className="p-6 space-y-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-400 mb-2">
              Enhanced 2FA Enabled!
            </h2>
            <p className="text-gray-300 mb-6">
              Your account now has enterprise-grade security. You can now make investments of any amount, including high-value transactions over $20,000.
            </p>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              🛡️ Security Status
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Security Rating:</span>
                <span className="text-green-400 font-semibold">9.5/10</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">2FA Methods:</span>
                <span className="text-green-400 font-semibold">Multiple Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Device Security:</span>
                <span className="text-green-400 font-semibold">Hardware-Level</span>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <Button
              onClick={testPushNotification}
              variant="secondary"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Sending...' : '📱 Test Push Notification'}
            </Button>
            
            <Button
              onClick={() => onNavigate('profile')}
              variant="primary"
              className="w-full"
            >
              Return to Profile
            </Button>
          </div>

          {message && (
            <div className="p-4 rounded-lg bg-blue-900/50 border border-blue-500">
              <p className="text-sm text-white">{message}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Loading states for biometric/push setup
  return (
    <div className="min-h-screen bg-black text-white">
      <ScreenHeader 
        title="Setting Up 2FA"
        onBack={() => {
          setSetupStep('choose');
          setLoading(false);
        }}
      />
      
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
        <h2 className="text-xl font-semibold text-white mb-2">
          {setupStep === 'biometric' ? '📱 Setting up biometric authentication...' : '🔔 Setting up push notifications...'}
        </h2>
        <p className="text-gray-300 text-center">
          {setupStep === 'biometric' 
            ? 'Please follow the prompts on your device to register your biometric authentication.'
            : 'Configuring your device for push notification 2FA.'
          }
        </p>
      </div>
    </div>
  );
};
