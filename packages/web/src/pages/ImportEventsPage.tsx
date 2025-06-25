import React from 'react';
import { CraighouseEventImporter } from '../components/utils/CraighouseEventImporter';

export function ImportEventsPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <CraighouseEventImporter />
      </div>
    </div>
  );
}