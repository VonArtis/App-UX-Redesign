# 🤖 **AGENT SETUP INSTRUCTIONS**

## 🚨 **CRITICAL: READ THIS FIRST**

**THE PROBLEM**: Agents waste 10+ minutes figuring out they need to work with live production files from GitHub, not the default template.

**THE SOLUTION**: This document provides everything needed to immediately start working with VonVault production files.

---

## 🎯 **MISSION: GET CORRECT FILES**

### **❌ WRONG FILES (Basic Template):**
- `/app/backend/server.py` is only 2-3KB
- Basic "Hello World" functionality only
- No Vonage integration
- No security features

### **✅ CORRECT FILES (VonVault Production):**
- `/app/backend/server.py` is 160KB+
- Full VonVault functionality
- Vonage SMS/2FA integration
- 9.95/10 security rating features
- Complete UI components

---

## 🔍 **VERIFICATION PROTOCOL**

Run these commands to verify you have the correct files:

```bash
# 1. Check backend file size (should be 160KB+)
ls -la /app/backend/server.py

# 2. Verify Vonage integration exists
grep "Vonage client initialized" /app/backend/server.py

# 3. Check for production UI components
ls /app/frontend/src/components/common/PasswordInput.tsx

# 4. Verify security rating references (should find 10+ matches)
grep "9.95/10" /app/README.md

# 5. Check for production dependencies
grep "vonage" /app/backend/requirements.txt
grep "@telegram-apps" /app/frontend/package.json
```

---

## 🚀 **QUICK SETUP COMMANDS**

If you don't have the correct files, run:

```bash
# Clone production repository
cd /tmp && git clone https://github.com/HarryVonBot/TG-Mini-App.git

# Replace template with production files
cd /app && rm -rf backend frontend tests scripts test_result.md README.md 2>/dev/null || true
cd /tmp/TG-Mini-App && cp -r backend frontend tests scripts test_result.md README.md /app/

# Install dependencies
cd /app/backend && pip install -r requirements.txt
cd /app/frontend && yarn install

# Restart services
sudo supervisorctl restart all
```

---

## 📋 **PRODUCTION ENVIRONMENT INFO**

### **Live URLs:**
- **Frontend**: https://www.vonartis.app  
- **Backend**: https://www.api.vonartis.app

### **Key Features:**
- 🏦 **DeFi Investment Platform**
- 🛡️ **9.95/10 Security Rating** 
- 📱 **Telegram Mini App**
- 🌍 **15+ Languages Support**
- 📞 **Vonage SMS/2FA Integration**
- 💎 **28 Production Screens**
- ⚡ **Real-time Data**

### **Tech Stack:**
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: FastAPI + MongoDB  
- **Integration**: Vonage SMS, Telegram Bot API
- **Security**: Enhanced 2FA, DevSecOps pipeline

---

## 🔧 **DEVELOPMENT WORKFLOW**

1. **Always verify files first** (use verification commands above)
2. **Read `/app/test_result.md`** for current status
3. **Install dependencies** if not already done
4. **Check service status**: `sudo supervisorctl status`
5. **Start development** with confidence you have production files

---

## 📞 **INTEGRATIONS REQUIRING API KEYS**

If working with integrations, you may need:
- **Vonage API Key** (for SMS/2FA)
- **Telegram Bot Token** (for Mini App)
- **Other third-party services**

Always ask user for required API keys before implementing integrations.

---

**🎯 RESULT: Agent should now have complete VonVault production codebase and understand the full application context!**