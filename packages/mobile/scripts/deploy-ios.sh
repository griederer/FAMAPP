#!/bin/bash

# iOS Deployment Script for FAMAPP Mobile
# This script handles the complete deployment pipeline for iOS

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

step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

usage() {
    echo -e "${CYAN}iOS Deployment Script for FAMAPP${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --environment     Target environment (staging|production) [default: staging]"
    echo "  -v, --version         Version number (e.g., 1.0.1)"
    echo "  -b, --build           Build number (auto-increment if not provided)"
    echo "  -s, --skip-tests      Skip running tests"
    echo "  -f, --skip-firebase   Skip Firebase configuration check"
    echo "  -u, --upload          Upload to App Store Connect"
    echo "  -r, --release         Submit for App Store review (requires --upload)"
    echo "  -n, --notes           Release notes file"
    echo "  -h, --help            Show this help"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Deploy to staging"
    echo "  $0 -e production -v 1.0.1            # Deploy version 1.0.1 to production"
    echo "  $0 -e production -u -r               # Deploy and submit for review"
    echo "  $0 -e production -u -n notes.txt     # Deploy with release notes"
}

# Default values
ENVIRONMENT="staging"
VERSION=""
BUILD_NUMBER=""
SKIP_TESTS=false
SKIP_FIREBASE=false
UPLOAD=false
RELEASE=false
RELEASE_NOTES=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -b|--build)
            BUILD_NUMBER="$2"
            shift 2
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -f|--skip-firebase)
            SKIP_FIREBASE=true
            shift
            ;;
        -u|--upload)
            UPLOAD=true
            shift
            ;;
        -r|--release)
            RELEASE=true
            shift
            ;;
        -n|--notes)
            RELEASE_NOTES="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    error "Invalid environment: $ENVIRONMENT. Must be staging or production."
    exit 1
fi

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    error "iOS deployment requires macOS"
    exit 1
fi

# Check dependencies
check_dependencies() {
    step "Checking dependencies..."
    
    # Check Xcode
    if ! command -v xcodebuild &> /dev/null; then
        error "Xcode is not installed or xcodebuild is not in PATH"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi
    
    # Check Yarn
    if ! command -v yarn &> /dev/null; then
        error "Yarn is not installed"
        exit 1
    fi
    
    # Check CocoaPods
    if ! command -v pod &> /dev/null; then
        error "CocoaPods is not installed"
        exit 1
    fi
    
    # Check for fastlane if uploading
    if [[ "$UPLOAD" == true ]] && ! command -v fastlane &> /dev/null; then
        warn "Fastlane is not installed. Upload functionality will be limited."
    fi
    
    success "Dependencies check passed"
}

# Run tests
run_tests() {
    if [[ "$SKIP_TESTS" == true ]]; then
        warn "Skipping tests"
        return
    fi
    
    step "Running tests..."
    cd "$MOBILE_DIR"
    
    # Run unit tests
    yarn test:ci
    
    # Run lint
    yarn lint
    
    # Run type check
    yarn type-check
    
    success "All tests passed"
}

# Check Firebase configuration
check_firebase() {
    if [[ "$SKIP_FIREBASE" == true ]]; then
        warn "Skipping Firebase configuration check"
        return
    fi
    
    step "Checking Firebase configuration..."
    cd "$MOBILE_DIR"
    
    # Run Firebase setup check
    node setup.js
    
    success "Firebase configuration verified"
}

# Update version and build numbers
update_version() {
    step "Updating version information..."
    
    cd "$MOBILE_DIR/ios"
    
    # Get current version if not provided
    if [[ -z "$VERSION" ]]; then
        VERSION=$(xcodebuild -showBuildSettings -target FAMAPPMobile | grep MARKETING_VERSION | awk '{print $3}')
        log "Using current version: $VERSION"
    fi
    
    # Auto-increment build number if not provided
    if [[ -z "$BUILD_NUMBER" ]]; then
        CURRENT_BUILD=$(xcodebuild -showBuildSettings -target FAMAPPMobile | grep CURRENT_PROJECT_VERSION | awk '{print $3}')
        BUILD_NUMBER=$((CURRENT_BUILD + 1))
        log "Auto-incremented build number: $BUILD_NUMBER"
    fi
    
    # Update Info.plist
    /usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $VERSION" FAMAPPMobile/Info.plist
    /usr/libexec/PlistBuddy -c "Set :CFBundleVersion $BUILD_NUMBER" FAMAPPMobile/Info.plist
    
    log "Updated to version $VERSION ($BUILD_NUMBER)"
}

# Build the app
build_app() {
    step "Building iOS app for $ENVIRONMENT..."
    
    cd "$MOBILE_DIR"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        # Build for App Store distribution
        ./scripts/build-ios.sh -c Release -a -e
    else
        # Build for staging/testing
        ./scripts/build-ios.sh -c Release
    fi
    
    success "Build completed"
}

# Upload to App Store Connect
upload_to_app_store() {
    if [[ "$UPLOAD" != true ]]; then
        return
    fi
    
    step "Uploading to App Store Connect..."
    
    # Check if we have an IPA file
    IPA_FILE="$MOBILE_DIR/build/FAMAPPMobile.ipa"
    if [[ ! -f "$IPA_FILE" ]]; then
        error "IPA file not found at $IPA_FILE"
        exit 1
    fi
    
    # Use Application Loader or altool
    if command -v xcrun &> /dev/null; then
        xcrun altool --upload-app \
            --type ios \
            --file "$IPA_FILE" \
            --username "$APPLE_ID" \
            --password "$APP_SPECIFIC_PASSWORD"
    else
        error "xcrun not available. Please upload manually to App Store Connect."
        exit 1
    fi
    
    success "Upload completed"
}

# Submit for review
submit_for_review() {
    if [[ "$RELEASE" != true ]]; then
        return
    fi
    
    step "Submitting for App Store review..."
    
    # This would typically use App Store Connect API or fastlane
    warn "Automatic submission not implemented. Please submit manually in App Store Connect."
    
    echo ""
    echo "Manual submission steps:"
    echo "1. Go to App Store Connect (https://appstoreconnect.apple.com/)"
    echo "2. Navigate to your app"
    echo "3. Select the build you just uploaded"
    echo "4. Fill in app information and submit for review"
}

# Create release notes
create_release_notes() {
    if [[ -z "$RELEASE_NOTES" ]]; then
        return
    fi
    
    step "Processing release notes..."
    
    if [[ -f "$RELEASE_NOTES" ]]; then
        log "Using release notes from: $RELEASE_NOTES"
        # Process release notes file
        # This could be integrated with App Store Connect API
    else
        warn "Release notes file not found: $RELEASE_NOTES"
    fi
}

# Main deployment flow
main() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════════════════╗"
    echo "║                         FAMAPP iOS Deployment                            ║"
    echo "║                                                                           ║"
    echo "║  Environment: $ENVIRONMENT"
    echo "║  Version: ${VERSION:-"auto"}"
    echo "║  Build: ${BUILD_NUMBER:-"auto-increment"}"
    echo "╚═══════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_dependencies
    run_tests
    check_firebase
    update_version
    build_app
    create_release_notes
    upload_to_app_store
    submit_for_review
    
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                        DEPLOYMENT COMPLETE! 🎉                           ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Deployment Summary:${NC}"
    echo "• Environment: $ENVIRONMENT"
    echo "• Version: $VERSION"
    echo "• Build: $BUILD_NUMBER"
    echo "• Upload: $([ "$UPLOAD" == true ] && echo "✅" || echo "❌")"
    echo "• Review Submission: $([ "$RELEASE" == true ] && echo "✅" || echo "❌")"
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    if [[ "$UPLOAD" == true ]]; then
        echo "• Check App Store Connect for processing status"
        echo "• Monitor for any review feedback"
    else
        echo "• Test the built app thoroughly"
        echo "• Run deployment with --upload when ready"
    fi
    
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        echo "• Deploy to production when staging tests pass"
    fi
    
    echo ""
}

# Environment variables check
if [[ "$UPLOAD" == true ]]; then
    if [[ -z "$APPLE_ID" ]]; then
        warn "APPLE_ID environment variable not set. Upload may fail."
    fi
    
    if [[ -z "$APP_SPECIFIC_PASSWORD" ]]; then
        warn "APP_SPECIFIC_PASSWORD environment variable not set. Upload may fail."
    fi
fi

# Run main function
main "$@"