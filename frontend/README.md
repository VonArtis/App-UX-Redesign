# 🎨 VonVault Frontend - React + TypeScript

> **Professional DeFi Telegram Mini App Frontend with Multi-Wallet Support**

This is the frontend for VonVault, a complete DeFi investment platform built as a Telegram Mini App. The frontend is built with React, TypeScript, and Tailwind CSS, featuring 18 screens and comprehensive multi-wallet functionality.

---

## 🚀 **Quick Start**

### **Development Setup**

```bash
# Install dependencies (use yarn, not npm)
yarn install

# Set up environment variables
echo "REACT_APP_BACKEND_URL=https://vonvault-backend.onrender.com" > .env

# Start development server
yarn start
```

The app will open at [http://localhost:3000](http://localhost:3000) in development mode.

### **Production Build**

```bash
# Build for production
yarn build

# The build folder will contain optimized production files
# Ready for deployment to Vercel or other hosting platforms
```

---

## 🎨 **Frontend Architecture**

### **🏗️ Project Structure**

```typescript
src/
├── components/              # Reusable UI components
│   ├── screens/            # 23 screen components
│   │   ├── DashboardScreen.tsx         # Main dashboard
│   │   ├── WalletManagerScreen.tsx     # Multi-wallet management
│   │   ├── CryptoWalletScreen.tsx      # Crypto portfolio view
│   │   ├── MakeNewInvestmentScreen.tsx # Investment creation
│   │   ├── EmailVerificationScreen.tsx # Email verification
│   │   ├── SMSVerificationScreen.tsx   # SMS verification
│   │   ├── TwoFactorSetupScreen.tsx    # 2FA setup
│   │   └── ...                         # Other 16 screens
│   ├── common/             # Shared UI components
│   │   ├── Button.tsx      # Professional button component
│   │   ├── Card.tsx        # Card layout component
│   │   ├── Input.tsx       # Form input component
│   │   └── LoadingSpinner.tsx
│   └── layout/             # Layout components
│       └── ScreenHeader.tsx
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts         # Authentication management
│   ├── usePortfolio.ts    # Portfolio data handling
│   ├── useMultiWallet.ts  # Multi-wallet state management
│   └── useMembership.ts   # Membership system
├── services/              # External service integrations
│   └── api.ts            # Backend API client
├── context/              # React Context providers
│   ├── AppContext.tsx    # Global app state
│   └── TelegramContext.tsx # Telegram Mini App integration
├── types/               # TypeScript definitions
│   └── index.ts        # All type definitions
└── utils/              # Utility functions
    └── constants.ts    # App constants
```

### **🎯 Key Features**

- **📱 23 Screen Components** - Complete user journey from onboarding with verification to advanced portfolio management
- **💼 Multi-Wallet Support** - Up to 5 wallets with MetaMask, Trust Wallet, WalletConnect, Coinbase
- **🎨 Professional UI Library** - Consistent design system with dark theme
- **⚡ TypeScript** - Full type coverage for enhanced developer experience
- **📊 Real-time Data** - Live crypto prices and portfolio updates
- **🏆 Membership System** - 5-tier system (Basic → Club → Premium → VIP → Elite) with dynamic investment plans
- **🔐 Complete Authentication** - Email, SMS verification, and 2FA setup

---

## 💼 **Multi-Wallet Frontend Features**

### **🪙 Wallet Management**
- **WalletManagerScreen** - Complete wallet management interface
- **Primary wallet designation** - Visual indicators and easy switching
- **Wallet type icons** - 🦊 MetaMask, 🛡️ Trust Wallet, 🔗 WalletConnect, 🔵 Coinbase
- **Network badges** - Clear Ethereum, Polygon, BSC indicators

### **📊 Enhanced Dashboard**
- **Multi-wallet indicators** - Wallet count badges and status
- **Primary wallet display** - Shows active wallet with type icon
- **Balance aggregation** - Total value across all wallets and networks

### **💰 Investment Integration**
- **Wallet selection** - Choose specific wallet for each investment
- **Primary wallet auto-selection** - Smart defaults for transactions
- **Investment summary** - Shows selected wallet in confirmation

---

## 🎨 **UI Components**

### **Professional Component Library**

```typescript
// Button Component - 3 variants, 3 sizes, full accessibility
<Button 
  variant="primary" 
  size="lg" 
  loading={isLoading}
  onClick={handleClick}
>
  Connect Wallet
</Button>

// Input Component - Validation, prefixes, error handling
<Input
  label="Investment Amount"
  type="number"
  prefix="$"
  validation={validateAmount}
  error={errors.amount}
/>

// Card Component - Hover effects, clickable variants
<Card 
  className="wallet-card"
  onClick={selectWallet}
  hover
>
  <WalletDetails />
</Card>
```

### **🌙 Design System**

```css
/* VonVault Color Palette */
--primary-purple: #9333ea;
--dark-bg: #000000;
--card-bg: #1f2937;
--text-primary: #ffffff;
--success-green: #10b981;

/* Tier-specific colors */
--club-color: #d97706;      /* Amber/Bronze */
--premium-color: #9ca3af;   /* Silver/Gray */
--vip-color: #eab308;       /* Gold/Yellow */
--elite-color: #9333ea;     /* Purple/Pink */
```

---

## 📱 **Telegram Mini App Integration**

### **🔗 Telegram WebApp Features**
- **Native integration** - Telegram WebApp API
- **User data access** - Telegram profile integration
- **Theme adaptation** - Follows Telegram theme settings
- **Hardware back button** - Native navigation support

### **🎯 Mobile Optimization**
- **Touch-friendly** - 44px minimum tap targets
- **Gesture support** - Swipe navigation
- **Performance** - <100ms interaction response
- **Responsive** - Perfect on all screen sizes

---

## ⚙️ **Development Guidelines**

### **🔧 Available Scripts**

```bash
# Development
yarn start          # Start development server
yarn build         # Build for production
yarn test          # Run test suite
yarn lint          # Run ESLint
yarn type-check    # TypeScript type checking

# Deployment
yarn deploy        # Deploy to production (Vercel)
```

### **🎨 Code Style**

- **TypeScript** - Strict mode enabled, full type coverage
- **ESLint + Prettier** - Consistent code formatting
- **Component naming** - PascalCase for components, camelCase for functions
- **File organization** - Feature-based folder structure

### **📊 Performance Guidelines**

- **Lazy loading** - Route-based code splitting
- **Image optimization** - WebP format with fallbacks
- **Bundle size** - <1MB for optimal loading
- **Caching** - Service worker for offline functionality

---

## 🌐 **Environment Configuration**

### **Environment Variables**

```bash
# Required
REACT_APP_BACKEND_URL=https://vonvault-backend.onrender.com

# Optional (for development)
REACT_APP_DEBUG=true
REACT_APP_ENVIRONMENT=development
```

### **🚀 Deployment**

```bash
# Production deployment to Render
yarn build

# Or use GitHub integration for automatic deployments
git push origin main  # Auto-deploys to https://www.vonartis.app
```

---

## 🧪 **Testing**

### **Testing Strategy**
- **Unit tests** - Component functionality testing
- **Integration tests** - Multi-wallet flow testing
- **E2E tests** - Complete user journey validation

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test --watch

# Generate coverage report
yarn test --coverage
```

---

## 📚 **Key Dependencies**

```json
{
  "react": "^18.2.0",
  "typescript": "^5.2.2",
  "tailwindcss": "^3.3.0",
  "@types/react": "^18.2.0",
  "axios": "^1.4.0",
  "react-qr-code": "^2.0.11",
  "ethers": "^6.6.0"
}
```

---

## 🎯 **Learn More**

### **🔗 Useful Links**
- **Live App**: [https://www.vonartis.app](https://www.vonartis.app)
- **Backend API**: [https://vonvault-backend.onrender.com](https://vonvault-backend.onrender.com)
- **Main Repository**: [VonVault GitHub](https://github.com/HarryVonBot/TG-Mini-App)
- **Documentation**: [Project Docs](../docs/)

### **📖 Additional Resources**
- [React Documentation](https://reactjs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)

---

*Built with ❤️ for the future of decentralized finance*
