# Static Assets

Place static assets in this folder. They will be served from the root URL.

## Folder Structure

```
assets/
├── logos/           # Company logos
│   ├── 5me-logo.svg        # Main 5me logo
│   ├── 5me-logo-white.svg  # White version for dark backgrounds
│   └── 5me-icon.svg        # Icon only version
├── images/          # General images
└── icons/           # Favicon and app icons
```

## Usage in Code

Reference assets using absolute paths from root:

```tsx
// In React components
<img src="/assets/logos/5me-logo.svg" alt="5me" />

// In CSS
background-image: url('/assets/logos/5me-logo.svg');
```

## Recommended Formats

- **Logos**: SVG preferred (scalable), PNG as fallback
- **Icons**: SVG or PNG
- **Photos**: WebP or JPEG

## Company Logos (for multi-tenant)

When companies upload logos, they'll be stored on the server.
For now, you can add placeholder logos here for testing.
