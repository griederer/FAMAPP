# iOS Deployment Guide for FAMAPP Mobile

## Overview

This guide covers the complete deployment process for FAMAPP Mobile on iOS, from development builds to App Store distribution.

## Prerequisites

### Required Tools
- **macOS** with Xcode 12+ installed
- **Node.js 16+** and **Yarn**
- **CocoaPods** for iOS dependencies
- **Apple Developer Account** (for distribution)
- **App Store Connect** access

### Optional Tools
- **Fastlane** for automated deployment
- **Git** for version control
- **Slack** for deployment notifications

## Initial Setup

### 1. Apple Developer Account Setup

1. **Enroll in Apple Developer Program**
   - Visit [developer.apple.com](https://developer.apple.com)
   - Enroll in the iOS Developer Program ($99/year)
   - Complete identity verification

2. **Create App ID**
   - Bundle ID: `com.famapp.mobile`
   - Enable capabilities: Push Notifications, Background Modes

3. **Generate Certificates**
   - Development Certificate (for testing)
   - Distribution Certificate (for App Store)

4. **Create Provisioning Profiles**
   - Development Profile (for testing)
   - App Store Distribution Profile

### 2. App Store Connect Setup

1. **Create App Record**
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Create new app with Bundle ID `com.famapp.mobile`
   - Fill in basic app information

2. **Configure App Information**
   - App Name: "FAMAPP"
   - Subtitle: "Family Organization App"
   - Category: Productivity
   - Content Rating: 4+ (suitable for all ages)

## Deployment Methods

### Method 1: Automated Deployment (Recommended)

#### Using Custom Scripts

```bash
# Development build
./scripts/deploy-ios.sh

# Staging deployment
./scripts/deploy-ios.sh -e staging -v 1.0.1

# Production deployment with upload
./scripts/deploy-ios.sh -e production -v 1.0.1 -u

# Full release pipeline
./scripts/deploy-ios.sh -e production -v 1.0.1 -u -r -n release-notes.txt
```

#### Using Fastlane

```bash
# Install Fastlane
gem install fastlane

# Setup Fastlane
cd ios
fastlane init

# Deploy to TestFlight
fastlane beta

# Deploy to App Store
fastlane release
```

### Method 2: Manual Deployment

#### Step 1: Prepare the Build

1. **Update Version Numbers**
   ```bash
   # Update in Info.plist
   CFBundleShortVersionString = "1.0.1"  # Marketing version
   CFBundleVersion = "123"               # Build number
   ```

2. **Run Pre-deployment Checks**
   ```bash
   cd packages/mobile
   yarn test:ci          # Run all tests
   yarn lint             # Check code quality
   yarn type-check       # TypeScript validation
   node setup.js         # Firebase configuration check
   ```

#### Step 2: Build for Distribution

1. **Open Xcode Project**
   ```bash
   cd packages/mobile/ios
   open FAMAPPMobile.xcworkspace
   ```

2. **Configure Build Settings**
   - Select "FAMAPPMobile" scheme
   - Choose "Any iOS Device" or specific device
   - Set build configuration to "Release"

3. **Archive the Build**
   - Menu: Product → Archive
   - Wait for archive to complete
   - Organizer window will open

#### Step 3: Export and Upload

1. **Export Archive**
   - Click "Distribute App"
   - Choose "App Store Connect"
   - Select distribution certificate
   - Review app information
   - Export IPA file

2. **Upload to App Store Connect**
   - Use Xcode Organizer, or
   - Use Application Loader, or
   - Use command line:
   ```bash
   xcrun altool --upload-app \
     --type ios \
     --file "FAMAPPMobile.ipa" \
     --username "your@email.com" \
     --password "app-specific-password"
   ```

## Environment Configuration

### Development Environment

```bash
# Configuration for development builds
ENVIRONMENT=development
FIREBASE_PROJECT=famapp-dev
BUNDLE_ID=com.famapp.mobile.dev
```

### Staging Environment

```bash
# Configuration for staging builds
ENVIRONMENT=staging
FIREBASE_PROJECT=famapp-staging
BUNDLE_ID=com.famapp.mobile.staging
```

### Production Environment

```bash
# Configuration for production builds
ENVIRONMENT=production
FIREBASE_PROJECT=famapp-production
BUNDLE_ID=com.famapp.mobile
```

## Version Management

### Semantic Versioning

Follow semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Breaking changes or major feature releases
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

Examples:
- `1.0.0` - Initial release
- `1.1.0` - New features added
- `1.1.1` - Bug fixes
- `2.0.0` - Major redesign

### Build Numbers

- Auto-increment for each build
- Use timestamp format: `YYYYMMDDHH`
- Example: `2024011514` (January 15, 2024, 2 PM)

## Testing Before Release

### 1. Automated Testing

```bash
# Unit tests
yarn test:unit

# Integration tests
yarn test:integration

# Performance tests
yarn test:performance

# Full test suite with coverage
yarn test:ci
```

### 2. Manual Testing Checklist

- [ ] **Authentication Flow**
  - [ ] Login with valid credentials
  - [ ] Login with invalid credentials
  - [ ] Logout functionality
  - [ ] Session persistence

- [ ] **Core Features**
  - [ ] Create, edit, delete todos
  - [ ] View calendar events
  - [ ] Manage grocery lists
  - [ ] Access documents

- [ ] **Performance**
  - [ ] App launch time < 3 seconds
  - [ ] Smooth scrolling in lists
  - [ ] Responsive UI interactions

- [ ] **Device Testing**
  - [ ] iPhone SE (small screen)
  - [ ] iPhone 14 (standard)
  - [ ] iPhone 14 Pro Max (large screen)
  - [ ] iPad (if supported)

### 3. TestFlight Beta Testing

1. **Upload to TestFlight**
   ```bash
   fastlane beta
   # or
   ./scripts/deploy-ios.sh -e staging -u
   ```

2. **Invite Beta Testers**
   - Internal testers (App Store Connect users)
   - External testers (up to 10,000 users)

3. **Collect Feedback**
   - Monitor crash reports
   - Review user feedback
   - Track usage analytics

## App Store Submission

### 1. Prepare App Store Listing

1. **App Information**
   - Name: FAMAPP
   - Subtitle: Family Organization & Task Management
   - Description: [Detailed app description]
   - Keywords: family, organization, todos, calendar, grocery

2. **Screenshots** (Required sizes)
   - iPhone 6.7": 1290×2796 px
   - iPhone 6.5": 1242×2688 px
   - iPhone 5.5": 1242×2208 px
   - iPad Pro: 2048×2732 px

3. **App Preview Video** (Optional)
   - 15-30 seconds
   - Show key features
   - No audio required

### 2. Submit for Review

1. **Upload Final Build**
   ```bash
   ./scripts/deploy-ios.sh -e production -v 1.0.0 -u
   ```

2. **Complete App Store Connect Form**
   - Select build for submission
   - Answer review questions
   - Add release notes
   - Submit for review

3. **Review Process**
   - Apple review typically takes 24-48 hours
   - May request changes or additional information
   - Address any feedback promptly

### 3. Release Management

1. **Manual Release** (Recommended)
   - Review approved
   - Choose release timing
   - Monitor initial user feedback

2. **Automatic Release**
   - Releases immediately after approval
   - Less control over timing

## Continuous Integration/Deployment

### GitHub Actions Workflow

```yaml
name: iOS Deployment

on:
  push:
    tags:
      - 'ios-v*'

jobs:
  deploy:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: yarn install
      
      - name: Run tests
        run: yarn test:ci
      
      - name: Deploy to App Store
        run: ./scripts/deploy-ios.sh -e production -u
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APP_SPECIFIC_PASSWORD: ${{ secrets.APP_SPECIFIC_PASSWORD }}
```

### Fastlane CI Integration

```ruby
# In Fastfile
lane :ci_deploy do
  # Run on CI server
  setup_certificates
  test
  beta if is_ci?
end
```

## Troubleshooting

### Common Build Issues

1. **Code Signing Errors**
   ```bash
   # Fix: Update certificates and provisioning profiles
   fastlane match development --force
   fastlane match appstore --force
   ```

2. **CocoaPods Issues**
   ```bash
   # Fix: Clean and reinstall pods
   cd ios
   pod deintegrate
   pod install --repo-update
   ```

3. **Archive Failures**
   ```bash
   # Fix: Clean build folder
   rm -rf ios/build
   # Clean Derived Data in Xcode
   ```

### App Store Review Issues

1. **Rejection for Missing Features**
   - Ensure all advertised features work
   - Test on multiple devices
   - Provide demo account if needed

2. **Privacy Policy Requirements**
   - Add privacy policy URL
   - Explain data collection clearly
   - Follow Apple's privacy guidelines

3. **Design Guidelines**
   - Follow Human Interface Guidelines
   - Ensure consistent UI/UX
   - Test accessibility features

## Security Considerations

### Code Signing
- Keep certificates secure and backed up
- Use team-managed certificates when possible
- Rotate certificates before expiration

### API Keys and Secrets
- Never commit API keys to repository
- Use environment variables
- Rotate keys regularly

### App Transport Security
- Use HTTPS for all network requests
- Implement certificate pinning for sensitive APIs
- Follow Apple's security guidelines

## Monitoring and Analytics

### Crash Reporting
- Integrate crash reporting service
- Monitor crash rates after releases
- Fix critical crashes quickly

### Performance Monitoring
- Track app launch times
- Monitor memory usage
- Optimize performance bottlenecks

### User Analytics
- Track feature usage
- Monitor user engagement
- A/B testing for improvements

## Rollback Procedures

### Emergency Rollback
1. **Phased Release** (if enabled)
   - Pause rollout immediately
   - Fix issues in new version

2. **Full Rollback**
   - Submit previous working version
   - Expedited review if critical

3. **Communication**
   - Notify users of issues
   - Provide timeline for fixes
   - Update App Store description

## Maintenance Schedule

### Regular Tasks
- **Weekly**: Monitor analytics and crash reports
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and update certificates
- **Annually**: Renew Apple Developer Program membership

### Version Updates
- **Patch releases**: Critical bugs, security fixes
- **Minor releases**: New features, improvements
- **Major releases**: Significant changes, redesigns

---

## Quick Reference Commands

```bash
# Development
yarn dev:ios                    # Start development
yarn test                       # Run tests
./scripts/mobile-dev.sh ios     # Development helper

# Building
./scripts/build-ios.sh          # Basic build
./scripts/build-ios.sh -a -e    # Archive and export

# Deployment
./scripts/deploy-ios.sh                    # Staging deployment
./scripts/deploy-ios.sh -e production -u  # Production with upload

# Fastlane
fastlane test          # Run tests
fastlane beta          # Deploy to TestFlight
fastlane release       # Deploy to App Store
```

For additional help, refer to:
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [React Native iOS Deployment](https://reactnative.dev/docs/publishing-to-app-store)
- [Fastlane Documentation](https://docs.fastlane.tools/)