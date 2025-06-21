# FAMAPP Design System

A minimal, clean design system inspired by Things 3 and Linear, built with Tailwind CSS 4.x.

## Design Principles

- **Minimalism**: Clean, uncluttered interfaces with thoughtful use of whitespace
- **Clarity**: Clear visual hierarchy and intuitive interactions
- **Accessibility**: WCAG 2.1 AA compliant components
- **Consistency**: Reusable tokens and components across the app
- **Family-First**: Designed for family collaboration and member identification

## Color Palette

### Primary Colors (Sky Blue)
- **Primary-500**: `#0ea5e9` - Main brand color
- **Primary-600**: `#0284c7` - Hover states
- **Primary-700**: `#0369a1` - Active states

### Neutral Grays
- **Gray-50**: `#f8fafc` - Light backgrounds
- **Gray-100**: `#f1f5f9` - Subtle backgrounds
- **Gray-500**: `#64748b` - Body text
- **Gray-900**: `#0f172a` - Headlines

### Semantic Colors
- **Success**: `#22c55e` - Completed tasks, success states
- **Warning**: `#f59e0b` - Warnings, pending states
- **Error**: `#ef4444` - Errors, destructive actions

### Family Member Colors
- **Gonzalo**: Primary blue (`#0ea5e9`) 👨‍💻
- **Mpaz**: Success green (`#22c55e`) 👩‍🎨
- **Borja**: Warning orange (`#f59e0b`) 👦
- **Melody**: Error red (`#ef4444`) 👧

## Typography

### Font Family
- **Primary**: Inter (from Google Fonts)
- **Fallback**: System UI stack (-apple-system, BlinkMacSystemFont, etc.)

### Font Scale
- **xs**: 12px / 16px line-height - Small labels, captions
- **sm**: 14px / 20px line-height - Body text, form inputs
- **base**: 16px / 24px line-height - Default body text
- **lg**: 18px / 28px line-height - Large body text
- **xl**: 20px / 28px line-height - Small headings
- **2xl**: 24px / 32px line-height - Section headings
- **3xl**: 30px / 36px line-height - Page titles
- **4xl**: 36px / 40px line-height - Hero headings

### Font Weights
- **Normal**: 400 - Body text
- **Medium**: 500 - Emphasized text
- **Semibold**: 600 - Headings
- **Bold**: 700 - Strong emphasis

## Spacing Scale

Based on 8px grid system:
- **1**: 4px - Micro spacing
- **2**: 8px - Small spacing
- **3**: 12px - Default spacing
- **4**: 16px - Medium spacing
- **6**: 24px - Large spacing
- **8**: 32px - Extra large spacing
- **12**: 48px - Section spacing
- **16**: 64px - Page spacing

## Border Radius

- **sm**: 2px - Small elements
- **md**: 6px - Default elements
- **lg**: 8px - Medium elements
- **xl**: 12px - Buttons, inputs
- **2xl**: 16px - Cards
- **3xl**: 24px - Large cards
- **full**: 9999px - Pills, avatars

## Shadows

- **soft**: Subtle shadow for cards
- **medium**: Elevated cards, dropdowns
- **strong**: Modals, important elements

## Components

### Buttons
```tsx
<Button variant="primary" size="md">Primary Button</Button>
<Button variant="secondary" size="md">Secondary Button</Button>
<Button variant="outline" size="md">Outline Button</Button>
<Button variant="ghost" size="md">Ghost Button</Button>
```

**Variants**: primary, secondary, outline, ghost, danger
**Sizes**: sm, md, lg

### Inputs
```tsx
<Input placeholder="Enter text..." size="md" />
<Input variant="error" placeholder="Error state" />
```

**Sizes**: sm, md, lg
**Variants**: default, error, success

### Cards
```tsx
<Card variant="default">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>
```

**Variants**: default, elevated, interactive

### Family Tags
```tsx
<FamilyTag member="gonzalo" size="md" showAvatar />
<FamilyTag member="mpaz" size="sm" />
```

**Members**: gonzalo, mpaz, borja, melody
**Sizes**: sm, md, lg

### Status Badges
```tsx
<StatusBadge variant="success">Completed</StatusBadge>
<StatusBadge variant="warning">Pending</StatusBadge>
<StatusBadge variant="error">Failed</StatusBadge>
```

## Dark Mode Support

All components support dark mode via `data-theme="dark"` attribute on the document element.

### Dark Mode Colors
- **Background**: Near black (`#020617`)
- **Surface**: Dark gray (`#1e293b`)
- **Text**: Light gray (`#f8fafc`)
- **Borders**: Medium gray (`#475569`)

## Usage Guidelines

### Do's ✅
- Use consistent spacing from the 8px grid
- Apply family member colors consistently
- Use semantic colors for appropriate states
- Maintain proper contrast ratios
- Use the design tokens and components

### Don'ts ❌
- Mix spacing systems (avoid arbitrary values)
- Use family colors for non-member contexts
- Override component styles without reason
- Use colors that don't meet accessibility standards
- Create custom components without following patterns

## File Structure

```
src/styles/
├── tokens.ts          # Design tokens (colors, spacing, etc.)
├── components.ts      # Component style utilities
└── README.md         # This documentation

src/components/ui/
├── Button.tsx        # Button component
├── Input.tsx         # Input component
├── Card.tsx          # Card components
├── FamilyTag.tsx     # Family member tags
├── LoadingSpinner.tsx # Loading states
├── StatusBadge.tsx   # Status indicators
└── index.ts          # Component exports

src/types/
└── theme.ts          # TypeScript types for styling
```

## Implementation

Components are built with:
- **Tailwind CSS 4.x** for utility classes
- **TypeScript** for type safety
- **forwardRef** for proper ref handling
- **Consistent APIs** across all components

Example usage:
```tsx
import { Button, Card, FamilyTag } from '@/components/ui';

function TodoItem() {
  return (
    <Card variant="interactive">
      <div className="flex items-center justify-between p-4">
        <span>Todo item text</span>
        <div className="flex items-center gap-2">
          <FamilyTag member="gonzalo" size="sm" />
          <Button variant="ghost" size="sm">Edit</Button>
        </div>
      </div>
    </Card>
  );
}
```

## Accessibility

All components include:
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- High contrast support
- Reduced motion support

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Tree-shakeable components
- Optimized CSS bundle
- Minimal runtime overhead
- Lazy-loaded design tokens