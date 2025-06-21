// Auto-archive service tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { autoArchiveService } from './autoArchiveService';
import { todoService } from './todoService';

// Mock the todoService
vi.mock('./todoService', () => ({
  todoService: {
    autoArchiveCompleted: vi.fn(),
  },
}));

describe('AutoArchiveService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Stop any running service before each test
    autoArchiveService.stop();
  });

  afterEach(() => {
    // Clean up after each test
    autoArchiveService.stop();
  });

  describe('start/stop', () => {
    it('should start the service', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      autoArchiveService.start();
      
      expect(autoArchiveService.getStatus().isRunning).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Starting auto-archive service');
      
      consoleSpy.mockRestore();
    });

    it('should stop the service', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      autoArchiveService.start();
      autoArchiveService.stop();
      
      expect(autoArchiveService.getStatus().isRunning).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Auto-archive service stopped');
      
      consoleSpy.mockRestore();
    });

    it('should not start if already running', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      autoArchiveService.start();
      autoArchiveService.start(); // Try to start again
      
      expect(consoleSpy).toHaveBeenCalledWith('Auto-archive service is already running');
      
      consoleSpy.mockRestore();
    });
  });

  describe('runArchiveCheck', () => {
    it('should call todoService.autoArchiveCompleted', async () => {
      const mockAutoArchive = vi.mocked(todoService.autoArchiveCompleted);
      mockAutoArchive.mockResolvedValue(5);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await autoArchiveService.runArchiveCheck();

      expect(mockAutoArchive).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('Auto-archived 5 completed todos');
      
      consoleSpy.mockRestore();
    });

    it('should log when no todos are archived', async () => {
      const mockAutoArchive = vi.mocked(todoService.autoArchiveCompleted);
      mockAutoArchive.mockResolvedValue(0);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await autoArchiveService.runArchiveCheck();

      expect(consoleSpy).toHaveBeenCalledWith('No todos were archived (none were older than 3 days)');
      
      consoleSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      const mockAutoArchive = vi.mocked(todoService.autoArchiveCompleted);
      mockAutoArchive.mockRejectedValue(new Error('Database error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await autoArchiveService.runArchiveCheck();

      expect(consoleSpy).toHaveBeenCalledWith('Error during auto-archive check:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('getStatus', () => {
    it('should return correct status when running', () => {
      autoArchiveService.start();
      
      const status = autoArchiveService.getStatus();
      
      expect(status.isRunning).toBe(true);
      expect(status.intervalHours).toBe(6);
    });

    it('should return correct status when stopped', () => {
      const status = autoArchiveService.getStatus();
      
      expect(status.isRunning).toBe(false);
      expect(status.intervalHours).toBe(6);
    });
  });
});