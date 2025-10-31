# ProductQuarry Widget Integration Guide

Welcome to ProductQuarry! This guide will help you integrate the feedback widget into your website or application.

## Table of Contents

- [Quick Start](#quick-start)
- [Installation Methods](#installation-methods)
- [Customization Options](#customization-options)
- [Advanced Configuration](#advanced-configuration)
- [Framework-Specific Integration](#framework-specific-integration)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Quick Start

The simplest way to add the ProductQuarry widget to your website is to copy and paste the following code snippet just before the closing `</body>` tag:

```html
<script
  src="https://your-domain.com/widget.js"
  data-board-slug="your-board-slug">
</script>
```

**Important:** Replace `your-domain.com` with your ProductQuarry domain and `your-board-slug` with your actual board slug (found in your board settings).

---

## Installation Methods

### Method 1: Direct Script Tag (Recommended)

Add the script tag to your HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <!-- Your website content -->

  <!-- ProductQuarry Widget -->
  <script
    src="https://your-domain.com/widget.js"
    data-board-slug="my-product">
  </script>
</body>
</html>
```

### Method 2: Dynamic Loading with JavaScript

If you need to load the widget dynamically:

```javascript
// Load widget dynamically
function loadProductQuarryWidget(boardSlug, options = {}) {
  const script = document.createElement('script');
  script.src = 'https://your-domain.com/widget.js';
  script.setAttribute('data-board-slug', boardSlug);

  // Apply optional configurations
  Object.entries(options).forEach(([key, value]) => {
    script.setAttribute(`data-${key}`, value);
  });

  document.body.appendChild(script);
}

// Usage
loadProductQuarryWidget('my-product', {
  position: 'bottom-left',
  theme: 'dark',
  buttonText: 'Send Feedback'
});
```

### Method 3: NPM Package (Coming Soon)

We're working on an npm package for easier integration with modern frameworks.

---

## Customization Options

ProductQuarry widget supports extensive customization through data attributes:

### All Available Options

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-board-slug` | String | **Required** | Your board's unique identifier |
| `data-position` | String | `bottom-right` | Widget position on screen |
| `data-theme` | String | `light` | Visual theme (light or dark) |
| `data-button-text` | String | `Feedback` | Custom text for the trigger button |
| `data-primary-color` | String | `#2563eb` | Custom primary color (hex format) |
| `data-auto-open` | Boolean | `false` | Auto-open modal on page load |
| `data-auto-open-delay` | Number | `0` | Delay before auto-opening (milliseconds) |

### Position Options

Choose where the widget appears on your page:

```html
<!-- Bottom right (default) -->
<script src="..." data-board-slug="..." data-position="bottom-right"></script>

<!-- Bottom left -->
<script src="..." data-board-slug="..." data-position="bottom-left"></script>

<!-- Top right -->
<script src="..." data-board-slug="..." data-position="top-right"></script>

<!-- Top left -->
<script src="..." data-board-slug="..." data-position="top-left"></script>
```

### Theme Options

```html
<!-- Light theme (default) -->
<script src="..." data-board-slug="..." data-theme="light"></script>

<!-- Dark theme -->
<script src="..." data-board-slug="..." data-theme="dark"></script>
```

### Custom Button Text

```html
<script
  src="..."
  data-board-slug="..."
  data-button-text="Share Feedback">
</script>
```

### Custom Primary Color

Match your brand colors:

```html
<script
  src="..."
  data-board-slug="..."
  data-primary-color="#7c3aed">
</script>
```

### Auto-Open Modal

Automatically show the feedback form to users:

```html
<!-- Open immediately on page load -->
<script
  src="..."
  data-board-slug="..."
  data-auto-open="true">
</script>

<!-- Open after 5 seconds -->
<script
  src="..."
  data-board-slug="..."
  data-auto-open="true"
  data-auto-open-delay="5000">
</script>
```

**Note:** Auto-open only triggers once per session to avoid annoying users.

---

## Advanced Configuration

### Complete Example with All Options

```html
<script
  src="https://your-domain.com/widget.js"
  data-board-slug="my-product"
  data-position="bottom-left"
  data-theme="dark"
  data-button-text="Send Feedback"
  data-primary-color="#7c3aed"
  data-auto-open="true"
  data-auto-open-delay="3000">
</script>
```

### Programmatic Control

Access widget functions programmatically (advanced):

```javascript
// Note: The widget is self-contained and automatically manages itself.
// For most use cases, the data attributes are sufficient.

// If you need custom triggers, you can simulate clicks on the widget button:
document.querySelector('#pq-widget-trigger')?.click();
```

---

## Framework-Specific Integration

### React

```jsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Load widget on component mount
    const script = document.createElement('script');
    script.src = 'https://your-domain.com/widget.js';
    script.setAttribute('data-board-slug', 'my-product');
    script.setAttribute('data-theme', 'light');
    script.setAttribute('data-position', 'bottom-right');

    document.body.appendChild(script);

    // Cleanup on unmount
    return () => {
      document.body.removeChild(script);
      // Remove widget elements
      document.getElementById('pq-widget-container')?.remove();
      document.getElementById('pq-modal-backdrop')?.remove();
      document.getElementById('pq-modal')?.remove();
    };
  }, []);

  return <div>Your App Content</div>;
}
```

### Next.js

Add to your `_app.js` or specific page:

```jsx
// app/layout.tsx or pages/_app.js
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}

        <Script
          src="https://your-domain.com/widget.js"
          data-board-slug="my-product"
          data-theme="light"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
```

### Vue.js

```vue
<template>
  <div id="app">
    <!-- Your app content -->
  </div>
</template>

<script>
export default {
  mounted() {
    const script = document.createElement('script');
    script.src = 'https://your-domain.com/widget.js';
    script.setAttribute('data-board-slug', 'my-product');
    document.body.appendChild(script);
  },
  beforeUnmount() {
    // Cleanup
    document.getElementById('pq-widget-container')?.remove();
    document.getElementById('pq-modal-backdrop')?.remove();
    document.getElementById('pq-modal')?.remove();
  }
}
</script>
```

### Angular

```typescript
// app.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  ngOnInit() {
    const script = document.createElement('script');
    script.src = 'https://your-domain.com/widget.js';
    script.setAttribute('data-board-slug', 'my-product');
    document.body.appendChild(script);
  }

  ngOnDestroy() {
    document.getElementById('pq-widget-container')?.remove();
    document.getElementById('pq-modal-backdrop')?.remove();
    document.getElementById('pq-modal')?.remove();
  }
}
```

### WordPress

Add to your theme's `footer.php` or use a plugin like "Insert Headers and Footers":

```html
<script
  src="https://your-domain.com/widget.js"
  data-board-slug="my-product"
  data-theme="light">
</script>
```

---

## Troubleshooting

### Widget Not Appearing

1. **Check the board slug**: Ensure `data-board-slug` matches your board's slug exactly
2. **Check the script URL**: Verify the domain is correct
3. **Check browser console**: Look for error messages
4. **Board visibility**: Ensure your board is set to public in settings

### Widget Appears But Form Doesn't Submit

1. **Check network tab**: Look for failed API requests
2. **Board settings**: Verify feedback submission is enabled
3. **CORS issues**: Ensure your domain is allowed (should work by default)

### Styling Conflicts

If the widget styling conflicts with your site:

```css
/* Add this to your stylesheet to override if needed */
#pq-widget-container {
  /* Your custom adjustments */
}
```

### Script Loading Issues

If using Content Security Policy (CSP), add:

```html
<meta http-equiv="Content-Security-Policy"
      content="script-src 'self' https://your-domain.com;">
```

---

## Best Practices

### 1. Positioning

- **Bottom-right**: Most common, non-intrusive
- **Bottom-left**: Good for sites with chat widgets on the right
- **Top positions**: Less common, use if bottom positions conflict with your UI

### 2. Timing

- **Immediate load**: For sites where feedback is always welcome
- **Delayed auto-open**: Engage users after they've explored (3-5 seconds recommended)
- **Exit intent**: Consider auto-opening on exit intent for maximum engagement

### 3. Customization

- **Match your brand**: Use `data-primary-color` to match your brand colors
- **Context-aware text**: Use descriptive button text like "Report a Bug" or "Share Ideas"
- **Theme matching**: Use dark theme if your site has a dark mode

### 4. Performance

- Load the widget with `defer` or at the end of `<body>` for better page load performance
- Consider lazy-loading for pages where feedback isn't critical

### 5. User Experience

- Don't auto-open too frequently (once per session is enforced automatically)
- Use appropriate button text that sets expectations
- Consider your audience when choosing position and theme

---

## Support

Need help with integration?

- **Documentation**: Check our [full documentation](/)
- **Board Settings**: Find your board slug and widget code in Settings
- **Issues**: Report integration issues in your dashboard

---

## Changelog

### Version 2.0.0
- Added custom primary color support
- Added auto-open functionality with delay
- Enhanced animations and styling
- Improved accessibility
- Better mobile responsiveness

### Version 1.0.0
- Initial release
- Basic customization options
- Theme support
- Position options

---

**Made with ProductQuarry** 🚀
