# 🚀 **NEXT AGENT - START HERE**

## ⚡ **QUICK SETUP - DO THIS FIRST**

You are working with **VonVault live production files** - NOT the basic template!

### **🎯 VERIFICATION COMMANDS** (Run these IMMEDIATELY):
```bash
# 1. Verify you have the RIGHT files (160KB+ backend):
ls -la /app/backend/server.py

# 2. Check for Vonage integration:
grep "Vonage client initialized" /app/backend/server.py

# 3. Check for production components:
ls /app/frontend/src/components/common/PasswordInput.tsx

# 4. Verify security rating references:
grep "9.95/10" /app/README.md
```

### **✅ EXPECTED RESULTS:**
- `server.py` should be **160KB+** (not 2-3KB template)
- Should find "Vonage client initialized" text
- PasswordInput.tsx component should exist
- Should find 10+ "9.95/10" references in README

### **📦 INSTALL DEPENDENCIES:**
```bash
cd /app/backend && pip install -r requirements.txt
cd /app/frontend && yarn install
sudo supervisorctl restart all
```

### **🔗 LIVE URLS:**
- **Frontend**: https://www.vonartis.app
- **Backend**: https://www.api.vonartis.app

---

## 🎯 **IF FILES ARE WRONG - RUN SETUP SCRIPT:**
```bash
bash /app/scripts/agent-quick-setup.sh
```

**You should now have the complete VonVault production codebase ready for development!**