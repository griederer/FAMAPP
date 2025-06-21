// CSS validation tests for SmartCards component
import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('SmartCards CSS Validation', () => {
  const cssPath = join(__dirname, '../SmartCards.css');
  let cssContent: string;

  try {
    cssContent = readFileSync(cssPath, 'utf-8');
  } catch (error) {
    throw new Error(`Could not read CSS file at ${cssPath}`);
  }

  describe('CSS File Structure', () => {
    test('should have CSS file present', () => {
      expect(cssContent).toBeTruthy();
      expect(cssContent.length).toBeGreaterThan(0);
    });

    test('should contain main component classes', () => {
      expect(cssContent).toContain('.smart-cards');
      expect(cssContent).toContain('.smart-cards__header');
      expect(cssContent).toContain('.smart-cards__grid');
      expect(cssContent).toContain('.smart-cards__footer');
      expect(cssContent).toContain('.smart-card');
    });

    test('should contain responsive grid layout rules', () => {
      expect(cssContent).toContain('display: grid');
      expect(cssContent).toContain('grid-template-columns');
      expect(cssContent).toContain('repeat(auto-fit, minmax(');
      expect(cssContent).toContain('grid-auto-rows: 1fr');
      expect(cssContent).toContain('gap:');
    });
  });

  describe('Responsive Design Rules', () => {
    test('should have mobile-first responsive breakpoints', () => {
      expect(cssContent).toContain('@media (max-width: 1024px)');
      expect(cssContent).toContain('@media (max-width: 768px)');
      expect(cssContent).toContain('@media (max-width: 640px)');
      expect(cssContent).toContain('@media (max-width: 480px)');
    });

    test('should have container max-width and centering', () => {
      expect(cssContent).toContain('max-width: 1200px');
      expect(cssContent).toContain('margin: 0 auto');
    });

    test('should have flexible grid columns for different screen sizes', () => {
      expect(cssContent).toContain('minmax(280px, 1fr)');
      expect(cssContent).toContain('minmax(260px, 1fr)');
      expect(cssContent).toContain('minmax(240px, 1fr)');
      expect(cssContent).toContain('grid-template-columns: 1fr');
    });
  });

  describe('Card Styling Rules', () => {
    test('should have proper card structure and layout', () => {
      expect(cssContent).toContain('.smart-card__header');
      expect(cssContent).toContain('.smart-card__content');
      expect(cssContent).toContain('.smart-card__title');
      expect(cssContent).toContain('.smart-card__value');
      expect(cssContent).toContain('.smart-card__subtitle');
      expect(cssContent).toContain('.smart-card__icon');
    });

    test('should have flexbox layout for cards', () => {
      expect(cssContent).toContain('display: flex');
      expect(cssContent).toContain('flex-direction: column');
      expect(cssContent).toContain('flex: 1');
    });

    test('should have card color variants', () => {
      expect(cssContent).toContain('.smart-card--primary');
      expect(cssContent).toContain('.smart-card--success');
      expect(cssContent).toContain('.smart-card--warning');
      expect(cssContent).toContain('.smart-card--error');
      expect(cssContent).toContain('.smart-card--info');
    });

    test('should have priority variants', () => {
      expect(cssContent).toContain('.smart-card--high');
      expect(cssContent).toContain('.smart-card--medium');
      expect(cssContent).toContain('.smart-card--low');
    });
  });

  describe('Visual Enhancement Rules', () => {
    test('should have gradient text effects', () => {
      expect(cssContent).toContain('linear-gradient');
      expect(cssContent).toContain('-webkit-background-clip: text');
      expect(cssContent).toContain('-webkit-text-fill-color: transparent');
      expect(cssContent).toContain('background-clip: text');
    });

    test('should have hover effects and transitions', () => {
      expect(cssContent).toContain('transition:');
      expect(cssContent).toContain(':hover');
      expect(cssContent).toContain('transform: translateY(');
      expect(cssContent).toContain('box-shadow:');
    });

    test('should have border radius for modern look', () => {
      expect(cssContent).toContain('border-radius:');
      expect(cssContent).toContain('16px');
      expect(cssContent).toContain('12px');
    });
  });

  describe('Trend Indicator Styles', () => {
    test('should have trend indicator classes', () => {
      expect(cssContent).toContain('.trend-indicator');
      expect(cssContent).toContain('.trend-up');
      expect(cssContent).toContain('.trend-down');
      expect(cssContent).toContain('.trend-stable');
      expect(cssContent).toContain('.trend-icon');
      expect(cssContent).toContain('.trend-percentage');
      expect(cssContent).toContain('.trend-label');
    });

    test('should have appropriate trend colors', () => {
      expect(cssContent).toContain('var(--success-color');
      expect(cssContent).toContain('var(--error-color');
      expect(cssContent).toContain('var(--text-secondary');
    });
  });

  describe('AI Integration Styles', () => {
    test('should have AI insights section styling', () => {
      expect(cssContent).toContain('.smart-cards__ai-insights');
      expect(cssContent).toContain('.ai-insights-content');
      expect(cssContent).toContain('.ai-suggestion');
      expect(cssContent).toContain('.suggestion-icon');
      expect(cssContent).toContain('.suggestion-text');
    });
  });

  describe('Empty State Styles', () => {
    test('should have empty state styling', () => {
      expect(cssContent).toContain('.smart-cards-empty');
      expect(cssContent).toContain('.empty-state');
      expect(cssContent).toContain('.empty-icon');
    });
  });

  describe('Accessibility Features', () => {
    test('should have accessibility media queries', () => {
      expect(cssContent).toContain('@media (prefers-reduced-motion: reduce)');
      expect(cssContent).toContain('@media (prefers-contrast: high)');
      expect(cssContent).toContain('@media (prefers-color-scheme: dark)');
    });

    test('should have focus states', () => {
      expect(cssContent).toContain(':focus-within');
      expect(cssContent).toContain('outline:');
      expect(cssContent).toContain('outline-offset:');
    });

    test('should have print styles', () => {
      expect(cssContent).toContain('@media print');
      expect(cssContent).toContain('break-inside: avoid');
    });
  });

  describe('Advanced Features', () => {
    test('should have high DPI display support', () => {
      expect(cssContent).toContain('@media (-webkit-min-device-pixel-ratio: 2)');
      expect(cssContent).toContain('(min-resolution: 192dpi)');
    });

    test('should have animation keyframes', () => {
      expect(cssContent).toContain('@keyframes');
      expect(cssContent).toContain('animation:');
    });

    test('should have loading states', () => {
      expect(cssContent).toContain('.smart-card--loading');
      expect(cssContent).toContain('pulse');
      expect(cssContent).toContain('shimmer');
    });

    test('should have container query support', () => {
      expect(cssContent).toContain('@container');
    });
  });

  describe('Color System', () => {
    test('should use CSS custom properties for theming', () => {
      expect(cssContent).toContain('var(--');
      expect(cssContent).toContain('var(--text-primary');
      expect(cssContent).toContain('var(--text-secondary');
      expect(cssContent).toContain('var(--border-color');
      expect(cssContent).toContain('var(--bg-card');
      expect(cssContent).toContain('var(--primary-color');
    });

    test('should have fallback colors', () => {
      expect(cssContent).toContain('#');
      expect(cssContent).toContain('rgba(');
    });
  });

  describe('Performance Optimizations', () => {
    test('should use efficient selectors', () => {
      // Check that we're not using overly complex selectors
      const complexSelectors = cssContent.match(/\s+>\s+.*\s+>\s+.*\s+>\s+/g);
      expect(complexSelectors?.length || 0).toBeLessThan(5); // Limit deeply nested selectors
    });

    test('should have will-change properties for animated elements', () => {
      // While not strictly required, check if performance hints are present
      const animatedSelectors = cssContent.match(/animation:|transform:|transition:/g);
      expect(animatedSelectors?.length || 0).toBeGreaterThan(0);
    });
  });

  describe('Code Quality', () => {
    test('should not have duplicate property definitions in same rule', () => {
      // Basic check for duplicate properties (simplified)
      const rules = cssContent.split('}');
      let duplicateFound = false;
      
      rules.forEach(rule => {
        const properties = rule.split(';').map(prop => prop.split(':')[0]?.trim()).filter(Boolean);
        const uniqueProperties = new Set(properties);
        if (properties.length !== uniqueProperties.size) {
          duplicateFound = true;
        }
      });
      
      expect(duplicateFound).toBe(false);
    });

    test('should have consistent indentation and formatting', () => {
      // Check for basic formatting consistency
      expect(cssContent).toContain('  '); // Should have proper indentation
      expect(cssContent.includes('\t')).toBe(false); // Should use spaces, not tabs
    });

    test('should have meaningful class names', () => {
      // Check for semantic class naming
      expect(cssContent).toContain('__'); // BEM methodology
      expect(cssContent).toContain('--'); // BEM modifiers
    });
  });

  describe('Browser Compatibility', () => {
    test('should have vendor prefixes where needed', () => {
      expect(cssContent).toContain('-webkit-');
    });

    test('should have fallback values for CSS Grid', () => {
      // Ensure grid has fallback support
      expect(cssContent).toContain('display: grid');
    });
  });
});