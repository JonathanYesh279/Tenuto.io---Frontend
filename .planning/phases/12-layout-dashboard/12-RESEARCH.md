# Phase 12: Layout & Dashboard - Research

**Researched:** 2026-02-18
**Domain:** React layout shell (sidebar, header, dashboard) visual redesign
**Confidence:** HIGH — all findings based on direct codebase inspection + Context7 docs

---

## Summary

Phase 12 redesigns the three "frame" components that every page shares: `Sidebar.tsx`, `Header.tsx`, and `Layout.tsx`. It also updates `Dashboard.tsx` with a personalized greeting and warm-colored stat cards. This is the last major visual phase (highest regression risk by design), done after all page content is stable.

The codebase already has all the infrastructure needed: the `--sidebar` CSS token exists in `:root`, the `SidebarContext` manages open/mobile state, the warm coral primary `--primary: 15 85% 45%` is established, shadcn/ui primitives and Tailwind semantic tokens are fully wired up, and `getDisplayName()` / `getInitials()` handle the user name for the greeting.

The primary work is **visual restyling** — not structural rearchitecting. The sidebar HTML structure and state management are solid; only the class names and colors need to change. The dashboard header section needs a greeting block inserted, and `StatsCard` needs updated color props. NavLink (React Router v6) should replace the current `isActive` + `Link` pattern for cleaner active state.

**Primary recommendation:** Apply warm CSS tokens to sidebar/header surfaces; switch nav items from `Link` + manual `isActive()` to `NavLink` with the existing active class pattern; insert a time-aware greeting above the dashboard stats; update StatsCard color props to use design-system colors (amber/coral/teal) instead of generic blue/purple.

---

## Standard Stack

### Core — Already in Place

| Library | Version | Purpose | Note |
|---------|---------|---------|------|
| React Router v6 | installed | NavLink active-state highlighting | Replace current `Link` + `isActive()` |
| Tailwind CSS | installed | All visual styling via utility classes | Warm tokens already in `tailwind.config.js` |
| shadcn/ui | installed | DropdownMenu, Button already in Header | No new primitives needed |
| Lucide React | installed | Music-domain icons (GraduationCap, Music, Award) | Already imported in Sidebar/Dashboard |

### Supporting — Already in Place

| Library | Purpose | When to Use |
|---------|---------|-------------|
| `SidebarContext` (`src/contexts/SidebarContext.tsx`) | `isMobile`, `isDesktopOpen`, `setIsDesktopOpen` | Drives responsive collapse logic — do not replace |
| `useAuth` / `authContext.jsx` | `user.personalInfo.firstName` for greeting | Already used in Dashboard, Header |
| `getDisplayName()` / `nameUtils.ts` | Normalize firstName+lastName or fullName | Use for greeting in Dashboard admin view |
| CSS tokens (`--sidebar`, `--sidebar-foreground`) | Sidebar surface colors | Both tokens exist in `:root` — use them |

### No New Packages Needed

Everything required is already installed. This phase is pure visual restyling — zero new npm packages.

---

## Architecture Patterns

### Current Structure (What Exists)

```
src/
├── components/
│   ├── Layout.tsx            # Shell: Sidebar + Header + <main>
│   ├── Sidebar.tsx           # 686 lines — navigation, modals, search, quick actions
│   ├── Header.tsx            # Fixed top bar — logo, school year selector, user dropdown
│   └── dashboard/
│       ├── StatCard.tsx      # Richer card with trend/chart (gray icon, no color)
│       └── ...dashboards
├── components/ui/
│   └── StatsCard.tsx         # Simpler wrapper of Card — has color prop (blue/green/orange/purple/teal/amber)
├── contexts/
│   └── SidebarContext.tsx    # isMobile (< 768px), isDesktopOpen
└── pages/
    └── Dashboard.tsx         # Admin dashboard — tabs, StatsCard grid, charts
```

### Responsive Collapse — Existing Mechanism

The sidebar is already responsive. The `SidebarContext` detects `isMobile` (< 768px) and `isDesktopOpen`. Layout shifts main content margin via inline style:

```tsx
// Layout.tsx — current pattern
style={{
  marginRight: shouldShowSidebar && !isMobile && isDesktopOpen ? '280px' : '0'
}}
```

The sidebar itself uses:
```tsx
// Sidebar.tsx — current translate pattern
className={`fixed top-0 right-0 w-[280px] h-screen ...
  ${isMobile
    ? isOpen ? 'translate-x-0' : 'translate-x-full'
    : isDesktopOpen ? 'translate-x-0' : 'translate-x-full'
  }`}
```

This mechanism works correctly. **Do not replace the state management.** Only add a backdrop/overlay for mobile and ensure `transition-transform duration-300` is present (it already is).

### Pattern 1: NavLink Active Highlighting (React Router v6)

**Current problem:** Sidebar uses `Link` + `const isActive = useCallback((path) => location.pathname === path, [location.pathname])`. This is manual, verbose, and misses sub-routes.

**Recommended replacement:** React Router v6 `NavLink` with `className` function prop.

```tsx
// Source: https://reactrouter.com/6.30.3/components/nav-link
import { NavLink } from 'react-router-dom'

<NavLink
  to={item.href}
  onClick={closeMobileMenu}
  className={({ isActive }) =>
    `flex items-center justify-between px-4 py-3 mx-3 rounded-xl text-sm font-medium
     transition-all duration-150 rtl ${
      isActive
        ? 'bg-sidebar-foreground/10 text-sidebar-foreground font-semibold'
        : 'text-sidebar-foreground/70 hover:bg-sidebar-foreground/8 hover:text-sidebar-foreground'
    }`
  }
>
```

**Confidence:** HIGH — verified via Context7 (react-router v6 docs).

**Key subtlety:** For `NavLink` with `/dashboard` as the root route, add `end` prop to avoid it matching all child routes:
```tsx
<NavLink to="/dashboard" end className={...}>
```

### Pattern 2: Sidebar Warm Colors

**Current:** `bg-white border-l border-gray-200` — pure white, no warmth.

**Target:** Use the `--sidebar` CSS token that already exists: `--sidebar: 220 25% 18%` (dark navy-warm). This gives a dark sidebar that contrasts with the warm `--background: 30 25% 97%` of the main content.

```tsx
// Replace bg-white with bg-sidebar text-sidebar-foreground
className="fixed top-0 right-0 w-[280px] h-screen
  bg-sidebar text-sidebar-foreground
  border-l border-sidebar-foreground/10 shadow-sidebar
  rtl z-[55] transition-transform duration-300 ease-in-out flex flex-col"
```

**Important:** `sidebar` and `sidebar-foreground` are already defined in `tailwind.config.js`:
```js
sidebar: {
  DEFAULT: "hsl(var(--sidebar))",       // maps to 220 25% 18% — dark navy
  foreground: "hsl(var(--sidebar-foreground))", // maps to 30 25% 97% — warm light
}
```

Both tokens exist. Zero new token definitions needed.

### Pattern 3: Header Warm Styling

**Current:** `bg-white border-b border-gray-200` — matches the generic white sidebar.

**Target:** Keep white or switch to warm `bg-card` (already `30 20% 99%` — warm near-white). Add subtle coral accent on the left edge or brand element.

The key change is the avatar button: currently `bg-indigo-600`. Update to `bg-primary` to use the warm coral primary token.

```tsx
// Header avatar button — replace indigo with primary token
className="w-10 h-10 rounded-full bg-primary text-primary-foreground
  flex items-center justify-center hover:opacity-90
  transition-opacity focus-visible:ring-2 focus-visible:ring-ring"
```

### Pattern 4: Dashboard Personalized Greeting

**Current:** Dashboard header shows `לוח בקרה` (static) + school year + refresh button.

**Target:** `בוקר טוב, [firstName]` with time-awareness.

```tsx
// Dashboard.tsx — add before the stats cards
const getTimeGreeting = (): string => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'בוקר טוב'
  if (hour >= 12 && hour < 17) return 'צהריים טובים'
  if (hour >= 17 && hour < 21) return 'ערב טוב'
  return 'לילה טוב'
}

const firstName = user?.personalInfo?.firstName
  || getDisplayName(user?.personalInfo)?.split(' ')[0]
  || 'מנהל'

// In JSX:
<h1 className="text-2xl font-bold text-foreground">
  {getTimeGreeting()}, {firstName}
</h1>
```

**Note:** TeacherDashboard already uses `user?.firstName` directly. Admin dashboard should use `user?.personalInfo?.firstName` (the normalised path) — as confirmed in authContext.jsx line 149.

### Pattern 5: StatsCard Icon/Color Alignment

**Current StatsCard color mapping** (src/components/ui/StatsCard.tsx):
- `blue` → `bg-primary-100 text-primary-600` — already maps to warm coral via CSS token
- `amber` → `bg-amber-100 text-amber-600` — warm amber
- `teal` → `bg-teal-100 text-teal-600` — accent
- `green` → `bg-success-100 text-success-600` — warm green
- `orange` → `bg-orange-100 text-orange-600` — warm orange
- `purple` → `bg-purple-100 text-purple-600` — may feel out of place if going full warm

**Current icon usage in Dashboard.tsx:**
```tsx
icon={<Users />}      // students → color="blue" (→ coral) ✓
icon={<GraduationCap />} // teachers → color="green" ✓
icon={<Music />}      // orchestras → color="purple" ← change to "teal" or "amber"
icon={<Calendar />}   // rehearsals → color="orange" ✓
icon={<BookOpen />}   // theory → color="teal" ✓
icon={<Award />}      // bagruts → color="amber" ✓
```

**Action:** Change orchestras from `color="purple"` to `color="amber"` or `color="teal"` for visual warmth. No change to StatsCard component itself needed — only the `color` prop on callsites.

### Anti-Patterns to Avoid

- **Don't replace SidebarContext:** The state management is correct. Only change visual styling.
- **Don't add an icon-only collapsed mode:** Requirements say sidebar collapses (disappears on mobile) — not icon-rail on desktop. The existing translate-out behavior satisfies LAYOUT-04.
- **Don't hardcode sidebar colors:** Use `bg-sidebar` and `text-sidebar-foreground` tokens, not hardcoded hex values.
- **Don't add animated music icons:** The user decision from Phase 6 prohibits decorative infinite animations (`pulse-soft removed`). Static music icons (Music, GraduationCap) are fine; spinning/pulsing icons are not.
- **Don't break the z-index stack:** Sidebar is z-[55], hamburger is z-[60], backdrop is z-[50], header is z-[45]. Any new overlay elements must fit this stack.
- **Don't use emoji in component output:** User has no-emoji preference per project style.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Active nav state | Custom `isActive` + `location.pathname` comparison | `NavLink` from react-router-dom | Built-in, handles nested routes, no manual dependency |
| Responsive breakpoints | Custom JS resize listeners | Existing `SidebarContext.isMobile` (already uses `window.innerWidth < 768`) | Context already handles resize events |
| Time-of-day greeting | External library | Plain `new Date().getHours()` | Zero dependency, 5 lines |
| Color token palette | Custom CSS variables | Existing `--sidebar`, `--primary`, `--accent` tokens | All tokens already defined in `:root` |
| Hebrew date formatting | Hebrew date library | `new Date().toLocaleDateString('he-IL', {...})` | Already used in TeacherDashboard (line 616) |

---

## Common Pitfalls

### Pitfall 1: NavLink Matching `/dashboard` Too Broadly

**What goes wrong:** `<NavLink to="/dashboard">` matches `/dashboard/anything` as active, so the Home nav item lights up on subroutes.

**Why it happens:** React Router v6 NavLink uses `startsWith` matching by default.

**How to avoid:** Add the `end` prop to the dashboard/home nav item:
```tsx
<NavLink to="/dashboard" end className={...}>
```

**Warning signs:** Home icon stays highlighted when navigating to `/students`, `/teachers`, etc.

### Pitfall 2: Sidebar Token Background Breaks Text Contrast

**What goes wrong:** Using `bg-sidebar` (dark navy `220 25% 18%`) without updating ALL text colors inside the sidebar. Category labels, search input, badges, role badges all currently use `text-gray-500`, `text-gray-600`, `text-gray-700` — these won't be visible on dark background.

**Why it happens:** CSS utility classes reference hardcoded gray palette, not the sidebar token's foreground.

**How to avoid:** Systematically replace:
- `text-gray-*` → `text-sidebar-foreground/60` or `text-sidebar-foreground/80`
- `bg-gray-50` hover states → `hover:bg-sidebar-foreground/8`
- `border-gray-100`, `border-gray-200` → `border-sidebar-foreground/10`
- `bg-gray-200` skeleton → `bg-sidebar-foreground/20`
- Input `bg-gray-50 border-gray-200` → `bg-sidebar-foreground/10 border-sidebar-foreground/20`

**Warning signs:** Gray text is invisible (low contrast) on dark sidebar background.

### Pitfall 3: Header Width Calculation Stays Indigo-Tinted

**What goes wrong:** Header avatar and Home button use `bg-indigo-600` and `hover:bg-indigo-50 hover:border-indigo-300`. These are hardcoded indigo palette, not warm coral tokens.

**Why it happens:** Header was built before Phase 6 design tokens were fully applied.

**How to avoid:** Replace `bg-indigo-600` → `bg-primary`, `hover:bg-indigo-50` → `hover:bg-primary/10`, `text-indigo-600` → `text-primary`.

**Warning signs:** Avatar is indigo but all other UI elements are warm coral — visual inconsistency is jarring.

### Pitfall 4: Mobile Backdrop Missing on Sidebar Background Change

**What goes wrong:** After making the sidebar dark, the backdrop overlay (`bg-black bg-opacity-50`) may not need changing — but the hamburger button (`bg-white rounded-lg shadow-lg`) sitting on a dark sidebar may look wrong.

**Why it happens:** Hamburger button is outside the sidebar div but visually adjacent.

**How to avoid:** Keep hamburger as white/light (it sits against page background, not sidebar). Don't change hamburger to match sidebar dark color.

### Pitfall 5: Greeting Uses Wrong User Name Path

**What goes wrong:** `user?.firstName` returns `undefined` for admin users because the admin user object stores the name in `user.personalInfo.firstName`.

**Why it happens:** The auth context normalizes to `personalInfo.firstName` (line 149 of authContext.jsx), but some dashboards (TeacherDashboard) access `user?.firstName` as a fallback that sometimes works, sometimes doesn't.

**How to avoid:** Use the stable path:
```tsx
const firstName = user?.personalInfo?.firstName
  || getDisplayName(user?.personalInfo)?.split(' ')[0]
  || 'מנהל'
```

**Warning signs:** Greeting shows "בוקר טוב, undefined" in production.

### Pitfall 6: Quick Actions Section Loses Visibility on Dark Sidebar

**What goes wrong:** Quick actions section uses `hover:bg-green-50 hover:text-green-700 text-gray-600` — green hover on dark background is valid but `text-gray-600` is invisible.

**How to avoid:** Change quick actions text to `text-sidebar-foreground/70` and hover to `hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground`.

---

## Code Examples

Verified patterns from codebase inspection and React Router v6 docs:

### NavLink Active Pattern (React Router v6)

```tsx
// Source: Context7 /websites/reactrouter_6_30_3
import { NavLink } from 'react-router-dom'

// Replace Link + isActive() pattern with:
<NavLink
  to={item.href}
  end={item.href === '/dashboard'} // prevent broad matching on root route
  onClick={closeMobileMenu}
  className={({ isActive }) =>
    `flex items-center justify-between px-4 py-3 mx-3 rounded-xl text-sm
     font-medium transition-all duration-150 rtl ${
      isActive
        ? 'bg-sidebar-foreground/15 text-sidebar-foreground font-semibold border border-sidebar-foreground/20'
        : 'text-sidebar-foreground/70 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground'
    }`
  }
>
  <div className="flex items-center gap-2">
    <Icon className="w-4 h-4 flex-shrink-0" />
    <span>{item.name}</span>
  </div>
</NavLink>
```

### Sidebar Dark Background Application

```tsx
// Sidebar.tsx — main sidebar div
<div
  id="sidebar"
  className={`fixed top-0 right-0 w-[280px] h-screen
    bg-sidebar text-sidebar-foreground
    border-l border-sidebar-foreground/10
    shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.2)]
    rtl z-[55] transition-transform duration-300 ease-in-out flex flex-col ${
    isMobile
      ? isOpen ? 'translate-x-0' : 'translate-x-full'
      : isDesktopOpen ? 'translate-x-0' : 'translate-x-full'
  }`}
>
```

### Time-Aware Hebrew Greeting

```tsx
// Dashboard.tsx — top of admin dashboard section
const getTimeGreeting = (): string => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'בוקר טוב'
  if (hour >= 12 && hour < 17) return 'צהריים טובים'
  if (hour >= 17 && hour < 21) return 'ערב טוב'
  return 'לילה טוב'
}

const userFirstName = user?.personalInfo?.firstName
  || getDisplayName(user?.personalInfo)?.split(' ')[0]
  || 'מנהל'

// In JSX header section:
<div>
  <h1 className="text-2xl font-bold text-foreground">
    {getTimeGreeting()}, {userFirstName}
  </h1>
  <p className="text-sm text-muted-foreground">
    {currentSchoolYear?.name || 'שנת לימודים נוכחית'} |
    עדכון אחרון: {lastRefresh.toLocaleTimeString('he-IL')}
  </p>
</div>
```

### StatsCard Color Update (Dashboard.tsx callsites)

```tsx
// Before (generic blue/purple):
<StatsCard title="הרכבים פעילים" icon={<Music />} color="purple" />

// After (warm amber for Music):
<StatsCard title="הרכבים פעילים" icon={<Music />} color="amber" />

// Recommended mapping:
// Students (Users) → "blue"   → coral primary ✓ (already warm)
// Teachers (GraduationCap) → "green" ✓
// Orchestras (Music) → "amber"   ← CHANGE from purple
// Rehearsals (Calendar) → "orange" ✓
// Theory (BookOpen) → "teal" ✓
// Bagruts (Award) → "amber" ✓ (or keep amber for orchestras, use "orange" for bagruts)
```

### Sidebar Category Labels — Dark Background Update

```tsx
// Before (invisible on dark bg):
<span className="text-gray-500 uppercase tracking-wider">
  {category.label}
</span>

// After (visible on dark sidebar):
<span className="text-sidebar-foreground/50 uppercase tracking-wider text-xs font-semibold">
  {category.label}
</span>
```

---

## Key Implementation Decisions for Planner

### LAYOUT-01: Sidebar Colors

The `--sidebar: 220 25% 18%` token (dark navy) is already in `:root`. Using it creates a dark sidebar with warm light text (`--sidebar-foreground: 30 25% 97%`). This provides strong contrast and a distinct music-school identity. The warm background (`--background: 30 25% 97%`) provides natural warmth to the overall page; the sidebar accent is complementary.

**Alternative considered:** Light warm sidebar (amber-50 background). Decision rests with the planner — both are valid. The existing token value (`220 25% 18%`) suggests dark intent.

### LAYOUT-02: Active Nav Item

`NavLink` with `bg-sidebar-foreground/15 border border-sidebar-foreground/20` on dark sidebar creates clear visual distinction without looking like a tooltip.

### LAYOUT-03: Header Complement

Header stays light (`bg-white` or `bg-card`) to contrast with dark sidebar. The connection between header and sidebar is established through the primary token (coral) on interactive elements (avatar, home button, focus rings). No heavy redesign needed.

### LAYOUT-04: Responsive Behavior

Existing `isMobile < 768px` threshold and `translate-x-full` collapse pattern already satisfy tablet-width collapse. The planner should verify:
1. Main content `marginRight` resets to 0 when `isMobile` (this already happens in Layout.tsx)
2. Backdrop overlay appears on mobile when sidebar is open (already implemented)
3. No horizontal scroll at 768px viewport width (needs visual verification — not a code change)

### DASH-01: Dashboard Greeting

The success criterion says "בוקר טוב, יונה" — time-aware greeting using firstName from auth context. The admin dashboard currently shows `לוח בקרה` (static title). The greeting replaces the h1 text; the school year info moves to subtitle.

### DASH-02 to DASH-04: Dashboard Visual Identity

The main visual changes are:
1. StatsCard color props updated (1 prop change per card, 6 cards)
2. The icon choice is already domain-appropriate (GraduationCap, Music, Award — all music context)
3. The warm token system already makes `color="blue"` render as coral, `color="amber"` as warm amber

No layout restructuring of the dashboard grid is needed. The `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4` is a clean layout.

---

## State of the Art

| Old Approach | Current Approach | Relevance |
|--------------|------------------|-----------|
| Custom `isActive` + `Link` | `NavLink` with function className | Phase 12 switches to NavLink |
| White sidebar | Dark sidebar using `--sidebar` token | Phase 12 applies token |
| Static "לוח בקרה" title | Time-aware greeting | Phase 12 adds greeting |
| Generic blue/purple cards | Warm amber/coral/teal palette | Phase 12 updates color props |

---

## Split Recommendation (Plans)

The planner should split this into 2 plans:

**Plan 12-01: Layout Shell (Sidebar + Header + Layout)**
- Apply warm CSS tokens to sidebar surface
- Update all text/border/input colors inside sidebar for dark background
- Switch `Link` to `NavLink` for active state
- Update hamburger and toggle button colors
- Update Header avatar from `bg-indigo-600` to `bg-primary`
- Update Header Home button from indigo to primary token

**Plan 12-02: Dashboard Redesign**
- Add `getTimeGreeting()` + firstName greeting to admin Dashboard.tsx
- Update StatsCard `color` props for orchestras/bagruts
- Light visual pass on tab nav colors if still using old palette

These are two independent files (`Sidebar.tsx` + `Header.tsx` + `Layout.tsx` vs `Dashboard.tsx`) with no cross-dependency, making them safe to plan and execute separately.

---

## Open Questions

1. **Dark vs Light sidebar?**
   - What we know: `--sidebar: 220 25% 18%` is dark navy, already in `:root`; requirement says "warm colors" not specifically "dark"
   - What's unclear: Should sidebar be dark (Monday.com-like) or warm light (amber-tinted)?
   - Recommendation: Use the dark sidebar token (already defined). It creates the clearest visual distinction between nav and content, matches the "music branding" feel of professional platforms (Spotify, YouTube Music), and the token is already there ready to use. If user disagrees, a light warm sidebar is `bg-amber-50` or `bg-card`.

2. **Sidebar logo/branding mark?**
   - What we know: The Header has a logo (`/logo.png`); the sidebar has no branding mark
   - What's unclear: Should the sidebar top area show a school name or music icon?
   - Recommendation: Add the school name or a music note icon to the top of the sidebar (above the search input) using the existing user/auth data. This satisfies LAYOUT-01's "music branding feel" without requiring new assets.

3. **Icon order in nav items — left or right?**
   - What we know: Current sidebar puts icon on the right, text on the left (RTL: visually icon is at visual-end)
   - What's unclear: For RTL sidebars, icon-before-text (visual right) is the natural reading direction start
   - Recommendation: Flip to icon-start (physical right = visual start in RTL): `flex-row-reverse` or simply put Icon before text in JSX since this is RTL.

---

## Sources

### Primary (HIGH confidence)
- Codebase direct inspection: `src/components/Sidebar.tsx`, `src/components/Header.tsx`, `src/components/Layout.tsx`, `src/pages/Dashboard.tsx`, `src/components/ui/StatsCard.tsx`, `src/index.css`, `tailwind.config.js`, `src/contexts/SidebarContext.tsx`
- Context7 `/websites/reactrouter_6_30_3` — NavLink active styling with function className

### Secondary (MEDIUM confidence)
- WebSearch: RTL sidebar responsive collapse patterns (Flowbite, Tailwind docs) — verified against existing codebase implementation which already uses the same translate-x pattern

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and used
- Architecture: HIGH — full codebase inspection, no guesswork
- Pitfalls: HIGH — specific, traced to actual code line numbers
- Planner guidance: HIGH — split, naming, and sequence all grounded in file analysis

**Research date:** 2026-02-18
**Valid until:** 2026-04-18 (stable domain — no fast-moving deps)
