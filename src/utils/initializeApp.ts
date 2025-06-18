// App initialization utilities
import { userWhitelistService } from '../services/userWhitelistService';

/**
 * Initialize the application with required configurations
 */
export async function initializeApp(): Promise<void> {
  try {
    console.log('Initializing FAMAPP...');
    
    // Initialize the user whitelist
    await userWhitelistService.initializeWhitelist();
    
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