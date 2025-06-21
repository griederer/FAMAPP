#!/bin/bash

# Mobile Development Helper Script
# Specific tools for React Native development

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

usage() {
    echo -e "${CYAN}Mobile Development Helper${NC}"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  start           Start Metro bundler"
    echo "  ios             Run iOS app"
    echo "  android         Run Android app"
    echo "  test            Run mobile tests"
    echo "  lint            Run mobile linting"
    echo "  pods            Install/update iOS pods"
    echo "  clean           Clean React Native cache"
    echo "  reset           Reset and clean everything"
    echo "  device-ios      Run on connected iOS device"
    echo "  device-android  Run on connected Android device"
    echo "  firebase        Check Firebase setup"
    echo "  logs-ios        View iOS logs"
    echo "  logs-android    View Android logs"
    echo "  help            Show this help"
    echo ""
}

start_metro() {
    log "Starting Metro bundler..."
    cd "$MOBILE_DIR"
    yarn start
}

run_ios() {
    log "Running iOS app..."
    cd "$MOBILE_DIR"
    
    # Check if iOS simulator is available
    if [[ "$OSTYPE" != "darwin"* ]]; then
        error "iOS development requires macOS"
        exit 1
    fi
    
    yarn ios
}

run_android() {
    log "Running Android app..."
    cd "$MOBILE_DIR"
    yarn android
}

run_tests() {
    log "Running mobile tests..."
    cd "$MOBILE_DIR"
    yarn test
}

run_lint() {
    log "Running mobile linting..."
    cd "$MOBILE_DIR"
    yarn lint
}

install_pods() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        warn "CocoaPods is only available on macOS"
        return
    fi
    
    log "Installing/updating iOS pods..."
    cd "$MOBILE_DIR/ios"
    pod install --repo-update
    log "Pods installation completed"
}

clean_cache() {
    log "Cleaning React Native cache..."
    cd "$MOBILE_DIR"
    
    # Clean Metro cache
    yarn start --reset-cache &
    METRO_PID=$!
    sleep 2
    kill $METRO_PID 2>/dev/null || true
    
    # Clean Watchman cache
    if command -v watchman &> /dev/null; then
        watchman watch-del-all
    fi
    
    # Clean npm/yarn cache
    yarn cache clean
    
    # Clean Android build
    if [[ -d "android" ]]; then
        cd android
        ./gradlew clean || true
        cd ..
    fi
    
    # Clean iOS build
    if [[ -d "ios" && "$OSTYPE" == "darwin"* ]]; then
        cd ios
        rm -rf build/
        cd ..
    fi
    
    log "Cache cleaning completed"
}

reset_mobile() {
    log "Resetting mobile environment..."
    
    clean_cache
    
    # Remove node_modules
    rm -rf node_modules
    
    # Remove iOS Pods
    if [[ -d "ios/Pods" ]]; then
        rm -rf ios/Pods
        rm -f ios/Podfile.lock
    fi
    
    # Reinstall dependencies
    log "Reinstalling dependencies..."
    yarn install
    
    # Reinstall pods
    if [[ "$OSTYPE" == "darwin"* ]]; then
        install_pods
    fi
    
    log "Reset completed"
}

run_device_ios() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        error "iOS development requires macOS"
        exit 1
    fi
    
    log "Running on connected iOS device..."
    cd "$MOBILE_DIR"
    yarn ios --device
}

run_device_android() {
    log "Running on connected Android device..."
    cd "$MOBILE_DIR"
    
    # Check if device is connected
    if ! command -v adb &> /dev/null; then
        error "Android Debug Bridge (adb) not found. Install Android SDK."
        exit 1
    fi
    
    DEVICES=$(adb devices | grep -v "List of devices" | grep "device$" | wc -l)
    if [[ $DEVICES -eq 0 ]]; then
        error "No Android devices connected. Connect a device and enable USB debugging."
        exit 1
    fi
    
    yarn android --deviceId $(adb devices | grep "device$" | head -1 | cut -f1)
}

check_firebase() {
    log "Checking Firebase configuration..."
    cd "$MOBILE_DIR"
    
    if [[ -f "setup.js" ]]; then
        node setup.js
    else
        error "Firebase setup script not found"
    fi
}

view_ios_logs() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        error "iOS logs viewing requires macOS"
        exit 1
    fi
    
    log "Viewing iOS logs (Press Ctrl+C to stop)..."
    xcrun simctl spawn booted log stream --predicate 'processImagePath endswith "FAMAPPMobile"'
}

view_android_logs() {
    if ! command -v adb &> /dev/null; then
        error "Android Debug Bridge (adb) not found"
        exit 1
    fi
    
    log "Viewing Android logs (Press Ctrl+C to stop)..."
    adb logcat | grep -E "(ReactNativeJS|FAMAPPMobile)"
}

# Main command handler
case "${1:-help}" in
    "start")
        start_metro
        ;;
    "ios")
        run_ios
        ;;
    "android")
        run_android
        ;;
    "test")
        run_tests
        ;;
    "lint")
        run_lint
        ;;
    "pods")
        install_pods
        ;;
    "clean")
        clean_cache
        ;;
    "reset")
        reset_mobile
        ;;
    "device-ios")
        run_device_ios
        ;;
    "device-android")
        run_device_android
        ;;
    "firebase")
        check_firebase
        ;;
    "logs-ios")
        view_ios_logs
        ;;
    "logs-android")
        view_android_logs
        ;;
    "help"|*)
        usage
        ;;
esac