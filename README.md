# FAMAPP - Family Organization Platform

> 🏠 **Web App Live**: https://famapp-e80ff.web.app  
> 📱 **iOS App**: Ready for App Store deployment

## Overview

FAMAPP is a comprehensive family organization platform that helps families stay coordinated with shared todos, calendars, grocery lists, and document storage. Built with a modern monorepo architecture, it provides seamless synchronization between web and mobile platforms.

## 🚀 Quick Start

### Access the Live Web App
👉 **https://famapp-e80ff.web.app**

The web application is fully functional and ready to use immediately.

### Deploy the iOS App

1. **Setup iOS development**:
   ```bash
   yarn setup  # Automated monorepo setup
   ```

2. **Configure Firebase for iOS**:
   - Download `GoogleService-Info.plist` from Firebase Console
   - Replace template in `packages/mobile/ios/FAMAPPMobile/`

3. **Build and deploy**:
   ```bash
   yarn deploy:appstore  # Full iOS deployment pipeline
   ```

## 📁 Project Structure

```
FAMAPP/
├── packages/
│   ├── shared/          # Shared business logic and types
│   ├── web/            # React web application (LIVE)
│   └── mobile/         # React Native iOS app (READY)
├── scripts/            # Development automation
└── docs/              # Documentation and guides
```

## 🌟 Features

| Feature | Web | iOS | Description |
|---------|-----|-----|-------------|
| **Authentication** | ✅ | ✅ | Email/password + Google Sign-In |
| **Todos** | ✅ | ✅ | Shared family task management |
| **Calendar** | ✅ | ✅ | Family events and scheduling |
| **Groceries** | ✅ | ✅ | Collaborative shopping lists |
| **Documents** | ✅ | ✅ | Family file storage and sharing |
| **Real-time Sync** | ✅ | ✅ | Instant updates across devices |
| **Multi-language** | ✅ | ✅ | English and Spanish support |
| **Offline Support** | ✅ | ✅ | Works without internet connection |

## 🛠 Development

### Prerequisites
- Node.js 16+
- Yarn package manager
- macOS (for iOS development)
- Xcode 14+ (for iOS builds)

### Available Scripts

```bash
# Development
yarn web:dev              # Start web development server
yarn mobile:start          # Start React Native Metro bundler
yarn mobile:ios           # Run iOS simulator

# Testing
yarn test                 # Run all tests
yarn test:ci             # CI-optimized test suite
yarn lint                # Code quality checks

# Building
yarn build               # Build all packages
yarn build:ios:release   # iOS release build

# Deployment
yarn deploy:staging      # Deploy to staging
yarn deploy:appstore     # Deploy to App Store
```

## 🔥 Firebase Configuration

- **Project ID**: `famapp-e80ff`
- **Web App**: Already configured and deployed
- **iOS App**: Requires `GoogleService-Info.plist` from Firebase Console
- **Services**: Authentication, Firestore, Storage

## 📱 iOS Deployment Status

### ✅ Ready for App Store
- [x] React Native project configured
- [x] Firebase integration complete
- [x] Comprehensive testing suite
- [x] Build and deployment scripts
- [x] Xcode project configuration
- [x] App Store submission documentation

### Next Steps
1. Download Firebase iOS configuration
2. Test on iOS simulator/device
3. Submit to App Store

## 📚 Documentation

- **[Complete Deployment Guide](FINAL_DEPLOYMENT_GUIDE.md)** - End-to-end deployment instructions
- **[Mobile Development](packages/mobile/README.md)** - React Native development guide
- **[Firebase Setup](packages/mobile/FIREBASE_SETUP.md)** - Firebase configuration details

## 🌐 Live Application

**Web App**: https://famapp-e80ff.web.app

Features available immediately:
- Create family account
- Manage todos and assign to family members
- Schedule events on shared calendar
- Create and manage grocery lists
- Upload and organize family documents
- Switch between English and Spanish
- Works on desktop, tablet, and mobile browsers

## 👨‍👩‍👧‍👦 Family Members

- Gonzalo
- Mpaz  
- Borja
- Melody

---

**Built with ❤️ for families who want to stay organized together.**

🚀 **Ready to deploy**: Web app is live, iOS app ready for App Store submission!