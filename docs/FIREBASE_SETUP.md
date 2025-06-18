# Firebase Setup Instructions

## Project Details
- **Project ID**: `famapp-e80ff`
- **Project Number**: `890760804458`
- **Firebase Console**: https://console.firebase.google.com/project/famapp-e80ff

## Required Configuration

To complete the Firebase setup, you need to add the following environment variables:

### 1. Get Firebase Config Values
1. Go to [Firebase Console](https://console.firebase.google.com/project/famapp-e80ff)
2. Click on "Project Settings" (gear icon)
3. Scroll down to "Your apps" section
4. Click "Add app" → "Web" (if no web app exists)
5. Copy the config values

### 2. Update Environment Variables
Copy `.env.example` to `.env.local` and fill in the actual values:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your actual Firebase config:
```env
VITE_FIREBASE_API_KEY=your_actual_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=famapp-e80ff.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=famapp-e80ff.appspot.com
VITE_FIREBASE_APP_ID=your_actual_app_id_here
```

### 3. Update Family Email Addresses
Edit `firestore.rules` and replace the placeholder emails with actual family member emails:

```javascript
function isAuthorizedUser(email) {
  return email in [
    'gonzalo@actual-email.com',    // Replace with Gonzalo's email
    'mpaz@actual-email.com',       // Replace with Mpaz's email
    'borja@actual-email.com',      // Replace with Borja's email
    'melody@actual-email.com'      // Replace with Melody's email
  ];
}
```

### 4. Enable Firebase Services
In Firebase Console, enable:
- ✅ Authentication → Google Sign-in provider
- ✅ Firestore Database
- ✅ Hosting

### 5. Deploy Firestore Rules
```bash
npx firebase deploy --only firestore:rules
npx firebase deploy --only firestore:indexes
```

## Testing Firebase Connection
Run the tests to verify everything is configured correctly:
```bash
npm test src/config/firebase.test.ts
```

## Next Steps
- Configure Google Sign-in in Firebase Console
- Set up authorized domains for authentication
- Test authentication flow with family members