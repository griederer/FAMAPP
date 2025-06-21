// Script to update the whitelist with correct email addresses
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { WhitelistConfig } from '@famapp/shared';

export async function updateWhitelistWithCorrectEmails(): Promise<void> {
  const whitelistRef = doc(db, 'config', 'family-whitelist');
  
  const updatedConfig: WhitelistConfig = {
    version: '1.1.0',
    updatedAt: new Date(),
    updatedBy: 'system-update',
    authorizedUsers: [
      {
        email: 'riederer@gmail.com',
        familyMember: 'gonzalo',
        isActive: true,
        addedAt: new Date(),
        addedBy: 'system'
      },
      {
        email: 'mpazmoralesbarra@gmail.com',
        familyMember: 'mpaz',
        isActive: true,
        addedAt: new Date(),
        addedBy: 'system'
      },
      {
        email: 'borja@example.com', // TODO: Replace with actual email when available
        familyMember: 'borja',
        isActive: true,
        addedAt: new Date(),
        addedBy: 'system'
      },
      {
        email: 'melody@example.com', // TODO: Replace with actual email when available
        familyMember: 'melody',
        isActive: true,
        addedAt: new Date(),
        addedBy: 'system'
      }
    ]
  };

  try {
    await setDoc(whitelistRef, updatedConfig);
    console.log('✅ Whitelist updated successfully with correct emails');
  } catch (error) {
    console.error('❌ Error updating whitelist:', error);
    throw error;
  }
}