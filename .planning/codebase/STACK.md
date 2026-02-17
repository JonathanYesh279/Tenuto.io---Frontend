# Technology Stack

**Analysis Date:** 2026-02-17

## Languages

**Primary:**
- TypeScript 5.0.2 - Application code, React components, services, hooks
- JavaScript - API service (`src/services/apiService.js`), WebSocket services, utility scripts
- JSX/TSX - React components throughout

**Secondary:**
- CSS/Tailwind - All styling (no separate CSS files, Tailwind classes in components)
- HTML - Index template only

## Runtime

**Environment:**
- Node.js (version not specified in .nvmrc, uses system Node)
- Browser: ES2020 target with strict polyfill support

**Package Manager:**
- npm (npm workspace compatible, single package.json)
- Lockfile: `package-lock.json` (present, git-tracked)

## Frameworks

**Core:**
- React 18.3.1 - UI framework, hooks-based architecture
- React Router v6.15.0 - Client-side routing in `src/App.tsx`
- React Hook Form 7.45.4 - Form management (NOT Formik)
- Zod 3.22.2 - Schema validation for forms and API responses

**State Management:**
- React Context - Auth, school year, bagrut state (`src/services/authContext.jsx`)
- Zustand 4.4.1 - Cascade deletion operation state
- TanStack React Query 4.35.0 - Server state, caching, synchronization
- Immer 10.0.2 - Immutable state updates

**UI Components:**
- Headless UI 1.7.17 - Unstyled, accessible components
- Radix UI - Select, Label, Slot components
- Lucide React 0.279.0 - Icon library
- Floating UI 0.25.4 - Floating element positioning
- class-variance-authority 0.7.1 - Component variant management
- clsx 2.0.0 - Conditional className merging

**Real-time:**
- Socket.IO Client 4.8.1 - WebSocket connections for cascade deletion and student updates
  - URL: Backend base URL (removes `/api` path)
  - Reconnection: 5 attempts, 1000ms initial delay, 30s max delay
  - Heartbeat: 30-second interval

**Data & Visualization:**
- Chart.js 4.4.0 - Chart library (not used in current phase)
- React Charts 5.2.0 - Chart components
- React Big Calendar 1.19.4 - Calendar view
- react-dropzone 14.2.3 - File upload zones
- xlsx 0.18.5 - Excel file parsing and generation
- jsPDF 3.0.1 - PDF generation
- jsPDF AutoTable 5.0.2 - PDF table generation

**Table & Virtualization:**
- react-window 1.8.11 - Virtual scrolling for large lists
- react-window-infinite-loader 1.0.10 - Infinite scroll for paginated data
- react-virtualized-auto-sizer 1.0.20 - Auto-sizing containers

**Utilities:**
- date-fns 2.30.0 - Date manipulation (preferred over moment)
- moment 2.30.1 - Legacy date handling (being phased out)
- framer-motion 10.16.4 - Animation library
- react-hot-toast 2.6.0 - Toast notifications
- tailwind-merge 1.14.0 - Merge Tailwind classes without conflicts

## Testing

**Framework:**
- Vitest 0.34.3 - Unit/integration test runner (compatible with Jest)
- Playwright 1.58.2 - E2E testing
- @testing-library/react 13.4.0 - React component testing
- @testing-library/user-event 14.4.3 - User interaction simulation
- @testing-library/jest-dom 6.1.3 - Matcher extensions

**Run Commands:**
```bash
npm test                    # Run Vitest unit tests
npm run test:ui            # Vitest UI dashboard
npm run test:coverage      # Coverage report
npm run test:cascade       # Cascade deletion tests only
npm run test:e2e:cascade   # Playwright E2E tests
```

## Build & Dev Tools

**Build System:**
- Vite 4.4.5 - Build bundler and dev server
  - Dev server: Port 5173
  - Build target: ES2020
  - Code splitting: Vendor, query, ui, charts, utils, cascade-deletion chunks
  - HMR: WebSocket on port 5173

**Dev Server Config:**
- Polling watch mode (WSL-compatible)
- Hot Module Reload overlay enabled
- Strict port mode (fail if 5173 occupied)

**Code Quality:**
- ESLint 8.45.0 - Linting with TypeScript support
- Prettier 3.0.1 - Code formatting (RTL-aware)
- prettier-plugin-tailwindcss 0.5.4 - Tailwind class sorting
- TypeScript 5.0.2 - Type checking
- PostCSS 8.4.28 - CSS processing
- Autoprefixer 10.4.15 - Browser prefix auto-adding

**Styling:**
- Tailwind CSS 3.3.3 - Utility-first CSS framework
  - Theme: Custom primary blue (#4F46E5), secondary grays, success/orange/purple accents
  - RTL support: Custom utilities (.rtl, .ltr, .text-start, .text-end, .float-start, .float-end)
  - Font stack: Reisinger Yonatan (Hebrew) → Inter → Arial Hebrew → system fonts
  - Custom components: .btn, .card, .input
  - Animation: fade-in, slide-up, slide-down, scale-in, pulse-soft

## Key Dependencies by Purpose

**Critical:**
- `@tanstack/react-query` v4.35.0 - Server state management and cache coordination with React Context
- `react-hook-form` v7.45.4 - Form state without Formik (required for 7-tab teacher form)
- `zod` v3.22.2 - Runtime validation for API responses and form fields
- `socket.io-client` v4.8.1 - Real-time updates for cascade deletion and student data

**Infrastructure:**
- `react-router-dom` v6.15.0 - SPA routing
- `zustand` v4.4.1 - Lightweight state for cascade operations
- `@hookform/resolvers` v3.3.1 - Zod validation integration with React Hook Form

**UI Components & Styling:**
- `@headlessui/react` v1.7.17 - Unstyled, accessible UI primitives
- `@radix-ui/react-select`, `react-label`, `react-slot` - Accessible form components
- `lucide-react` v0.279.0 - Icon library (27+ instrument icons)
- `tailwind-css` v3.3.3 - Styling framework
- `framer-motion` v10.16.4 - Animations

**Data Processing:**
- `xlsx` v0.18.5 - Excel import/export
- `jspdf` v3.0.1, `jspdf-autotable` v5.0.2 - PDF generation for reports
- `chart.js` v4.4.0, `react-chartjs-2` v5.2.0 - Chart rendering

## Configuration

**Environment:**
- File: `.env.example` (template, never commit `.env`)
- Vars prefixed: `VITE_` (Vite variables auto-exported to `import.meta.env`)
- Critical vars:
  - `VITE_API_URL` - Backend URL (default: `http://localhost:3001/api`)
  - `VITE_APP_VERSION` - Version string for telemetry
  - `VITE_SENTRY_DSN` - Error tracking (optional, conditionally initialized)
  - `VITE_ANALYTICS_ENABLED` - Toggle analytics
  - `VITE_ENABLE_PERFORMANCE_MONITORING` - Debug monitoring
  - Cascade deletion feature flags: `VITE_FEATURE_CASCADE_DELETION_PREVIEW`, `_EXECUTE`, etc.

**Build Configuration:**
- `vite.config.ts` - Build and dev server config
- `tsconfig.json` - TypeScript compiler options
- `tailwind.config.js` - Tailwind theme extensions
- `prettier.config.js` - Code formatting rules
- `postcss.config.js` - CSS processing pipeline
- `playwright.config.ts` - E2E test configuration

**Client-Side Storage:**
- `localStorage` - Persistent auth tokens, user preferences, recent searches
  - Keys: `authToken`, `loginType`, `superAdminUser`, `recentSearches`, `OFFLINE_QUEUE`
- `sessionStorage` - Session-only tokens
- No IndexedDB or other client-side databases used

## Platform Requirements

**Development:**
- Node.js (LTS recommended)
- npm or yarn
- WSL2 on Windows (polling watch mode for file changes)
- Modern browser (Chrome/Edge for dev, Chromium for Playwright tests)
- Backend running on `http://localhost:3001`

**Production:**
- Static hosting (CDN-friendly)
- Vite `dist/` output (pre-built HTML, JS, CSS)
- Backend API at configured `VITE_API_URL`
- Socket.IO WebSocket support required
- Secure headers recommended (CSP, HSTS, X-Frame-Options)

---

*Stack analysis: 2026-02-17*
