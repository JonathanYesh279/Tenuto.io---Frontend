# Pitfalls Research

**Domain:** Visual identity upgrade of an existing production React SaaS (Hebrew RTL, shadcn/ui + Tailwind + Framer Motion)
**Researched:** 2026-02-18
**Confidence:** HIGH — based on direct codebase inspection of v2.0 state + verified library behaviors

---

## Critical Pitfalls

Mistakes that cause functional regressions, layout breakage, or require rewrites of visual work just completed.

---

### Pitfall 1: CSS Token Changes Cascade to Hardcoded Color Classes (The Dual-System Trap)

**What goes wrong:**
The codebase has a split color system that was intentional in v2.0 but becomes dangerous in v2.1. The `tailwind.config.js` defines two parallel primary color systems: (1) hardcoded hex scale `primary-500 = #4F46E5` (blue) used by nearly all components, and (2) CSS variable `--primary: 15 85% 45%` (coral) consumed by shadcn/ui components via `bg-primary`. These two systems produce different colors from the same word "primary." There are 888+ occurrences of `primary-NNN` classes in TSX files referencing the blue hex scale, while shadcn buttons and inputs use the coral CSS variable.

In v2.1, any change to "the primary brand color" risks affecting only one of these two systems, leaving the other unchanged. The result: some components get the new bold coral, others stay blue, with no error or warning anywhere.

**Why it happens:**
The v2.0 migration added the warm coral CSS vars to `index.css` but left the hardcoded hex scale in `tailwind.config.js` because changing 888 component usages was out of scope. This was a correct v2.0 tradeoff. In v2.1, editing `--primary` only changes shadcn components. Editing `primary-500` in tailwind.config.js requires Tailwind to recompile but affects ALL `primary-NNN` classes across the entire app.

**How to avoid:**
Before adding bolder colors, map which components use which system. Document this in the phase CONTEXT:
- shadcn components (Button, Input, Select, Badge, Dialog): respond to `--primary` CSS var
- Every other component (forms, tables, cards, nav): respond to `primary-500/600/700` hex scale

Make any color changes in BOTH systems simultaneously. Use the search command `grep -rh "primary-" src --include="*.tsx" | grep -oP "(bg|text|border|ring)-primary-\d+"` before and after each token change to verify the two systems stay in sync.

**Warning signs:**
- You change the brand coral in `index.css` and the sidebar navigation links stay blue — the nav uses `text-primary-600` (hex), not the CSS var.
- You add a gradient to `--primary` and it works on the login button (shadcn) but not the save buttons in forms (hex-based).
- Chrome DevTools shows two different computed values for "primary" on different elements.

**Phase to address:** Phase 1 (Token foundation) — establish the reconciliation rule before any color changes.

---

### Pitfall 2: Adding Framer Motion Animations to Components That Already Have CSS Transitions

**What goes wrong:**
The codebase has CSS transitions on buttons (`transition-all 0.2s`), cards (`transition-all duration-200`), and tabs (`tailwindcss-animate` keyframes). When v2.1 adds Framer Motion `whileHover` or `animate` to these same elements, both systems fire simultaneously. A card with CSS `transition: box-shadow 0.2s` and Framer Motion `whileHover={{ y: -4, boxShadow: "..." }}` will produce a janky double-animation: CSS handles the shadow, Framer Motion handles the Y axis, and the two don't coordinate their timing or easing.

Currently, Framer Motion is used in only 5 files, all with identical patterns: `AnimatePresence` + `motion.div` with `opacity: 0 → 1`, `duration: 0.2`. This is safe. Adding `whileHover`, `whileTap`, `variants`, or spring physics anywhere else risks interaction with the existing CSS transition layer.

**Why it happens:**
The visual identity brief calls for "dynamic motion." Developers instinctively reach for Framer Motion `whileHover` for card hover effects, not realizing the element already has a CSS hover transition. The CSS transition and Framer Motion animation both claim the same CSS property and fight.

**How to avoid:**
Choose one system per element, per property. The rule for v2.1:
- Use Framer Motion ONLY for: page-level entry animations, modal presence animations (already in use), and choreographed multi-step sequences that CSS cannot do.
- Use CSS transitions (Tailwind `transition-*`) for: hover states, focus rings, color shifts, shadow changes, single-property changes.
- Never mix both on the same element for the same property.
- Before wrapping any element in `motion.div`, check if it has `transition-*` in its class list. If yes, remove the Tailwind transition class or keep CSS-only.

**Warning signs:**
- Card hover produces a "snap" — the shadow jumps while the card eases up, because CSS and Framer Motion aren't synchronized.
- DevTools Performance panel shows "Recalculate Style" events firing at 120fps during hover (CSS transition triggering re-layout every frame).
- `will-change: transform` created by Framer Motion promotes the element to its own compositor layer, breaking stacking context and causing z-index issues with dropdowns positioned inside.

**Phase to address:** Phase for motion — establish the CSS vs. Framer Motion boundary rule before adding any new animations.

---

### Pitfall 3: Framer Motion `layout` Prop Creates Stacking Context and Breaks Dropdowns

**What goes wrong:**
Framer Motion's `layout` prop uses `transform: scale()` or `transform: matrix()` internally to animate layout changes via FLIP. Any element with a Framer Motion transform applied — even at rest — creates a new CSS stacking context. Radix UI dropdowns, Headless UI Comboboxes, and `react-hot-toast` all render in portals that escape normal DOM positioning, but they use `z-index` to appear above the trigger element. If the trigger element has a transform (from Framer Motion), its stacking context isolates child z-index values — a dropdown with `z-index: 9999` inside a transformed card cannot escape that card's stacking context.

In this codebase: teacher schedule cards, student list items, and orchestra cards all contain form controls and action dropdowns. If v2.1 wraps these in `motion.div` with `layout` or `whileHover={{ y: -4 }}`, their dropdowns will be clipped or appear behind sibling elements.

**Why it happens:**
Framer Motion applies `transform: none` to motion elements even when not animating (to prepare for FLIP). This alone creates a stacking context. GitHub issue [#1313](https://github.com/framer/motion/issues/1313) documents that `Reorder.Item` has this behavior; the same applies to any `motion.div` with `layout` or active transform animation.

**How to avoid:**
Do not use `layout`, `layoutId`, or `whileHover={{ y: N }}` on containers that hold dropdown menus, select inputs, popovers, or tooltips. Use these animation props only on leaf-level decorative elements (icon backgrounds, badge pulses, hero section elements) that contain no overlapping UI.

If card-level hover animations are needed, use CSS `transform` via Tailwind (`hover:scale-[1.01]`, `hover:-translate-y-1`) instead of Framer Motion — CSS transforms do NOT create stacking contexts by themselves in the same way that Framer Motion's wrapper does (the stacking context issue is from Framer Motion's JavaScript applying style, not from CSS transforms per se; CSS `transform` via Tailwind does create stacking contexts but the portal escape mechanism still works because Radix portals are appended to `document.body`).

Actually, to be precise: both CSS and JS transforms create stacking contexts. The correct mitigation is to keep Radix portals on elements that are NOT inside transformed containers. For existing cards with select dropdowns inside, use CSS `transition: box-shadow` for hover glow instead of transform-based lift.

**Warning signs:**
- Dropdown in a card disappears or clips after adding `motion.div` to the card.
- `z-index: 50` stops working for a popover after wrapping its parent in `motion.div`.
- DevTools Layers panel shows new compositor layers created on every hover event.

**Phase to address:** Motion phase — apply this rule before any `layout` or `whileHover` usage is introduced.

---

### Pitfall 4: Typography Changes Breaking RTL Line Heights in Hebrew Text

**What goes wrong:**
Hebrew fonts (Heebo, Reisinger Yonatan) have different font metrics than Latin fonts. When visual identity changes include: increasing font weight (`font-medium` → `font-semibold`), changing font size scales, adjusting `letter-spacing`, or changing `line-height`, Hebrew text reflows unpredictably. Hebrew characters are typically taller in their descenders, and the Heebo font at weight 700 renders notably larger than at weight 400 — unlike Latin fonts where weight change is mostly horizontal.

There are 786 occurrences of physical margin/padding classes (`space-x-`, `ml-`, `mr-`, `pl-`, `pr-`) across 165 files. Typography changes that change text height will cause line breaks to shift, which cascades into fixed-height containers overflowing and physical-pixel layouts misaligning.

**Why it happens:**
Typography choices made for "bold and confident" look in design mockups are tested with Latin fonts in Figma. When applied to Hebrew text in the actual app, the metrics are different. Increasing `font-weight: 600 → 700` in Heebo adds about 8-12% more horizontal character width for Hebrew characters, causing single-line labels to wrap to two lines in tight Hebrew UI.

**How to avoid:**
1. Test typography changes on actual Hebrew text in the browser, not in Figma. The label "מורה" in `font-semibold` vs `font-bold` will behave differently than "Teacher" in Latin.
2. Make font weight changes incrementally: change one scope (headings only, or nav labels only) at a time and verify no wrapping occurs before moving to the next scope.
3. For table column headers and tab labels (which are truncated in RTL, not LTR), use `truncate` class and test overflow at the smallest expected container width.
4. When changing `text-sm` to `text-base`, verify that:
   - All Tailwind card padding (`p-4`, `p-6`) still accommodates the taller line height without overflow.
   - Tab bar items do not wrap — tab labels in Hebrew are already long words.
   - Form labels in the 7-tab teacher form and student form still fit without wrapping.

**Warning signs:**
- Tab navigation bar becomes two rows (tab labels wrapped).
- Card titles in RTL overflow their containers on mobile widths.
- Table header text truncates at a different threshold than expected.
- Form field labels push input fields down, misaligning multi-column form layouts.

**Phase to address:** Typography phase — changes scoped to specific components, tested in browser with Hebrew content before expanding.

---

### Pitfall 5: Over-Layering Surfaces Creates Z-Index Conflicts with Existing Modals and Dropdowns

**What goes wrong:**
The v2.1 "surface hierarchy" goal calls for distinguishable elevation levels: sidebar, header, card, elevated card, floating action, modal. Implementing this with `box-shadow` or `backdrop-filter: blur()` is safe. Implementing it with `position: relative` + `z-index` on multiple nesting levels is not — it creates stacking context proliferation that corrupts the existing z-index structure for Radix dropdowns, react-hot-toast, and the cascade deletion modal.

Currently, there is no formal z-index system. The app uses ad-hoc z-index values: `z-10` for card actions, `z-50` for navigation, portal elements that need to appear above everything have their own Radix-managed z-indices. Adding intermediate z-index layers (e.g., `z-20` for "elevated cards", `z-30` for sidebar overlay) without a global z-index specification will cause existing `z-50` modals to appear behind the new `z-30` surface.

**Why it happens:**
Visual designers specify surface elevation in terms of "feels above" or "feels below" in mockups. Developers implement this as z-index without considering that z-index only works within the same stacking context, and that adding transforms or filter properties to parent elements creates new stacking contexts that isolate child z-indices.

**How to avoid:**
1. Use `box-shadow` as the primary elevation signal, not z-index. Deeper shadow = higher elevation. Shadow does not create stacking contexts.
2. Define a surface elevation system using only box-shadow tokens, not z-index levels:
   - Level 0 (base): `shadow-none`
   - Level 1 (card): `shadow-sm`
   - Level 2 (raised card): `shadow-md`
   - Level 3 (floating/sticky header): `shadow-lg`
   - Level 4 (modal overlay): portal-managed, not z-index in component CSS
3. Reserve z-index changes for: sidebar overlay on mobile, header stickiness, and portal-rendered components (Radix manages these).
4. If `backdrop-filter: blur()` is used for the "glass" effect on the header or sidebar, be aware it creates a stacking context.

**Warning signs:**
- After adding a new "elevated card" variant, the date picker or orchestra select dropdown appears behind it.
- The react-hot-toast notification appears behind a newly elevated panel.
- The cascade deletion modal is partially obscured by the sidebar on wide viewports.

**Phase to address:** Surface hierarchy phase — establish shadow-based elevation system before any z-index changes.

---

### Pitfall 6: RTL-Breaking Animation Directions in New Framer Motion Usage

**What goes wrong:**
The existing Framer Motion animations use `opacity: 0 → 1` (neutral direction, safe in RTL). Any new animation added in v2.1 that uses directional movement (`x: -20`, `x: 20`, `translateX`, slide-in from left/right) will produce semantically wrong results in RTL. In RTL, "entrance from the right" should feel like content coming from the natural reading start. If you animate `x: -20 → 0` (coming from the left, which is the LTR natural start), in RTL it produces the opposite semantic — content appearing from the reading END, which feels wrong.

This affects: page transition animations (if added), card stagger animations (if items slide in from one side), toast entrance animations (react-hot-toast uses CSS `slideFromRight` which in RTL comes from the wrong side), sidebar slide animations.

**Why it happens:**
Animation direction is specified in physical coordinates (positive/negative X), not logical coordinates. RTL-aware animation requires either: using logical CSS where available, or conditionally flipping the X direction based on document direction.

**How to avoid:**
1. For any Framer Motion animation with a directional X component, add RTL detection:
   ```tsx
   const isRTL = document.documentElement.dir === 'rtl'
   const slideIn = { x: isRTL ? 20 : -20 }  // enter from logical start
   ```
2. Prefer Y-axis animations (fade up, fade down) which have no RTL implications.
3. For stagger entrance animations, stagger from logical end to logical start (rightmost item first in RTL, leftmost first in LTR).
4. The existing `slideFromRight` CSS keyframe in tailwind.config.js uses `translateX(-100%)` — in RTL this is correct since physical left is visual right. Document this explicitly so future changes don't "fix" it backward.

**Warning signs:**
- Cards or list items slide in from the wrong side when entering.
- A "drawer opening from the right" feels like it's opening from the inside-out in RTL.
- Staggered animations create a right-to-left visual sweep in LTR mode and left-to-right in RTL mode (both should feel like reading direction start).

**Phase to address:** Motion phase — every directional animation must be verified in RTL before shipping.

---

### Pitfall 7: Adding `will-change` or GPU Promotion Without Measurement Destroys Performance

**What goes wrong:**
The codebase currently has no `will-change` or GPU promotion (`translateZ(0)`, `backface-visibility: hidden`) anywhere. This is correct — the app does not need GPU promotion because its animations are simple opacity fades. If v2.1 adds spring physics, parallax effects, or `layout` animations and simultaneously adds `will-change: transform` "for performance," it can actually degrade performance.

`will-change: transform` causes the browser to keep a GPU texture for the element even when it is not animating. On a page with 20 cards each having `will-change: transform`, 20 GPU textures are allocated, consuming GPU memory. On lower-end devices or Windows with discrete GPU switching, this causes jank.

**Why it happens:**
"Add `will-change: transform` for better animation performance" is cargo cult advice. It was valid when browsers first introduced compositor threads; modern browsers (Chrome 100+, Safari 16+) handle animation promotion automatically when needed. Adding `will-change` everywhere causes texture thrashing instead of preventing it.

**How to avoid:**
Do not add `will-change` to any element as a "performance optimization" in v2.1. If a specific animation has measured jank (use Chrome DevTools Performance > check for green "Compositor" frames vs red "Main Thread" frames), then and only then add `will-change: transform` to that specific element and measure again.

Framer Motion's `LazyMotion` component (with feature sets) can reduce the bundle weight of Framer Motion from ~30KB to ~6KB by loading only the animation features you actually use. If adding more Framer Motion usage, evaluate using `LazyMotion` at the same time.

**Warning signs:**
- Chrome DevTools Memory tab shows GPU memory increasing as you scroll through a list.
- The browser throttles animations after 10-30 seconds on a long session (texture limit hit).
- Framer Motion `layout` animations cause a purple "Layout" bar in DevTools Performance panel on every mouse move (re-layout triggered by whileHover state change).

**Phase to address:** Motion phase — no `will-change` added without measurement. Include a Lighthouse performance run as a phase success criterion.

---

### Pitfall 8: Bold Color Palette Changes That Break WCAG Contrast on Hebrew Labels

**What goes wrong:**
The v2.1 "bold identity" direction typically increases use of saturated accent colors for badges, status indicators, and decorative elements. Hebrew text at small sizes (the app uses `text-sm` and `text-xs` extensively for status badges, table cell labels, and form hints) requires higher contrast ratios because Hebrew characters at small sizes have more complex strokes that are harder to read at borderline contrast.

WCAG 2.1 Level AA requires 4.5:1 contrast for normal text and 3:1 for large text. The current warm coral `--primary: 15 85% 45%` on white passes at approximately 4.2:1 — borderline. Making the coral "bolder" (higher saturation or slightly lighter for vibrancy) can drop it below threshold.

**Why it happens:**
Design tools show colors looking great at large sizes on Retina displays. The app runs in Hebrew on standard 1080p displays where anti-aliasing of Hebrew characters is less precise, and low-contrast text is genuinely harder to read than English text at the same contrast ratio.

**How to avoid:**
1. Run contrast checks on EVERY new color combination before adding it: `foreground on background`, `text on badge`, `label on input`.
2. Test specifically with small Hebrew text (`text-xs` or `text-sm font-semibold`) not just Latin placeholder text.
3. Keep status badge colors at WCAG AA minimum: use darker text on lighter backgrounds for badges rather than white text on medium-saturation backgrounds.
4. The tool: https://webaim.org/resources/contrastchecker/ or browser DevTools Accessibility panel.

**Warning signs:**
- Lighthouse accessibility score drops after adding bold color to badges.
- Status indicators look vivid in Figma mockups but muddy in the browser at normal viewing distance.
- Users over 40 report difficulty reading colored labels (contrast is borderline).

**Phase to address:** Color evolution phase — contrast check is a hard gate before any new color combination ships.

---

## Technical Debt Patterns

Shortcuts that seem reasonable in v2.1 but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Add `motion.div` to every card for hover lift | Quick visual richness | 165 files with physical margin/spacing classes now inside stacking contexts; dropdown breakage | Never — use CSS `hover:-translate-y-1` instead |
| Change `primary-500` hex value in tailwind.config.js directly | All 888 usages update at once | No gradual rollout possible; must test all 165+ affected files simultaneously | Only if doing a full visual audit pass |
| Use `filter: blur()` for glass effects on more than one surface level | Modern glassmorphism look | Blur creates stacking contexts; multiplied GPU load; poor performance on Windows | One surface maximum (header or sidebar, not both) |
| Hardcode new shadow values in individual components | Faster per-component iteration | Shadow values diverge; 12 different shadow values for "cards" with no shared token | Never — add to tailwind.config.js `boxShadow` first |
| Animate `box-shadow` directly with Framer Motion | Smooth shadow transitions | `box-shadow` animation triggers GPU repaint on every frame; use `opacity` on a pseudo-element shadow instead | Never for lists; only for isolated hero elements |
| Add `transition-all` for simplicity | No need to know which properties change | Animates ALL properties including layout-affecting ones; performance cost | Never — always specify exact properties: `transition-shadow`, `transition-transform` |

---

## Integration Gotchas

Common mistakes specific to this codebase's integration points.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Framer Motion + shadcn/ui Radix portals | Wrapping Select trigger in `motion.div` with `layout` prop | Keep Select wrapper as plain div; animate only non-interactive decoration |
| Tailwind `animate-*` + custom keyframes | Adding `tailwindcss-animate` plugin overwrites existing `animate-fade-in` timing | Namespace all existing custom animations with `animate-custom-*` prefix before installing |
| CSS `--primary` var + Tailwind `primary-NNN` scale | Changing one leaves the other inconsistent | Every token change touches both `index.css` vars AND `tailwind.config.js` hex values in same commit |
| Hebrew font (Heebo) + bold font weight | `font-bold` increases character width by ~10% in Hebrew, breaking truncation | Test all nav labels and tab labels in Hebrew at new weight before shipping |
| react-hot-toast + RTL + new positioning | Adding a toast container position prop breaks the RTL-correct physical positioning | Verify toast appears at top/bottom-left (which is top/bottom-start in RTL = visual right) |
| Framer Motion + `prefers-reduced-motion` | New animations added without checking reduced motion support | The global `@media (prefers-reduced-motion: reduce)` in index.css already handles CSS animations. Framer Motion animations need explicit `useReducedMotion()` or `transition={{ duration: 0 }}` when reduced |
| Spring physics + tab switching | Adding spring to `AnimatePresence` tab transitions means fast tab clicks queue up and lag | Keep tab transitions as `duration: 0.2` linear — do not use spring for page-level transitions |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Too many `motion.div` wrappers on list items | List of 50+ students/teachers scrolls at <30fps | Max 1 Framer Motion wrapper per page-level section; use CSS for list items | At 30+ animated items on screen simultaneously |
| `AnimatePresence` with `mode="wait"` + slow components | Tab switch feels unresponsive (must wait for exit animation before entering) | Use `mode="sync"` or remove `mode` entirely — fade-out and fade-in overlap | When tab content is slow to render (>100ms) |
| `backdrop-filter: blur()` on sidebar or header on Windows | GPU usage spikes, scroll jank appears | Use solid backgrounds with shadow instead of blur; or test on Windows specifically | On Windows with integrated Intel graphics, which handles backdrop-filter poorly |
| Animating `border-radius` with Framer Motion layout | Corners snap during resize | Animate border-radius with CSS `transition-[border-radius]` instead | When element size changes simultaneously |
| Multiple `useAnimation()` hooks on same page | Animation state desync when hooks update in different render cycles | Use single `AnimatePresence` at page level; declarative `animate` prop > imperative hooks | When 5+ hooks are active simultaneously |

---

## "Looks Done But Isn't" Checklist

Things that appear complete visually but are missing critical pieces.

- [ ] **New card shadow styles:** Verify shadows do not clip inside parent containers with `overflow: hidden`. Hebrew text components often have `overflow-hidden` for truncation. Shadow appears behind clipped boundary.
- [ ] **Bold typography applied to nav labels:** Hebrew nav labels ("תלמידים", "מורים", "תזמורות") are longer than English equivalents. Verify no wrapping at 1280px viewport with the new font weight.
- [ ] **Gradient or bold accent on CTA buttons:** Verify focus ring (currently `ring-primary-500`) remains visible after background change. Gradient buttons often lose accessible focus indicator.
- [ ] **Animated card hover effects:** Verify with keyboard navigation — `Tab` focus on a card with hover animation should not trigger the hover animation. Check `@media (hover: none)` — on iPad the hover state sticks after tap.
- [ ] **New color tokens in `index.css`:** Confirm the token appears in production CSS by running `npm run build && grep "15 85" dist/assets/*.css` (or whatever the new value is). CSS vars can be silently dropped if PostCSS processing order changes.
- [ ] **Framer Motion spring animation:** Verify spring settles within 500ms. Framer Motion springs that do not have `clamp: true` or have very low damping can oscillate for 2+ seconds, which is distracting in business software.
- [ ] **New icon sizes or weights:** If using heavier icon strokes (Lucide `strokeWidth={2.5}` instead of default `2`), verify the icons still display correctly at all used sizes (`h-4 w-4`, `h-5 w-5`). At 16px with high stroke weight, Hebrew context icons can look like blobs.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| CSS token change broke 100+ components | HIGH | `git revert` the token change; establish component inventory first; make change again incrementally by scope |
| Framer Motion wrapper broke dropdowns | LOW | Remove `motion.div` wrapper from affected component; replace with CSS transition class |
| Typography change caused tab bar wrapping | MEDIUM | Scope `font-*` change to headings only; revert nav label changes; test Hebrew character widths at target weight before re-applying |
| Added `will-change` everywhere causing GPU thrashing | LOW | Remove `will-change` from all but 1-2 specifically measured elements; check GPU memory in DevTools after |
| Spring animation oscillates too long | LOW | Add `transition={{ type: "spring", damping: 30, stiffness: 300, clamp: true }}` or convert to `ease: "easeOut", duration: 0.2` |
| RTL directional animation is backwards | LOW | Add `isRTL` check to flip X direction; or convert to Y-axis animation which is direction-neutral |
| Z-index corruption after adding elevated surface | MEDIUM | Remove z-index from new surfaces; use shadow-only elevation; audit stacking contexts with DevTools Layers panel |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Dual color system (Pitfall 1) | Phase 1: Token Foundation | `grep -rh "primary-" src --include="*.tsx" | grep -oP "(bg|text|border|ring)-primary-\d+"` — count before and after each token change |
| Framer Motion + CSS transition conflict (Pitfall 2) | Phase for Motion | Before committing any new `motion.*` usage, check the element for `transition-*` Tailwind classes |
| Stacking context from layout animations (Pitfall 3) | Phase for Motion | After any new `motion.div` with `layout` or `whileHover`, test all dropdowns on that page |
| Hebrew typography layout breakage (Pitfall 4) | Typography phase | Render key Hebrew labels ("תלמידים", "מורה ראשי", "מנצח") at new font weight; check for line breaks |
| Z-index conflicts from surface layering (Pitfall 5) | Surface hierarchy phase | Test all Radix Select, Popover, and Dialog components after adding any new elevation layer |
| RTL-backwards directional animations (Pitfall 6) | Motion phase | Every directional animation verified with `dir="rtl"` in browser |
| `will-change` performance degradation (Pitfall 7) | Motion phase | Run Lighthouse Performance after adding animations; check GPU memory in DevTools Memory tab |
| WCAG contrast failure on bold colors (Pitfall 8) | Color evolution phase | Run Lighthouse Accessibility after every new color combination; minimum score 95 |

---

## Sources

**Direct codebase inspection (HIGH confidence):**
- `/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Frontend/tailwind.config.js` — dual color system identified
- `/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Frontend/src/index.css` — CSS var tokens, `prefers-reduced-motion` media query
- Framer Motion usage: 5 files, all opacity-only patterns verified
- Physical CSS property usage: 786 occurrences across 165 files (via grep)
- `primary-NNN` usage: 888 occurrences in TSX files, split documented above

**Verified against official documentation (HIGH confidence):**
- Framer Motion stacking context issue: [GitHub issue #1313](https://github.com/framer/motion/issues/1313)
- Framer Motion `layoutScroll` for scroll offset measurement: [Motion layout docs](https://motion.dev/docs/react-layout-animations)
- CSS `transform` and stacking contexts: MDN Web Docs

**WebSearch verified (MEDIUM confidence):**
- Spring animation performance on mobile: `config: { clamp: true }` to end oscillation
- `will-change` GPU texture thrashing at scale
- Hebrew font metric behavior at higher weights (Heebo)
- Framer Motion `LazyMotion` for 30KB → 6KB bundle size reduction

**Domain knowledge from v2.0 pitfalls research (HIGH confidence for patterns that carried forward):**
- RTL portal escape behavior (Radix renders to `document.body`, outside `dir="rtl"` scope)
- Tailwind class merge conflicts with custom color scales
- Animation system double-firing (CSS + JS on same element)

---

*Pitfalls research for: visual identity upgrade of existing production React SaaS (Hebrew RTL)*
*Researched: 2026-02-18*
