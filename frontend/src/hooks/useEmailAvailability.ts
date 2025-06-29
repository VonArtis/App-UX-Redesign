// Hook for real-time email availability checking
import { useState, useEffect } from 'react';

interface EmailAvailability {
  isChecking: boolean;
  isAvailable: boolean | null;
  reason?: string;
}

export const useEmailAvailability = (email: string) => {
  const [availability, setAvailability] = useState<EmailAvailability>({
    isChecking: false,
    isAvailable: null
  });

  useEffect(() => {
    // Don't check if email is empty or invalid format
    if (!email || email.length < 3 || !email.includes('@')) {
      setAvailability({ isChecking: false, isAvailable: null });
      return;
    }

    // Debounce the email check by 800ms
    const timeoutId = setTimeout(async () => {
      setAvailability({ isChecking: true, isAvailable: null });

      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
        const response = await fetch(`${backendUrl}/auth/check-email?email=${encodeURIComponent(email)}`);
        const data = await response.json();

        setAvailability({
          isChecking: false,
          isAvailable: data.available,
          reason: data.reason
        });
      } catch (error) {
        console.error('Email availability check failed:', error);
        setAvailability({
          isChecking: false,
          isAvailable: null,
          reason: 'error'
        });
      }
    }, 800); // 800ms debounce

    // Cleanup timeout on email change
    return () => clearTimeout(timeoutId);
  }, [email]);

  return availability;
};