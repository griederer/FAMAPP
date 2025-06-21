// App initialization utilities
import { userWhitelistService } from '@famapp/shared';
import { updateWhitelistWithCorrectEmails } from './updateWhitelist';

/**
 * Initialize the application with required configurations
 */
export async function initializeApp(): Promise<void> {
  try {
    console.log('Initializing FAMAPP...');
    
    // Initialize the user whitelist
    await userWhitelistService.initializeWhitelist();
    
    // Try to update whitelist with correct emails (non-critical)
    try {
      await updateWhitelistWithCorrectEmails();
      console.log('✅ Whitelist updated successfully');
    } catch (updateError) {
      console.warn('⚠️ Could not update whitelist (this is normal for non-admin users):', updateError);
      // Don't throw - this is not critical for app functionality
    }
    
    console.log('FAMAPP initialization complete');
  } catch (error) {
    console.error('Error initializing FAMAPP:', error);
    throw error;
  }
}

/**
 * Check if app is properly initialized
 */
export async function checkAppInitialization(): Promise<boolean> {
  try {
    const whitelist = await userWhitelistService.getWhitelist();
    return whitelist !== null;
  } catch (error) {
    console.error('Error checking app initialization:', error);
    return false;
  }
}