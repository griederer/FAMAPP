#!/bin/bash

# FAMAPP Development Helper Script
# This script provides shortcuts for common development tasks

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

usage() {
    echo -e "${PURPLE}FAMAPP Development Helper${NC}"
    echo ""
    echo -e "${CYAN}Usage:${NC} $0 <command>"
    echo ""
    echo -e "${CYAN}Commands:${NC}"
    echo "  web              Start web development server"
    echo "  mobile           Start mobile Metro bundler"
    echo "  ios              Start iOS app (requires macOS)"
    echo "  android          Start Android app"
    echo "  test             Run all tests"
    echo "  test:web         Run web tests only"
    echo "  test:mobile      Run mobile tests only"
    echo "  lint             Run linting for all packages"
    echo "  build            Build all packages"
    echo "  clean            Clean all node_modules and build artifacts"
    echo "  reset            Reset and reinstall everything"
    echo "  firebase-check   Check Firebase configuration"
    echo "  help             Show this help message"
    echo ""
    echo -e "${CYAN}Examples:${NC}"
    echo "  $0 web           # Start web dev server"
    echo "  $0 ios           # Start iOS simulator"
    echo "  $0 test          # Run full test suite"
    echo ""
}

check_root_dir() {
    if [[ ! -f "$ROOT_DIR/package.json" ]]; then
        error "Must be run from FAMAPP monorepo root"
        exit 1
    fi
}

start_web() {
    log "Starting web development server..."
    cd "$ROOT_DIR"
    yarn web:dev
}

start_mobile() {
    log "Starting mobile Metro bundler..."
    cd "$ROOT_DIR"
    yarn mobile:start
}

start_ios() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        error "iOS development requires macOS"
        exit 1
    fi
    
    log "Starting iOS app..."
    cd "$ROOT_DIR"
    yarn mobile:ios
}

start_android() {
    log "Starting Android app..."
    cd "$ROOT_DIR"
    yarn mobile:android
}

run_tests() {
    log "Running all tests..."
    cd "$ROOT_DIR"
    yarn test
}

run_web_tests() {
    log "Running web tests..."
    cd "$ROOT_DIR"
    yarn test:web
}

run_mobile_tests() {
    log "Running mobile tests..."
    cd "$ROOT_DIR"
    yarn test:mobile
}

run_lint() {
    log "Running linting for all packages..."
    cd "$ROOT_DIR"
    
    # Lint shared package
    log "Linting shared package..."
    cd "$ROOT_DIR/packages/shared"
    yarn lint || true
    
    # Lint web package
    log "Linting web package..."
    cd "$ROOT_DIR/packages/web"
    yarn lint || true
    
    # Lint mobile package
    log "Linting mobile package..."
    cd "$ROOT_DIR/packages/mobile"
    yarn lint || true
    
    log "Linting completed"
}

build_all() {
    log "Building all packages..."
    cd "$ROOT_DIR"
    
    # Build shared first
    log "Building shared package..."
    cd "$ROOT_DIR/packages/shared"
    yarn build
    
    # Build web
    log "Building web package..."
    cd "$ROOT_DIR/packages/web"
    yarn build
    
    log "Build completed"
}

clean_all() {
    log "Cleaning all packages..."
    
    # Remove all node_modules
    find "$ROOT_DIR" -name "node_modules" -type d -exec rm -rf {} +
    
    # Remove build artifacts
    rm -rf "$ROOT_DIR/packages/shared/dist"
    rm -rf "$ROOT_DIR/packages/web/dist"
    rm -rf "$ROOT_DIR/packages/mobile/ios/build"
    rm -rf "$ROOT_DIR/packages/mobile/android/build"
    
    # Remove iOS Pods
    if [[ -d "$ROOT_DIR/packages/mobile/ios/Pods" ]]; then
        rm -rf "$ROOT_DIR/packages/mobile/ios/Pods"
        rm -f "$ROOT_DIR/packages/mobile/ios/Podfile.lock"
    fi
    
    log "Clean completed"
}

reset_all() {
    log "Resetting entire monorepo..."
    
    clean_all
    
    log "Reinstalling dependencies..."
    cd "$ROOT_DIR"
    yarn install
    
    # Reinstall pods if on macOS
    if [[ "$OSTYPE" == "darwin"* ]] && command -v pod &> /dev/null; then
        log "Reinstalling iOS pods..."
        cd "$ROOT_DIR/packages/mobile/ios"
        pod install
    fi
    
    # Rebuild shared package
    log "Rebuilding shared package..."
    cd "$ROOT_DIR/packages/shared"
    yarn build
    
    log "Reset completed"
}

check_firebase() {
    log "Checking Firebase configuration..."
    cd "$ROOT_DIR/packages/mobile"
    
    if [[ -f "setup.js" ]]; then
        node setup.js
    else
        error "Firebase setup script not found"
    fi
}

# Main command handler
case "${1:-help}" in
    "web")
        check_root_dir
        start_web
        ;;
    "mobile")
        check_root_dir
        start_mobile
        ;;
    "ios")
        check_root_dir
        start_ios
        ;;
    "android")
        check_root_dir
        start_android
        ;;
    "test")
        check_root_dir
        run_tests
        ;;
    "test:web")
        check_root_dir
        run_web_tests
        ;;
    "test:mobile")
        check_root_dir
        run_mobile_tests
        ;;
    "lint")
        check_root_dir
        run_lint
        ;;
    "build")
        check_root_dir
        build_all
        ;;
    "clean")
        check_root_dir
        clean_all
        ;;
    "reset")
        check_root_dir
        reset_all
        ;;
    "firebase-check")
        check_root_dir
        check_firebase
        ;;
    "help"|*)
        usage
        ;;
esac