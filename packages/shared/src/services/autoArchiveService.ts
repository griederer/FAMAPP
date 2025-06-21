// Auto-archive service for completed todos - shared between web and mobile
import { todoService } from './todoService';

class AutoArchiveService {
  private intervalId: any = null; // Platform-agnostic timer ID type
  private readonly ARCHIVE_INTERVAL_HOURS = 6; // Check every 6 hours
  private isRunning = false;

  /**
   * Start the auto-archive service
   * This will run in the background and archive completed todos older than 3 days
   */
  start(): void {
    if (this.isRunning) {
      console.log('Auto-archive service is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting auto-archive service');

    // Run immediately on start
    this.runArchiveCheck();

    // Set up interval to run every 6 hours
    this.intervalId = setInterval(() => {
      this.runArchiveCheck();
    }, this.ARCHIVE_INTERVAL_HOURS * 60 * 60 * 1000);
  }

  /**
   * Stop the auto-archive service
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Auto-archive service stopped');
  }

  /**
   * Manually trigger an archive check
   */
  async runArchiveCheck(): Promise<void> {
    try {
      console.log('Running auto-archive check...');
      const archivedCount = await todoService.autoArchiveCompleted();
      
      if (archivedCount > 0) {
        console.log(`Auto-archived ${archivedCount} completed todos`);
      } else {
        console.log('No todos were archived (none were older than 3 days)');
      }
    } catch (error) {
      console.error('Error during auto-archive check:', error);
    }
  }

  /**
   * Get the current status of the service
   */
  getStatus(): { isRunning: boolean; intervalHours: number } {
    return {
      isRunning: this.isRunning,
      intervalHours: this.ARCHIVE_INTERVAL_HOURS,
    };
  }
}

export const autoArchiveService = new AutoArchiveService();