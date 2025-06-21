# FAMAPP Monorepo

> Family organization and management application - Web and Mobile platforms

## 🏗 Architecture

This monorepo contains the complete FAMAPP ecosystem:

```
FAMAPP/
├── packages/
│   ├── shared/          # Shared business logic and types
│   ├── web/            # React web application  
│   └── mobile/         # React Native iOS/Android app
├── scripts/            # Development and setup scripts
└── docs/              # Documentation and guides
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 16+** and **Yarn 1.22+**
- **macOS** (for iOS development)
- **Xcode 12+** (for iOS)
- **Android Studio** (for Android)

### Setup

```bash
# Clone repository
git clone <repository-url>
cd FAMAPP

# Run automated setup
yarn setup
# OR manually:
yarn install
```

### Development

```bash
# Start web development
yarn web:dev

# Start mobile development
yarn mobile:start
yarn mobile:ios      # iOS simulator
yarn mobile:android  # Android emulator

# Run tests
yarn test
```

## 📱 Platforms

### Web Application
- **Technology**: React + Vite + TypeScript
- **UI Framework**: Tailwind CSS + shadcn/ui
- **State Management**: React Query + Context
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Hosting**: Vercel/Netlify ready

### Mobile Application  
- **Technology**: React Native + TypeScript
- **Navigation**: React Navigation 6
- **UI**: Native components + styled system
- **Platform**: iOS and Android
- **Backend**: Same Firebase as web

### Shared Package
- **Business Logic**: Firebase services and utilities
- **Type Definitions**: TypeScript interfaces
- **Data Models**: Consistent across platforms
- **Validation**: Shared validation logic

## 🔥 Firebase Integration

Both web and mobile apps share the same Firebase backend:

- **Authentication**: Email/password with family member roles
- **Firestore**: Real-time data synchronization
- **Storage**: Document and file management  
- **Security Rules**: Unified security model

### Configuration

1. **Create Firebase Project**: Use existing or create new
2. **Add Apps**: Register both web and mobile apps
3. **Download Configs**: Place in respective config directories
4. **Enable Services**: Auth, Firestore, Storage

See detailed setup guides:
- [Web Firebase Setup](./packages/web/FIREBASE_SETUP.md)
- [Mobile Firebase Setup](./packages/mobile/FIREBASE_SETUP.md)

## 📋 Features

### Core Functionality

| Feature | Web | Mobile | Description |
|---------|-----|--------|-------------|
| **Authentication** | ✅ | ✅ | Email/password login with family roles |
| **Todos** | ✅ | ✅ | Task management with assignment |
| **Calendar** | ✅ | ✅ | Family events and scheduling |
| **Groceries** | ✅ | ✅ | Shared shopping lists |
| **Documents** | ✅ | ✅ | Family document storage |
| **Real-time Sync** | ✅ | ✅ | Live updates across devices |

### Technical Features

- 🔄 **Cross-platform sync**: Changes appear instantly on all devices
- 📱 **Responsive design**: Works on desktop, tablet, and mobile web
- 🎨 **Native experience**: Platform-specific UI patterns
- 🔒 **Secure**: Role-based access with Firebase security rules
- 🧪 **Well-tested**: Comprehensive test coverage
- 📦 **Monorepo benefits**: Shared code and consistent APIs

## 🛠 Development Scripts

### Root Level Commands

```bash
# Setup and maintenance
yarn setup          # Initial setup with dependency installation
yarn reset          # Clean and reinstall everything
yarn clean          # Remove all node_modules and build artifacts

# Development
yarn dev <command>  # Development helper (see yarn dev help)
yarn build          # Build all packages
yarn test           # Run all tests
yarn lint           # Lint all packages

# Platform-specific
yarn web:dev        # Start web development server
yarn mobile:start   # Start React Native Metro bundler
yarn mobile:ios     # Run iOS app
yarn mobile:android # Run Android app
```

### Development Helper

Use the development helper script for common tasks:

```bash
yarn dev web         # Start web development
yarn dev mobile      # Start mobile Metro
yarn dev ios         # Start iOS app
yarn dev android     # Start Android app
yarn dev test        # Run all tests
yarn dev clean       # Clean all packages
yarn dev help        # Show all commands
```

## 📁 Project Structure

### Shared Package (`packages/shared`)

```
shared/
├── src/
│   ├── types/           # TypeScript interfaces
│   │   ├── core.ts      # Core types (User, FamilyMember)
│   │   ├── todo.ts      # Todo-related types
│   │   ├── calendar.ts  # Calendar types
│   │   ├── grocery.ts   # Grocery types
│   │   └── document.ts  # Document types
│   ├── services/        # Business logic services
│   │   ├── firebase.ts  # Firebase service abstraction
│   │   ├── auth.ts      # Authentication service
│   │   ├── todo.ts      # Todo service
│   │   ├── calendar.ts  # Calendar service
│   │   ├── grocery.ts   # Grocery service
│   │   └── document.ts  # Document service
│   └── utils/          # Shared utilities
└── dist/              # Built output
```

### Web Package (`packages/web`)

```
web/
├── src/
│   ├── components/     # React components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   ├── config/        # Configuration files
│   └── styles/        # Global styles
├── public/           # Static assets
└── dist/            # Build output
```

### Mobile Package (`packages/mobile`)

```
mobile/
├── src/
│   ├── components/    # React Native components
│   ├── screens/      # Screen components
│   ├── navigation/   # Navigation configuration
│   ├── services/     # Platform-specific services
│   └── config/      # App configuration
├── ios/             # iOS-specific files
├── android/         # Android-specific files
└── __tests__/      # Test files
```

## 🧪 Testing Strategy

### Test Organization

- **Unit Tests**: Component and service testing
- **Integration Tests**: Firebase integration testing
- **E2E Tests**: Critical user flow testing
- **Visual Tests**: Snapshot testing for UI consistency

### Running Tests

```bash
# All tests
yarn test

# Platform-specific
yarn web:test
yarn mobile:test
yarn shared:test

# With coverage
yarn test:ci
```

### Test Configuration

- **Web**: Vitest + React Testing Library
- **Mobile**: Jest + React Native Testing Library  
- **Shared**: Jest for service testing

## 🚀 Deployment

### Web Deployment

**Vercel (Recommended):**
1. Connect repository to Vercel
2. Set build command: `yarn web:build`
3. Set output directory: `packages/web/dist`
4. Configure environment variables

**Netlify:**
1. Connect repository to Netlify
2. Set build command: `yarn web:build`
3. Set publish directory: `packages/web/dist`

### Mobile Deployment

**iOS (App Store):**
1. Open `packages/mobile/ios/FAMAPPMobile.xcworkspace`
2. Configure signing and provisioning
3. Archive and upload to App Store Connect

**Android (Google Play):**
1. Generate signed APK/AAB
2. Upload to Google Play Console
3. Submit for review

See platform-specific deployment guides in respective package README files.

## 📚 Documentation

### Getting Started
- [Monorepo Setup Guide](./docs/SETUP.md)
- [Development Workflow](./docs/DEVELOPMENT.md)
- [Firebase Configuration](./docs/FIREBASE_SETUP.md)

### Platform Guides
- [Web Development](./packages/web/README.md)
- [Mobile Development](./packages/mobile/README.md) 
- [Shared Package](./packages/shared/README.md)

### Architecture
- [System Architecture](./docs/ARCHITECTURE.md)
- [Database Schema](./docs/DATABASE.md)
- [Security Model](./docs/SECURITY.md)

## 🔧 Troubleshooting

### Common Issues

**Dependencies not installing:**
```bash
yarn reset  # Clean and reinstall everything
```

**Web app not starting:**
```bash
yarn shared:build  # Ensure shared package is built
yarn web:dev
```

**Mobile app not building:**
```bash
yarn mobile:clean  # Clean React Native cache
yarn mobile:pods   # Reinstall iOS pods (macOS only)
```

**Firebase connection issues:**
```bash
yarn firebase-check  # Verify Firebase configuration
```

### Getting Help

1. Check the troubleshooting sections in package READMEs
2. Review Firebase setup documentation
3. Check GitHub issues for known problems
4. Create a new issue with detailed reproduction steps

## 🤝 Contributing

### Development Workflow

1. **Fork and clone** the repository
2. **Create feature branch** from `main`
3. **Run setup**: `yarn setup`
4. **Make changes** with tests
5. **Run tests**: `yarn test`
6. **Submit pull request**

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Consistent code formatting
- **Prettier**: Automatic code formatting
- **Tests**: Required for new features
- **Documentation**: Update READMEs for significant changes

### Commit Guidelines

Use conventional commits:
- `feat:` New features
- `fix:` Bug fixes  
- `docs:` Documentation changes
- `test:` Test additions/changes
- `refactor:` Code refactoring

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for families who want to stay organized together.**