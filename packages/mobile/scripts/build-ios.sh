#!/bin/bash

# iOS Build Script for FAMAPP Mobile
# This script builds the iOS app for different configurations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(dirname "$SCRIPT_DIR")"
IOS_DIR="$MOBILE_DIR/ios"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -c, --configuration   Build configuration (Debug|Release) [default: Release]"
    echo "  -s, --scheme          Xcode scheme [default: FAMAPPMobile]"
    echo "  -d, --destination     Build destination (simulator|device) [default: device]"
    echo "  -a, --archive         Create archive for App Store distribution"
    echo "  -e, --export          Export archive (requires --archive)"
    echo "  -o, --output          Output directory for exports [default: ./build]"
    echo "  -h, --help            Show this help"
    echo ""
    echo "Examples:"
    echo "  $0                              # Release build for device"
    echo "  $0 -c Debug -d simulator        # Debug build for simulator"
    echo "  $0 -a -e                        # Archive and export for App Store"
}

# Default values
CONFIGURATION="Release"
SCHEME="FAMAPPMobile"
DESTINATION="device"
ARCHIVE=false
EXPORT=false
OUTPUT_DIR="$MOBILE_DIR/build"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--configuration)
            CONFIGURATION="$2"
            shift 2
            ;;
        -s|--scheme)
            SCHEME="$2"
            shift 2
            ;;
        -d|--destination)
            DESTINATION="$2"
            shift 2
            ;;
        -a|--archive)
            ARCHIVE=true
            shift
            ;;
        -e|--export)
            EXPORT=true
            shift
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
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

# Validate configuration
if [[ "$CONFIGURATION" != "Debug" && "$CONFIGURATION" != "Release" ]]; then
    error "Invalid configuration: $CONFIGURATION. Must be Debug or Release."
    exit 1
fi

# Validate destination
if [[ "$DESTINATION" != "simulator" && "$DESTINATION" != "device" ]]; then
    error "Invalid destination: $DESTINATION. Must be simulator or device."
    exit 1
fi

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    error "iOS builds require macOS"
    exit 1
fi

# Check for Xcode
if ! command -v xcodebuild &> /dev/null; then
    error "Xcode is not installed or xcodebuild is not in PATH"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

step "Building iOS app with configuration: $CONFIGURATION"
log "Scheme: $SCHEME"
log "Destination: $DESTINATION"
log "Output: $OUTPUT_DIR"

# Navigate to iOS directory
cd "$IOS_DIR"

# Install pods if needed
if [[ ! -d "Pods" || "Podfile" -nt "Podfile.lock" ]]; then
    step "Installing CocoaPods dependencies..."
    pod install
fi

# Set destination string for xcodebuild
if [[ "$DESTINATION" == "simulator" ]]; then
    DESTINATION_STRING="platform=iOS Simulator,name=iPhone 14"
else
    DESTINATION_STRING="generic/platform=iOS"
fi

# Build the project
if [[ "$ARCHIVE" == true ]]; then
    step "Creating archive..."
    ARCHIVE_PATH="$OUTPUT_DIR/FAMAPPMobile.xcarchive"
    
    xcodebuild archive \
        -workspace FAMAPPMobile.xcworkspace \
        -scheme "$SCHEME" \
        -configuration "$CONFIGURATION" \
        -archivePath "$ARCHIVE_PATH" \
        -destination "$DESTINATION_STRING" \
        CODE_SIGNING_REQUIRED=NO \
        CODE_SIGNING_ALLOWED=NO \
        | xcpretty || true
    
    if [[ "$EXPORT" == true ]]; then
        step "Exporting archive..."
        
        # Create export options plist
        EXPORT_OPTIONS="$OUTPUT_DIR/ExportOptions.plist"
        cat > "$EXPORT_OPTIONS" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>
EOF
        
        xcodebuild -exportArchive \
            -archivePath "$ARCHIVE_PATH" \
            -exportPath "$OUTPUT_DIR" \
            -exportOptionsPlist "$EXPORT_OPTIONS" \
            | xcpretty || true
    fi
else
    step "Building project..."
    
    xcodebuild build \
        -workspace FAMAPPMobile.xcworkspace \
        -scheme "$SCHEME" \
        -configuration "$CONFIGURATION" \
        -destination "$DESTINATION_STRING" \
        CONFIGURATION_BUILD_DIR="$OUTPUT_DIR" \
        | xcpretty || true
fi

# Check build result
if [[ $? -eq 0 ]]; then
    echo ""
    echo -e "${GREEN}✅ Build completed successfully!${NC}"
    echo ""
    echo "Build artifacts location: $OUTPUT_DIR"
    
    if [[ "$ARCHIVE" == true ]]; then
        echo "Archive location: $OUTPUT_DIR/FAMAPPMobile.xcarchive"
        
        if [[ "$EXPORT" == true ]]; then
            echo "Exported IPA location: $OUTPUT_DIR/"
        fi
    fi
    
    echo ""
    echo "Next steps:"
    if [[ "$ARCHIVE" == true && "$EXPORT" == true ]]; then
        echo "• Upload the exported IPA to App Store Connect"
        echo "• Submit for App Store review"
    elif [[ "$ARCHIVE" == true ]]; then
        echo "• Run with --export flag to export IPA"
        echo "• Or open archive in Xcode for distribution"
    else
        echo "• Install on device/simulator for testing"
        echo "• Run with --archive flag for App Store distribution"
    fi
else
    error "Build failed!"
    exit 1
fi