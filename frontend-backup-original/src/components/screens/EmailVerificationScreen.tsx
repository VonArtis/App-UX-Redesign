import React, { useState } from 'react';
import type { ScreenProps } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { MobileLayout } from '../layout/MobileLayout';
import { useApp } from '../../context/AppContext';

export const EmailVerificationScreen: React.FC<ScreenProps> = ({ onBack, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { user } = useApp();

  // Pre-fill email if user already has one
  React.useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user, email]);

  const sendVerificationEmail = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Call real email verification API
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token && { 'Authorization': `Bearer ${user.token}` })
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send verification email');
      }
      
      setSent(true);
      setMessage('Verification email sent! Please check your inbox and spam folder.');
      
      // Don't auto-advance - let user control navigation
      
    } catch (error: any) {
      console.error('Email verification error:', error);
      setError(error.message || 'Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async () => {
    setSent(false);
    await sendVerificationEmail();
  };

  return (
    <MobileLayout>
      <ScreenHeader title="Verify Email" onBack={onBack} />

      <Card className="mb-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">Email Verification</h2>
          <p className="text-gray-400 text-sm">
            We'll send a verification link to your email address to confirm it's really you.
          </p>
        </div>

        {!sent ? (
          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              error={error}
              disabled={loading}
            />

            <Button
              onClick={sendVerificationEmail}
              loading={loading}
              disabled={!email || loading}
              fullWidth
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Sending...' : 'Send Verification Email'}
            </Button>
              
            {/* Skip Button */}
            <Button
              onClick={() => {
                console.log('Email verification skipped');
                // TODO: Update user context to reflect email as verified or skipped
                onNavigate?.('sms-verification');
              }}
              variant="secondary"
              className="w-full mt-3"
            >
              Skip for Now - Verify Later
            </Button>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Email Sent!</h3>
              <p className="text-gray-400 text-sm mb-4">{message}</p>
              <p className="text-xs text-gray-500">
                Sent to: <span className="text-white font-medium">{email}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Button
                onClick={resendEmail}
                variant="secondary"
                size="sm"
                className="mr-2"
              >
                Resend Email
              </Button>
              
              <Button
                onClick={() => onNavigate?.('sms-verification')}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                Continue to SMS Verification
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Instructions */}
      <Card className="bg-gray-900/50 border-gray-700">
        <h4 className="font-semibold mb-2 text-white">📧 Email Verification Tips</h4>
        <div className="bg-blue-900/20 rounded-lg p-3 mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-blue-400">ℹ️</span>
            <div>
              <p className="text-sm text-blue-300 font-medium">Verification Optional During Setup</p>
              <p className="text-xs text-blue-400">You can verify your email later. Email verification will be required for withdrawals and high-value transactions.</p>
            </div>
          </div>
        </div>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Check your spam/junk folder if you don't see the email</li>
          <li>• Verification links expire after 24 hours</li>
          <li>• Click the link in the email to verify your address</li>
          <li>• Use a valid email - this is how we'll contact you about your investments</li>
        </ul>
      </Card>
    </MobileLayout>
  );
};