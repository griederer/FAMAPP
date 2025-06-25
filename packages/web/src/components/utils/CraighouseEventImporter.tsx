import React, { useState } from 'react';
import { addCraighouseSchoolEvents, getCraighouseSchoolEventsList } from '../../utils/addCraighouseSchoolEvents';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export function CraighouseEventImporter() {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const eventsList = getCraighouseSchoolEventsList();

  const handleImport = async () => {
    try {
      setIsImporting(true);
      setImportResult(null);
      
      const result = await addCraighouseSchoolEvents();
      setImportResult(result);
    } catch (error) {
      setImportResult({
        success: 0,
        failed: eventsList.length,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Craighouse School Calendar Import
          </h2>
          <p className="text-gray-600">
            Import all Craighouse School events for June-July 2025 into the family calendar.
          </p>
        </div>

        {/* Preview Toggle */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="mb-4"
          >
            {showPreview ? 'Hide' : 'Show'} Event Preview ({eventsList.length} events)
          </Button>
        </div>

        {/* Event Preview */}
        {showPreview && (
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <h3 className="font-semibold mb-3">Events to be imported:</h3>
            <div className="space-y-2">
              {eventsList.map((event) => (
                <div key={event.index} className="bg-white p-3 rounded border text-sm">
                  <div className="font-medium text-gray-900">{event.title}</div>
                  <div className="text-gray-600">{event.date}</div>
                  <div className="text-gray-500">{event.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Import Button */}
        <div className="text-center">
          <Button
            onClick={handleImport}
            disabled={isImporting}
            className="px-8 py-3 text-lg"
          >
            {isImporting ? (
              <>
                <LoadingSpinner size="small" className="mr-2" />
                Importing Events...
              </>
            ) : (
              'Import All Events'
            )}
          </Button>
        </div>

        {/* Results */}
        {importResult && (
          <div className="mt-6">
            <div className={`rounded-lg p-4 ${
              importResult.failed === 0 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <h3 className="font-semibold mb-2">Import Results</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Successfully imported:</span>
                  <span className="font-medium text-green-600">{importResult.success} events</span>
                </div>
                {importResult.failed > 0 && (
                  <div className="flex justify-between">
                    <span>Failed to import:</span>
                    <span className="font-medium text-red-600">{importResult.failed} events</span>
                  </div>
                )}
              </div>
              
              {importResult.errors.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-medium text-red-700 mb-1">Errors:</h4>
                  <div className="bg-red-50 rounded p-2 max-h-32 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-gray-500 bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
          <ul className="list-disc pl-5 space-y-1 text-blue-800">
            <li>Make sure you are signed in to your Firebase account</li>
            <li>This will add {eventsList.length} events to the 'events' collection in Firestore</li>
            <li>All events are assigned to 'borja' and marked as school calendar imports</li>
            <li>Events include proper dates, times, colors, and categories</li>
            <li>You can run this import multiple times safely (it will create duplicate events)</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}