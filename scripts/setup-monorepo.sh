#!/bin/bash

# FAMAPP Monorepo Setup Script
# This script sets up the entire monorepo for development

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if we're in the right directory
if [[ ! -f "$ROOT_DIR/package.json" ]]; then
    error "This script must be run from the root of the FAMAPP monorepo"
    exit 1
fi

step "🚀 Setting up FAMAPP Monorepo..."

# Check for required tools
check_dependencies() {
    step "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $NODE_VERSION -lt 16 ]]; then
        error "Node.js version 16+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check Yarn
    if ! command -v yarn &> /dev/null; then
        warn "Yarn is not installed. Installing yarn..."
        npm install -g yarn
    fi
    
    # Check if we're on macOS for iOS development
    if [[ "$OSTYPE" == "darwin"* ]]; then
        log "macOS detected - iOS development available"
        
        # Check Xcode
        if ! command -v xcodebuild &> /dev/null; then
            warn "Xcode is not installed. iOS development requires Xcode."
            warn "Install from App Store: https://apps.apple.com/app/xcode/id497799835"
        fi
        
        # Check CocoaPods
        if ! command -v pod &> /dev/null; then
            warn "CocoaPods is not installed. Installing..."
            sudo gem install cocoapods
        fi
    else
        log "Non-macOS system - Android development available"
    fi
    
    # Check Android Studio (optional)
    if [[ -d "/Applications/Android Studio.app" ]] || [[ -d "$HOME/android-studio" ]]; then
        log "Android Studio detected"
    else
        warn "Android Studio not found. For Android development, install from:"
        warn "https://developer.android.com/studio"
    fi
    
    success "Dependencies check completed"
}

# Install root dependencies
install_root_dependencies() {
    step "Installing root dependencies..."
    cd "$ROOT_DIR"
    yarn install
    success "Root dependencies installed"
}

# Install workspace dependencies
install_workspace_dependencies() {
    step "Installing workspace dependencies..."
    
    # Install shared package dependencies
    log "Installing shared package dependencies..."
    cd "$ROOT_DIR/packages/shared"
    yarn install
    
    # Install web package dependencies
    log "Installing web package dependencies..."
    cd "$ROOT_DIR/packages/web"
    yarn install
    
    # Install mobile package dependencies
    log "Installing mobile package dependencies..."
    cd "$ROOT_DIR/packages/mobile"
    yarn install
    
    success "Workspace dependencies installed"
}

# Setup iOS if on macOS
setup_ios() {
    if [[ "$OSTYPE" == "darwin"* ]] && command -v pod &> /dev/null; then
        step "Setting up iOS development..."
        cd "$ROOT_DIR/packages/mobile/ios"
        
        # Install CocoaPods dependencies
        log "Installing CocoaPods dependencies..."
        pod install --repo-update
        
        success "iOS setup completed"
    else
        warn "Skipping iOS setup (not on macOS or CocoaPods not available)"
    fi
}

# Run Firebase setup check
check_firebase_setup() {
    step "Checking Firebase configuration..."
    cd "$ROOT_DIR/packages/mobile"
    
    if [[ -f "setup.js" ]]; then
        node setup.js
    else
        warn "Firebase setup script not found"
    fi
}

# Build shared package
build_shared() {
    step "Building shared package..."
    cd "$ROOT_DIR/packages/shared"
    yarn build
    success "Shared package built"
}

# Verify web app
verify_web() {
    step "Verifying web app..."
    cd "$ROOT_DIR/packages/web"
    
    # Type check
    log "Running TypeScript check..."
    yarn type-check || warn "TypeScript check failed - please review"
    
    # Lint check
    log "Running lint check..."
    yarn lint || warn "Lint check failed - please review"
    
    success "Web app verification completed"
}

# Main setup flow
main() {
    echo -e "${PURPLE}"
    echo "╔═══════════════════════════════════════════════════════════════════════════╗"
    echo "║                           FAMAPP MONOREPO SETUP                          ║"
    echo "║                                                                           ║"
    echo "║  This script will set up the entire FAMAPP monorepo for development      ║"
    echo "║  including web and mobile packages with shared dependencies.             ║"
    echo "╚═══════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_dependencies
    install_root_dependencies
    install_workspace_dependencies
    build_shared
    setup_ios
    verify_web
    check_firebase_setup
    
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                            SETUP COMPLETE! 🎉                            ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo ""
    echo -e "${YELLOW}📱 For Mobile Development:${NC}"
    echo "   1. Complete Firebase setup (see packages/mobile/FIREBASE_SETUP.md)"
    echo "   2. yarn mobile:start    # Start Metro bundler"
    echo "   3. yarn mobile:ios      # Run iOS app"
    echo "   4. yarn mobile:android  # Run Android app"
    echo ""
    echo -e "${YELLOW}🌐 For Web Development:${NC}"
    echo "   1. yarn web:dev         # Start web development server"
    echo "   2. Open http://localhost:5173"
    echo ""
    echo -e "${YELLOW}🧪 For Testing:${NC}"
    echo "   1. yarn test           # Run all tests"
    echo "   2. yarn test:mobile    # Run mobile tests only"
    echo "   3. yarn test:web       # Run web tests only"
    echo ""
    echo -e "${YELLOW}📚 Documentation:${NC}"
    echo "   • packages/mobile/FIREBASE_SETUP.md - Firebase configuration"
    echo "   • packages/mobile/README.md - Mobile app documentation"
    echo "   • Root README.md - General project information"
    echo ""
}

# Run main function
main "$@"