import React from 'react';

interface MobileLayoutProps {
  children: React.ReactNode;
  centered?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ 
  children, 
  centered = false, 
  maxWidth = 'md',
  className = '' 
}) => {
  const maxWidthClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm', 
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full'
  };

  const containerClasses = centered 
    ? `min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 ${className}`
    : `min-h-screen bg-black text-white px-6 pt-12 pb-8 ${className}`;

  const contentClasses = centered
    ? `w-full ${maxWidthClasses[maxWidth]} flex flex-col items-center`
    : `w-full ${maxWidthClasses[maxWidth]} mx-auto`;

  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        {children}
      </div>
    </div>
  );
};