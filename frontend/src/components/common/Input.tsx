// Reusable input component
import React, { forwardRef } from 'react';

interface InputProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  prefix?: string;
  className?: string;
  step?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'url' | 'numeric' | 'decimal' | 'search';
  autoComplete?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  prefix,
  className = '',
  step,
  inputMode,
  autoComplete
}, ref) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-white dark:text-white light:text-black">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {prefix}
          </span>
        )}
        
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          step={step}
          inputMode={inputMode}
          autoComplete={autoComplete}
          className={`
            w-full px-4 py-3
            ${prefix ? 'pl-12' : ''}
            bg-gray-800 dark:bg-gray-800 light:bg-white
            border rounded-lg
            text-white dark:text-white light:text-black
            placeholder-gray-400 dark:placeholder-gray-400 light:placeholder-gray-500
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-all duration-200
            ${error ? 'border-red-500' : 'border-gray-600 dark:border-gray-600 light:border-gray-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
      </div>
      
      {error && (
        <p className="text-red-400 dark:text-red-400 light:text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';