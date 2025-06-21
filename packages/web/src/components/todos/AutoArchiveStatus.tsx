// Auto-archive status and control component
import { useState } from 'react';
import { cn } from '../../styles/components';
import { Button } from '../ui';
import { autoArchiveService } from '@famapp/shared';

export interface AutoArchiveStatusProps {
  className?: string;
}

export const AutoArchiveStatus = ({ className }: AutoArchiveStatusProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const handleManualArchive = async () => {
    setIsRunning(true);
    try {
      await autoArchiveService.runArchiveCheck();
      setLastRun(new Date());
    } catch (error) {
      console.error('Failed to run manual archive:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const status = autoArchiveService.getStatus();

  return (
    <div className={cn('bg-gray-50 rounded-xl p-4 border border-gray-200', className)}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-gray-900">
            Auto-Archive Settings
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            Automatically archives completed todos after 3 days
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-2 h-2 rounded-full',
            status.isRunning ? 'bg-success-500' : 'bg-gray-400'
          )} />
          <span className="text-xs text-gray-600">
            {status.isRunning ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {lastRun ? (
            <>Last run: {lastRun.toLocaleTimeString()}</>
          ) : (
            <>Checks every {status.intervalHours} hours</>
          )}
        </div>
        <Button
          onClick={handleManualArchive}
          variant="secondary"
          size="sm"
          loading={isRunning}
          disabled={!status.isRunning}
          className="text-xs"
        >
          Run Now
        </Button>
      </div>
    </div>
  );
};