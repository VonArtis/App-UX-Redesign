import React from 'react';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

interface StrengthResult {
  score: number; // 0-4
  feedback: string[];
  label: string;
  color: string;
  bgColor: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password, className = '' }) => {
  
  const calculateStrength = (pwd: string): StrengthResult => {
    let score = 0;
    const feedback: string[] = [];
    
    // Length check
    if (pwd.length >= 8) {
      score += 1;
    } else if (pwd.length > 0) {
      feedback.push(`${8 - pwd.length} more characters needed`);
    }
    
    // Uppercase check
    if (/[A-Z]/.test(pwd)) {
      score += 1;
    } else if (pwd.length > 0) {
      feedback.push('Add uppercase letter');
    }
    
    // Lowercase check
    if (/[a-z]/.test(pwd)) {
      score += 1;
    } else if (pwd.length > 0) {
      feedback.push('Add lowercase letter');
    }
    
    // Number check
    if (/\d/.test(pwd)) {
      score += 1;
    } else if (pwd.length > 0) {
      feedback.push('Add number');
    }
    
    // Special character check
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(pwd)) {
      score += 1;
    } else if (pwd.length > 0) {
      feedback.push('Add special character (!@#$...)');
    }
    
    // Common patterns to avoid
    const commonPatterns = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    const lowerPwd = pwd.toLowerCase();
    if (commonPatterns.some(pattern => lowerPwd.includes(pattern))) {
      score = Math.max(0, score - 2);
      feedback.push('Avoid common passwords');
    }
    
    // Determine label and colors
    let label: string;
    let color: string;
    let bgColor: string;
    
    switch (score) {
      case 0:
      case 1:
        label = 'Weak';
        color = 'text-red-400';
        bgColor = 'bg-red-500';
        break;
      case 2:
        label = 'Fair';
        color = 'text-yellow-400';
        bgColor = 'bg-yellow-500';
        break;
      case 3:
        label = 'Good';
        color = 'text-blue-400';
        bgColor = 'bg-blue-500';
        break;
      case 4:
      case 5:
        label = 'Strong';
        color = 'text-green-400';
        bgColor = 'bg-green-500';
        break;
      default:
        label = '';
        color = 'text-gray-400';
        bgColor = 'bg-gray-500';
    }
    
    return { score, feedback, label, color, bgColor };
  };
  
  const strength = calculateStrength(password);
  const strengthPercentage = password.length > 0 ? Math.min((strength.score / 4) * 100, 100) : 0;
  const isStrong = strength.score >= 4;
  
  if (password.length === 0) {
    return null;
  }
  
  return (
    <div className={`mt-2 space-y-2 ${className}`}>
      {/* Strength Bar */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Password Strength</span>
          <span className={`text-xs font-medium ${strength.color}`}>
            {strength.label}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${strength.bgColor}`}
            style={{ width: `${strengthPercentage}%` }}
          ></div>
        </div>
      </div>
      
      {/* Show requirements only if password is not strong yet */}
      {!isStrong && (
        <>
          {/* Requirements Checklist */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className={password.length >= 8 ? 'text-green-400' : 'text-gray-400'}>
                {password.length >= 8 ? '✓' : '○'}
              </span>
              <span className="text-xs text-gray-400">
                At least 8 characters ({password.length}/8)
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={/[A-Z]/.test(password) ? 'text-green-400' : 'text-gray-400'}>
                {/[A-Z]/.test(password) ? '✓' : '○'}
              </span>
              <span className="text-xs text-gray-400">
                Uppercase letter (A-Z)
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={/[a-z]/.test(password) ? 'text-green-400' : 'text-gray-400'}>
                {/[a-z]/.test(password) ? '✓' : '○'}
              </span>
              <span className="text-xs text-gray-400">
                Lowercase letter (a-z)
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={/\d/.test(password) ? 'text-green-400' : 'text-gray-400'}>
                {/\d/.test(password) ? '✓' : '○'}
              </span>
              <span className="text-xs text-gray-400">
                Number (0-9)
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password) ? 'text-green-400' : 'text-gray-400'}>
                {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password) ? '✓' : '○'}
              </span>
              <span className="text-xs text-gray-400">
                Special character (!@#$...)
              </span>
            </div>
          </div>
          
          {/* Additional Feedback */}
          {strength.feedback.length > 0 && (
            <div className="bg-blue-900/20 rounded-lg p-2">
              <p className="text-xs text-blue-300">
                💡 {strength.feedback.join(', ')}
              </p>
            </div>
          )}
        </>
      )}
      
      {/* Success message when strong */}
      {isStrong && (
        <div className="bg-green-900/20 rounded-lg p-2">
          <p className="text-xs text-green-300">
            ✅ Password meets all requirements!
          </p>
        </div>
      )}
    </div>
  );
};