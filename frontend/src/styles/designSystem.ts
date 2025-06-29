// VonVault Mobile-First Design System
// Complete design system with consistent colors, spacing, and components

export const designSystem = {
  // === COLORS ===
  colors: {
    // Base colors
    black: '#000000',
    white: '#ffffff',
    
    // Primary purple accent
    purple: {
      400: '#9333ea',
      500: '#7c3aed',
      600: '#6d28d9',
      700: '#5b21b6',
      800: '#4c1d95',
      900: '#3730a3'
    },
    
    // Grays
    gray: {
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    },
    
    // Status colors
    success: {
      400: '#10b981',
      500: '#059669',
      600: '#047857'
    },
    
    warning: {
      400: '#f59e0b',
      500: '#d97706',
      600: '#b45309'
    },
    
    error: {
      400: '#ef4444',
      500: '#dc2626',
      600: '#b91c1c'
    },
    
    // Semantic colors
    background: '#000000',
    surface: '#1f2937',
    text: {
      primary: '#ffffff',
      secondary: '#9ca3af',
      accent: '#9333ea'
    }
  },

  // === SPACING ===
  spacing: {
    // Mobile-first spacing scale
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    base: '1rem',   // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
    
    // Touch targets (minimum 44px)
    touch: '2.75rem', // 44px
    
    // Layout spacing
    container: '1.5rem', // 24px - px-6
    section: '1.5rem',   // 24px - space-y-6
    header: '1rem',      // 16px - pt-4
    footer: '2rem'       // 32px - pb-8
  },

  // === TYPOGRAPHY ===
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif']
    },
    
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem' // 30px
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    }
  },

  // === COMPONENT STYLES ===
  components: {
    // Button styles
    button: {
      base: 'min-h-[44px] px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center',
      primary: 'bg-purple-400 hover:bg-purple-500 text-white',
      secondary: 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600',
      outline: 'border border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white'
    },
    
    // Card styles
    card: {
      base: 'bg-gray-800 border border-gray-700 rounded-lg p-4',
      hover: 'hover:bg-gray-750 transition-colors duration-200',
      accent: 'border-purple-500/30 bg-purple-900/20'
    },
    
    // Header styles
    header: {
      base: 'flex items-center justify-between mb-6',
      title: 'text-xl font-semibold text-white',
      backButton: 'min-h-[44px] min-w-[44px] flex items-center justify-center p-2 -ml-2 text-white hover:bg-gray-800 rounded-lg transition-colors'
    },
    
    // Layout styles
    layout: {
      container: 'min-h-screen bg-black text-white',
      content: 'px-6 pb-8 pt-4 space-y-6',
      contentWithTabs: 'px-6 pb-20 pt-4 space-y-6'
    },
    
    // Navigation styles
    navigation: {
      bottomTabs: 'fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50',
      tab: 'flex flex-col items-center justify-center flex-1 h-16 min-h-[44px] transition-all duration-200',
      tabActive: 'text-purple-400',
      tabInactive: 'text-gray-500 hover:text-gray-300'
    }
  },

  // === UTILITIES ===
  utilities: {
    // Touch-friendly sizes
    touchTarget: 'min-h-[44px] min-w-[44px]',
    
    // Animations
    fadeIn: 'animate-fade-in-up',
    slideIn: 'animate-slide-in-left',
    
    // Gradients
    gradients: {
      primary: 'bg-gradient-to-r from-purple-400 to-purple-600',
      header: 'bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent',
      card: 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
    }
  }
};

// === HELPER FUNCTIONS ===

export const getColor = (path: string) => {
  const keys = path.split('.');
  let value: any = designSystem.colors;
  
  for (const key of keys) {
    value = value[key];
    if (value === undefined) return path;
  }
  
  return value;
};

export const getSpacing = (size: keyof typeof designSystem.spacing) => {
  return designSystem.spacing[size];
};

export const getComponent = (component: string, variant: string = 'base') => {
  const comp = (designSystem.components as any)[component];
  return comp ? comp[variant] || comp.base : '';
};

// === RESPONSIVE BREAKPOINTS ===
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px'
};

// === CSS CUSTOM PROPERTIES ===
export const cssVariables = `
  :root {
    --color-background: ${designSystem.colors.background};
    --color-text-primary: ${designSystem.colors.text.primary};
    --color-text-secondary: ${designSystem.colors.text.secondary};
    --color-accent: ${designSystem.colors.text.accent};
    --spacing-touch: ${designSystem.spacing.touch};
    --spacing-container: ${designSystem.spacing.container};
  }
`;

export default designSystem;