// Test utilities for Dashboard components
import React from 'react';
import { render } from '@testing-library/react';
import { I18nProvider } from '../../../context/I18nContext';

// Test wrapper with providers
export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <I18nProvider defaultLanguage="en">
      {ui}
    </I18nProvider>
  );
}

export * from '@testing-library/react';