// Test utilities for Dashboard components
import React from 'react';
import { render } from '@testing-library/react';

// Mock I18nProvider for testing
const MockI18nProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="i18n-provider">{children}</div>;
};

// Test wrapper with providers
export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MockI18nProvider>
      {ui}
    </MockI18nProvider>
  );
}

export * from '@testing-library/react';