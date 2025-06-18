# User Whitelist System

## Overview
The User Whitelist System manages authorized family members who can access FAMAPP. It uses a centralized Firestore configuration document to store and manage user permissions.

## How It Works

### 1. Whitelist Storage
- **Collection**: `config`
- **Document ID**: `family-whitelist`
- **Structure**:
```typescript
{
  version: string;
  updatedAt: Date;
  updatedBy: string;
  authorizedUsers: [
    {
      email: string;
      familyMember: 'Gonzalo' | 'Mpaz' | 'Borja' | 'Melody';
      isActive: boolean;
      addedAt: Date;
      addedBy: string;
    }
  ]
}
```

### 2. Automatic Initialization
When the app starts, it automatically initializes the whitelist with default family members:
- `gonzalo@example.com` → Gonzalo
- `mpaz@example.com` → Mpaz
- `borja@example.com` → Borja
- `melody@example.com` → Melody

**⚠️ Important**: Replace these placeholder emails with actual family member email addresses.

### 3. Authentication Flow
1. User signs in with Google
2. System checks if email exists in whitelist with `isActive: true`
3. If authorized, user gains access; if not, sign-in is rejected

### 4. Security Rules
Firestore security rules use the whitelist to control access:
```javascript
function isAuthorizedUserByWhitelist(email) {
  let whitelist = get(/databases/$(database)/documents/config/family-whitelist);
  let authorizedUsers = whitelist.data.authorizedUsers;
  
  return authorizedUsers != null && 
         authorizedUsers.hasAny([{'email': email, 'isActive': true}]);
}
```

## Configuration Required

### 1. Update Email Addresses
Replace placeholder emails in:

**File**: `src/services/userWhitelistService.ts`
```typescript
authorizedUsers: [
  {
    email: 'gonzalo@actual-email.com', // ← Replace
    familyMember: 'Gonzalo',
    isActive: true,
    addedAt: new Date(),
    addedBy: 'system'
  },
  // ... other family members
]
```

**File**: `firestore.rules` (fallback function)
```javascript
function isAuthorizedUserFallback(email) {
  return email in [
    'gonzalo@actual-email.com', // ← Replace
    'mpaz@actual-email.com',    // ← Replace
    'borja@actual-email.com',   // ← Replace
    'melody@actual-email.com'   // ← Replace
  ];
}
```

### 2. Deploy Security Rules
After updating emails, deploy the rules:
```bash
npx firebase deploy --only firestore:rules
```

## API Reference

### UserWhitelistService Methods

#### `isEmailAuthorized(email: string): Promise<boolean>`
Check if an email is authorized to access the app.

#### `getFamilyMemberFromEmail(email: string): Promise<FamilyMember | null>`
Get the family member name associated with an email.

#### `initializeWhitelist(): Promise<void>`
Initialize the whitelist with default family members (if not exists).

#### `addAuthorizedUser(email, familyMember, addedBy): Promise<boolean>`
Add a new authorized user (admin function).

#### `deactivateUser(email, deactivatedBy): Promise<boolean>`
Deactivate a user without removing them (admin function).

#### `updateUserFamilyMember(email, newFamilyMember, updatedBy): Promise<boolean>`
Update a user's family member assignment.

#### `getAllAuthorizedUsers(): Promise<AuthorizedUser[]>`
Get all authorized users (admin function).

## Admin Functions

For future admin features, the service includes methods to:
- Add new family members
- Deactivate users
- Update family member assignments
- View all authorized users

## Security Features

1. **Email Validation**: All emails are stored in lowercase for consistency
2. **Active Status**: Users can be deactivated without removal
3. **Audit Trail**: Tracks who added/modified users and when
4. **Firestore Rules**: Server-side validation using the whitelist
5. **Fallback Protection**: Fallback emails for initial setup

## Troubleshooting

### Common Issues

1. **User can't sign in**: 
   - Check if email is in whitelist with `isActive: true`
   - Verify email spelling matches exactly
   - Check Firestore security rules are deployed

2. **Whitelist not initializing**:
   - Check Firebase permissions
   - Verify Firestore is enabled
   - Check browser console for errors

3. **Security rules failing**:
   - Ensure whitelist document exists
   - Verify rule syntax is correct
   - Check Firebase logs for rule errors

### Debugging Commands

Check whitelist in browser console:
```javascript
// In browser developer tools
import { userWhitelistService } from './services/userWhitelistService';
userWhitelistService.getWhitelist().then(console.log);
```

## Future Enhancements

- Web-based admin interface for managing users
- Email invitation system
- Role-based permissions (admin vs. regular family member)
- Integration with family member profile pictures
- Activity logging for whitelist changes