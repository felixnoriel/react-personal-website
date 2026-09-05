# Felix Noriel Personal Website - Modern Stack

Modernized personal website migrated from 2018 legacy stack to cutting-edge 2025 technologies.

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Tech Stack

### Frontend
- **React 18** - Modern functional components with hooks
- **Vite 7** - Lightning-fast build tool and dev server
- **TypeScript 5.9** - Type-safe development
- **React Router 7** - Client-side routing
- **Tailwind CSS 3** - Utility-first CSS framework
- **Shadcn/ui** - Beautiful, accessible component library
- **React Helmet Async** - SEO meta tag management

### Build & Runtime
- **Bun** - Fast all-in-one JavaScript runtime
- **TypeScript data files** - Direct imports, zero HTTP requests
- **Context API** - Simple state management

### Utilities
- **Luxon** - Modern date/time library (replaced Moment.js)
- **Lodash-es** - Utility functions (ES modules)

## Migration from Legacy Stack

### What Changed
- ❌ Next.js 8 (SSR) → ✅ Vite 7 (CSR with SEO)
- ❌ Redux + Thunk → ✅ React Context API
- ❌ Bulma CSS → ✅ Tailwind CSS + Shadcn/ui
- ❌ Moment.js → ✅ Luxon
- ❌ Class Components → ✅ Functional + Hooks
- ❌ Express Server → ✅ Static site
- ❌ Axios + JSON → ✅ TypeScript imports
- ❌ Complex data (4-5 layers) → ✅ Flat (1-2 layers)
- ❌ npm → ✅ Bun

### Data Simplification
Transformed WordPress JSON structure from 4-5 layers to 1-2 layers:

**Before:**
```typescript
post.custom_meta.company.title.rendered
post._embedded['wp:featuredmedia'][0].media_details.sizes.medium.source_url
```

**After:**
```typescript
post.company.title
post.image.url
```

### SEO Implementation
- ✅ Dynamic meta tags with `react-helmet-async`
- ✅ Open Graph tags for social media
- ✅ Twitter Card support
- ✅ JSON-LD structured data for blog posts
- ✅ Sitemap and robots.txt
- ✅ Proper canonical URLs

## Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Format code with Prettier
bun run format

# Transform data (if updating WordPress JSON)
bun run transform-data
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── blog/           # Blog-specific components
│   ├── career/         # Career-specific components
│   ├── project/        # Project-specific components
│   ├── layout/         # Layout components (Header, Footer)
│   ├── seo/            # SEO components
│   └── ui/             # Shadcn UI components
├── contexts/           # React Context providers
├── pages/              # Page components (routes)
├── utils/              # Utility functions
│   ├── date.ts         # Date formatting (Luxon)
│   └── wordpress.ts    # WordPress data parsing
└── lib/                # Library utilities

public/
└── data/               # Static JSON data files
    ├── blog.json
    ├── career.json
    └── projects.json
```

## Data Source

The application loads data from static JSON files in `public/data/`. These files contain WordPress API formatted data from the original CMS.

## Deployment

This app can be deployed to any modern hosting platform:

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

### Cloudflare Pages
- Connect your Git repository
- Build command: `npm run build`
- Publish directory: `dist`

## Features

- ✅ Fully responsive design
- ✅ SEO optimized with dynamic meta tags
- ✅ Fast page loads with Vite
- ✅ Modern, accessible UI components
- ✅ Blog with social sharing
- ✅ Project showcase
- ✅ Career timeline
- ✅ Mobile-friendly navigation
- ✅ Smooth scrolling
- ✅ TypeScript for type safety

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Created by Felix Noriel © 2025
