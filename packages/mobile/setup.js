#!/usr/bin/env node

/**
 * Setup script for FAMAPP Mobile
 * This script helps configure Firebase and dependencies
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  const statusColor = exists ? COLORS.green : COLORS.red;
  
  log(`${status} ${description}`, statusColor);
  
  if (!exists) {
    log(`   Missing: ${filePath}`, COLORS.dim);
  }
  
  return exists;
}

function main() {
  log('\n🚀 FAMAPP Mobile Setup Check\n', COLORS.bright);
  
  // Check Firebase configuration files
  log('📱 Firebase Configuration:', COLORS.cyan);
  const iosFirebase = checkFile(
    path.join(__dirname, 'ios/FAMAPPMobile/GoogleService-Info.plist'),
    'iOS GoogleService-Info.plist'
  );
  
  const androidFirebase = checkFile(
    path.join(__dirname, 'android/app/google-services.json'),
    'Android google-services.json'
  );
  
  // Check if files are templates (contain placeholder text)
  if (iosFirebase) {
    const iosContent = fs.readFileSync(
      path.join(__dirname, 'ios/FAMAPPMobile/GoogleService-Info.plist'),
      'utf8'
    );
    if (iosContent.includes('YOUR_CLIENT_ID_HERE')) {
      log('   ⚠️  iOS Firebase config is still a template', COLORS.yellow);
    } else {
      log('   ✅ iOS Firebase config looks good', COLORS.green);
    }
  }
  
  if (androidFirebase) {
    const androidContent = fs.readFileSync(
      path.join(__dirname, 'android/app/google-services.json'),
      'utf8'
    );
    if (androidContent.includes('YOUR_PROJECT_ID_HERE')) {
      log('   ⚠️  Android Firebase config is still a template', COLORS.yellow);
    } else {
      log('   ✅ Android Firebase config looks good', COLORS.green);
    }
  }
  
  // Check package.json
  log('\n📦 Dependencies:', COLORS.cyan);
  const packageJsonExists = checkFile(
    path.join(__dirname, 'package.json'),
    'package.json'
  );
  
  // Check if node_modules exists
  const nodeModulesExists = checkFile(
    path.join(__dirname, 'node_modules'),
    'node_modules directory'
  );
  
  // Instructions
  log('\n📋 Next Steps:', COLORS.magenta);
  
  if (!iosFirebase || !androidFirebase) {
    log('1. Complete Firebase Setup:', COLORS.bright);
    log('   • Go to Firebase Console: https://console.firebase.google.com/', COLORS.dim);
    log('   • Select your existing FAMAPP project', COLORS.dim);
    log('   • Add iOS and Android apps with bundle ID: com.famapp.mobile', COLORS.dim);
    log('   • Download and replace the template config files', COLORS.dim);
    log('   • See FIREBASE_SETUP.md for detailed instructions', COLORS.dim);
  }
  
  if (!nodeModulesExists) {
    log('2. Install Dependencies:', COLORS.bright);
    log('   cd packages/mobile && yarn install', COLORS.dim);
  }
  
  if (iosFirebase && nodeModulesExists) {
    log('3. Install iOS Pods:', COLORS.bright);
    log('   cd packages/mobile/ios && pod install', COLORS.dim);
  }
  
  log('4. Start Development:', COLORS.bright);
  log('   yarn start    # Start Metro bundler', COLORS.dim);
  log('   yarn ios      # Run on iOS simulator', COLORS.dim);
  log('   yarn android  # Run on Android emulator', COLORS.dim);
  
  // Summary
  const allGood = iosFirebase && androidFirebase && packageJsonExists && nodeModulesExists;
  
  log(`\n${allGood ? '🎉' : '⚠️'} Setup Status:`, COLORS.bright);
  if (allGood) {
    log('   All dependencies and configuration files are ready!', COLORS.green);
    log('   You can now run the mobile app.', COLORS.green);
  } else {
    log('   Some setup steps are still needed.', COLORS.yellow);
    log('   Please complete the steps above and run this script again.', COLORS.yellow);
  }
  
  log('\n📚 Documentation:', COLORS.cyan);
  log('   • FIREBASE_SETUP.md - Complete Firebase setup guide', COLORS.dim);
  log('   • README.md - General project information', COLORS.dim);
  log('   • https://rnfirebase.io/ - React Native Firebase docs', COLORS.dim);
  
  log('');
}

if (require.main === module) {
  main();
}

module.exports = { main };