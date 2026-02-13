# Technology Stack

**Analysis Date:** 2026-02-13

## Languages

**Primary:**
- TypeScript 5.0.2 - Core application logic and components
- JavaScript (ES2020) - Service layer (`src/services/apiService.js`)
- JSX/TSX - React component templates with TypeScript support

**Secondary:**
- HTML5 - Document structure
- CSS3 + Tailwind - Styling (RTL-first)

## Runtime

**Environment:**
- Node.js (v20+ recommended)
- Modern browser support: Chrome/Chromium, Safari (WebSocket, ES2020)

**Package Manager:**
- npm 10+
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core Framework:**
- React 18.3.1 - UI component framework
  - React DOM 18.3.1 - DOM rendering
  - React Router v6.15.0 - Client-side routing (`src/App.tsx`)

**State Management:**
- React Context API - Global state for Auth, SchoolYear, Bagrut
  - Location: `src/services/authContext.jsx`, `src/services/schoolYearContext.jsx`, `src/contexts/BagrutContext`
- Zustand 4.4.1 - Cascade deletion state management
- @tanstack/react-query 4.35.0 - Server state management, caching, synchronization

**Forms & Validation:**
- React Hook Form 7.45.4 - Form state and submission
- @hookform/resolvers 3.3.1 - Form validation schema integration
- Zod 3.22.2 - TypeScript-first schema validation
  - Validation constants: `src/utils/validationUtils.ts`

**UI Components:**
- @headlessui/react 1.7.17 - Unstyled, accessible component primitives
- @radix-ui/react-label 2.1.7 - Label component
- @radix-ui/react-select 2.2.6 - Select dropdown component
- @radix-ui/react-slot 1.2.3 - Slot composition utility
- Lucide React 0.279.0 - Icon library
- Class Variance Authority 0.7.1 - Component variant system
- cmdk 0.2.0 - Command menu/palette
- Framer Motion 10.16.4 - Animation library
- Immer 10.0.2 - Immutable state updates (Zustand integration)

**Data Visualization:**
- Chart.js 4.4.0 - Charting library
- React-ChartJS-2 5.2.0 - React wrapper for Chart.js
- React Big Calendar 1.19.4 - Calendar component (lesson scheduling)

**Data & File Handling:**
- xlsx 0.18.5 - Excel file parsing for data import
- jsPDF 3.0.1 - PDF generation for reports
- jspdf-autotable 5.0.2 - PDF table formatting

**Real-time Communication:**
- Socket.IO Client 4.8.1 - WebSocket communication
  - Location: `src/services/websocketService.ts`
  - Configuration: `src/services/cascadeWebSocket.js`
  - Used for: Student updates, cascade deletion operations, real-time notifications

**Date/Time:**
- date-fns 2.30.0 - Date manipulation and formatting
- moment 2.30.1 - Legacy date library (gradual replacement with date-fns)

**Utilities:**
- clsx 2.0.0 - Conditional CSS class management
- tailwind-merge 1.14.0 - Merge Tailwind class conflicts
- react-dropzone 14.2.3 - File upload handling
- react-window 1.8.11 - Virtual scrolling for large lists
- react-window-infinite-loader 1.0.10 - Infinite scroll optimization
- react-virtualized-auto-sizer 1.0.20 - Dynamic sizing for virtualized lists
- react-hot-toast 2.6.0 - Toast notifications

**Styling:**
- Tailwind CSS 3.3.3 - Utility-first CSS framework (RTL-first)
  - Config: `tailwind.config.js` - Custom color palettes (primary blue, success, warning, error)
  - PostCSS 8.4.28 - CSS processing pipeline
  - Autoprefixer 10.4.15 - Browser vendor prefixes
- `src/index.css` - Global styles and RTL adjustments

## Build & Dev Tools

**Build System:**
- Vite 4.4.5 - Frontend build tool and dev server
  - Config: `vite.config.ts` - Optimized bundle chunking, path aliases
  - Dev Server: http://localhost:5173 (strict port)
  - Output: `dist/` directory

**React Development:**
- @vitejs/plugin-react 4.0.3 - JSX/TSX support with Fast Refresh

**Testing:**
- Vitest 0.34.3 - Unit test runner (Vite-native)
  - Config: `vitest.config.js` (root)
- @playwright/test 1.58.2 - E2E testing framework
  - Config: `playwright.config.ts`
  - Test location: `tests/e2e/`
  - Browser: Chromium
  - Locale: Hebrew (he-IL), Timezone: Asia/Jerusalem
  - Auth storage: `tests/e2e/.auth/admin.json`
- @testing-library/react 13.4.0 - React component testing utilities
- @testing-library/jest-dom 6.1.3 - Custom Jest matchers
- @testing-library/user-event 14.4.3 - User interaction simulation
- jsdom 22.1.0 - DOM implementation for Node.js testing

**Code Quality:**
- ESLint 8.45.0 - JavaScript/TypeScript linting
  - Config: `.eslintrc.json`
  - Plugins:
    - @typescript-eslint/eslint-plugin 6.21.0
    - @typescript-eslint/parser 6.0.0
    - eslint-plugin-react-hooks 4.6.0 - React hooks rules
    - eslint-plugin-react-refresh 0.4.3 - React Refresh rules
- Prettier 3.0.1 - Code formatter
  - Config: `prettier.config.js`
  - Plugin: prettier-plugin-tailwindcss 0.5.4 - Sort Tailwind classes
  - Settings: 2-space indent, single quotes, no semicolons, print width 80

**Type Checking:**
- TypeScript 5.0.2
  - Config: `tsconfig.json`
  - Path alias: `@/*` → `./src/*`
  - Target: ES2020
  - Mode: Bundler (moduleResolution: bundler)
  - JSX: react-jsx (automatic runtime)

## Key Dependencies

**Critical (Application Tier):**
- @tanstack/react-query - Server state + caching + synchronization (essential for real-time data)
- React Router - Routing and navigation (all pages depend on this)
- Socket.IO Client - Real-time WebSocket communication (cascade deletion, updates)
- React Hook Form + Zod - Form validation on all data entry screens

**Infrastructure:**
- Immer 10.0.2 - State mutation for Zustand stores (cascade deletion complex state)
- Framer Motion - Smooth animations (UI polish, feature F6)
- React Big Calendar - Lesson scheduling visualization

## Configuration

**Environment:**
- `.env.example` provides template (located in repo root)
- Runtime configuration via `import.meta.env.VITE_*`
- Environment variable categories:
  - API Configuration: `VITE_API_URL`
  - App Metadata: `VITE_APP_NAME`, `VITE_APP_VERSION`
  - Cascade Deletion: `VITE_CASCADE_DELETION_ENABLED`, `VITE_DELETION_BATCH_LIMIT`, `VITE_DELETION_TIMEOUT_MS`, `VITE_WEBSOCKET_DELETION_CHANNEL`
  - Feature Flags: `VITE_FEATURE_CASCADE_DELETION_PREVIEW`, `VITE_FEATURE_CASCADE_DELETION_EXECUTE`, `VITE_FEATURE_BULK_DELETION_ENABLED`
  - Monitoring: `VITE_ENABLE_PERFORMANCE_MONITORING`, `VITE_SENTRY_DSN`, `VITE_ANALYTICS_ENABLED`
  - Security: `VITE_MAX_DELETION_REQUESTS_PER_MINUTE`, `VITE_ENABLE_DELETION_RATE_LIMITING`

**Build Configuration:**
- `tsconfig.json` - TypeScript compilation
- `vite.config.ts` - Vite build and dev server settings
- `.eslintrc.json` - Linting rules
- `prettier.config.js` - Code formatting
- `tailwind.config.js` - Tailwind theme customization (color palette, shadows)
- `postcss.config.js` - PostCSS pipeline (Tailwind processing)
- `playwright.config.ts` - E2E test configuration

## Platform Requirements

**Development:**
- Node.js 20+ (ES2020 support)
- npm 10+ or compatible package manager
- Windows/macOS/Linux (React app agnostic)
- Backend API running at `VITE_API_URL` (default: `http://localhost:3001/api`)

**Production:**
- Modern browser with ES2020 support
- WebSocket support (for real-time features)
- Backend API deployment (Node.js/Express, see related repository)
- Environment variables configured via `.env` or deployment platform

**CI/CD:**
- GitHub Actions (`.github/workflows/ci.yml`)
- Build stage: Vite compilation
- Test stages: TypeScript check, ESLint, Vitest (unit/integration)
- Deploy stages: Staging and Production (conditional on backend)

---

*Stack analysis: 2026-02-13*
