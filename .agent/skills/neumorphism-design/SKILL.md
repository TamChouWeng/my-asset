---
name: Neumorphism Design
description: Comprehensive guide and utilities for applying Neumorphism (Soft UI) to the MyAsset project.
---

# Neumorphism Design System for MyAsset

This skill provides the design tokens, utility classes, and component patterns necessary to implement a high-quality Neumorphism (Soft UI) aesthetic in your project using Tailwind CSS.

## 1. Setup & Configuration

To enable the custom shadows and colors required for Neumorphism, update your `tailwind.config.js`.

### tailwind.config.js
Add the following to the `theme.extend` section:

```javascript
module.exports = {
  // ...
  theme: {
    extend: {
      colors: {
        neu: {
          base: '#E0E5EC', // Light mode base
          'base-dark': '#2A2A2A', // Dark mode base
          // Text colors for contrast
          text: '#4A5568',
          'text-dark': '#A0AEC0',
        },
      },
      boxShadow: {
        // Light Mode Shadows
        'neu-flat': '9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff',
        'neu-pressed': 'inset 6px 6px 10px 0 #a3b1c6, inset -6px -6px 10px 0 #ffffff',
        'neu-convex': 'linear-gradient(145deg, #ffffff, #caced3)', // Background image utility strictly speaking, but listed here for concept
        'neu-concave': 'linear-gradient(145deg, #caced3, #ffffff)',

        // Dark Mode Shadows (Example adjustments - tune as needed)
        'neu-flat-dark': '5px 5px 10px #1e1e1e, -5px -5px 10px #363636',
        'neu-pressed-dark': 'inset 5px 5px 10px #1e1e1e, inset -5px -5px 10px #363636',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    },
  },
  // ...
}
```

## 2. Global Styles (index.css)

Set the global background color to match the Neumorphism base.

```css
@layer base {
  body {
    @apply bg-neu-base text-neu-text dark:bg-neu-base-dark dark:text-neu-text-dark transition-colors duration-300;
  }
}
```

## 3. Component Patterns

### Card (Container)
The standard container for dashboard widgets.
```tsx
<div className="bg-neu-base dark:bg-neu-base-dark shadow-neu-flat dark:shadow-neu-flat-dark rounded-xl p-6">
  {/* Content */}
</div>
```

### Primary Button
A button that looks like it pops out of the screen. Pressing it inverts the shadow.
```tsx
<button className="px-8 py-3 rounded-full bg-neu-base dark:bg-neu-base-dark text-neu-text dark:text-neu-text-dark font-bold shadow-neu-flat dark:shadow-neu-flat-dark active:shadow-neu-pressed dark:active:shadow-neu-pressed-dark transition-all duration-200 ease-in-out transform active:scale-95 outline-none">
  Action
</button>
```

### Input Field
Inputs should look "pressed in" (inset shadow) by default.
```tsx
<input 
  type="text" 
  className="w-full bg-neu-base dark:bg-neu-base-dark rounded-lg px-4 py-3 shadow-neu-pressed dark:shadow-neu-pressed-dark outline-none focus:ring-2 focus:ring-blue-400/50 transition-all text-neu-text dark:text-neu-text-dark placeholder-gray-400"
  placeholder="Search assets..."
/>
```

### Icon Button / Toggle
```tsx
<button className="w-12 h-12 flex items-center justify-center rounded-full bg-neu-base dark:bg-neu-base-dark shadow-neu-flat dark:shadow-neu-flat-dark active:shadow-neu-pressed dark:active:shadow-neu-pressed-dark text-blue-500">
  <IconComponent className="w-6 h-6" />
</button>
```

## 4. Typography

Neumorphism pairs best with clean, rounded sans-serif fonts.
- **Recommended**: `Nunito`, `Poppins`, or `Quicksand`.
- **Implementation**: Import from Google Fonts in `index.css` and extend `fontFamily` in `tailwind.config.js`.

```css
/* index.css */
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap');
```

```javascript
// tailwind.config.js
theme: {
  extend: {
    fontFamily: {
      sans: ['Nunito', 'sans-serif'],
    },
  },
}
```

## 5. Chart Styling (Recharts/Victory)

For charts, avoid solid backgrounds on the chart area itself. Use the card container for the background.
- **Grid Lines**: Make them extremely subtle or remove them (`stroke="#cbd5e0" strokeOpacity={0.2}`).
- **Tooltips**: Use the `Card` style for tooltips (`shadow-neu-flat rounded-lg`).
- **Colors**: Use soft gradients or pastel colors specifically chosen to contrast well with `#E0E5EC`.
    - Teal: `#4FD1C5`
    - Blue: `#63B3ED`
    - Purple: `#B794F4`

## 6. Layout Principles

1.  **More Whitespace**: Neumorphism requires more padding (`p-6`, `p-8`) to let the shadows "breathe". Crowded elements break the illusion.
2.  **Consistency**: Light source direction (usually top-left) must be consistent across all shadows.
3.  **Hierarchy**: Use `flat` shadows for surface-level elements and `pressed` shadows for inputs or active states. Avoid mixing too many "layers".
