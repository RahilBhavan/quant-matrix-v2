# Landing Page Brutalist Redesign

**Date:** 2025-12-28
**Status:** Design Complete
**Scope:** Redesign landing page to match workspace brutalist UI system

## Overview

Redesign the landing page from its current dark/dramatic aesthetic to match the brutalist design system implemented in the workspace UI revitalization. This creates visual consistency and a seamless professional experience from entry to workspace.

## Design Philosophy

**Minimal and Direct** - Professionals don't need feature lists or marketing copy. They know why they're here.

**Institutional Precision** - Clean, high-contrast, intentional. Every element serves a purpose.

**Deliberate Entry** - The "hold to execute" interaction creates a professional mindset before entering the workspace.

## Visual Specifications

### Color Palette

All colors from the brutalist design system:

- **Canvas Background:** `#FAFAF8` (warm off-white)
- **Primary Text (Ink):** `#0A0A0A` (near-black)
- **Secondary Text:** `#666666` (medium gray)
- **Disabled/Subtle Text:** `#AAAAAA` (light gray)
- **Structural Borders:** `#D0D0D0` (light gray)
- **Active/Focus:** `#0A0A0A` (black)
- **Action Orange:** `#FF5500` (hold button fill)

### Typography

- **Logo:** IBM Plex Mono, Bold (700), 48-64px, Uppercase, Letter-spacing: 0.05em
- **Tagline:** Inter, Regular (400), 16px, Sentence case
- **Button Text:** IBM Plex Mono, Bold (700), 14px, Uppercase
- **Corner Indicators:** IBM Plex Mono, Regular (400), 12px, Uppercase
- **Disclaimer:** Inter, Regular (400), 12px

### Layout Grid

- **Base Unit:** 24px
- **Corner Spacing:** 24px from edges
- **Vertical Rhythm:** 12px, 24px, 48px spacing between elements

## Component Specifications

### Overall Layout

```
┌─────────────────────────────────────────────────────┐
│ [BETA]                            SEPOLIA TESTNET   │
│                                                      │
│                                                      │
│                  QUANT MATRIX                        │
│          Visual DeFi Logic Compiler                  │
│                                                      │
│              [ HOLD TO EXECUTE ]                     │
│                                                      │
│                                                      │
│                                                      │
│         Testnet only. Not financial advice.          │
└─────────────────────────────────────────────────────┘
```

**Container:**
- Full viewport height (100vh)
- Background: `#FAFAF8`
- Display: Flex, centered (align-items: center, justify-content: center)
- Padding: 24px

### Corner Indicators (Fixed Position)

**Top-Left - Beta Badge:**
- Text: "[BETA]"
- Position: Fixed, top: 24px, left: 24px
- Font: IBM Plex Mono, Regular, 12px, Uppercase
- Color: `#666666`

**Top-Right - Network Status:**
- Text: "SEPOLIA TESTNET"
- Position: Fixed, top: 24px, right: 24px
- Font: IBM Plex Mono, Regular, 12px, Uppercase
- Color: `#666666`
- Optional: Green dot indicator (`#00D395`, 8px × 8px square) if wallet connected
- Dot position: 12px to the left of text

### Central Content (Centered Vertically & Horizontally)

**Logo/Title:**
- Text: "QUANT MATRIX"
- Font: IBM Plex Mono, Bold (700), 48px (desktop) / 32px (mobile)
- Uppercase
- Letter-spacing: 0.05em
- Color: `#0A0A0A`
- Text-align: center
- Margin-bottom: 12px

**Tagline:**
- Text: "Visual DeFi Logic Compiler"
- Font: Inter, Regular (400), 16px (desktop) / 14px (mobile)
- Sentence case
- Color: `#666666`
- Text-align: center
- Margin-bottom: 48px

**Hold-to-Execute Button:**

*Dimensions:*
- Width: 240px (desktop) / 200px (mobile)
- Height: 60px (desktop) / 50px (mobile)
- Border: 2px solid `#0A0A0A`
- Border-radius: 0px (sharp edges)
- Background: Transparent (default)

*Typography:*
- Text: "HOLD TO EXECUTE"
- Font: IBM Plex Mono, Bold (700), 14px
- Uppercase
- Color: `#0A0A0A` (default), `#FFFFFF` (when holding)
- Text-align: center

*Interaction States:*

1. **Default (Idle):**
   - Border: 2px solid `#0A0A0A`
   - Background: Transparent
   - Text: `#0A0A0A`
   - Cursor: pointer

2. **Hover:**
   - Border: 2px solid `#FF5500` (action orange)
   - Background: Transparent
   - Text: `#0A0A0A`

3. **Holding (0-1200ms):**
   - Border: 2px solid `#FF5500`
   - Background: Linear gradient fill from left to right
     - Start: `transparent`
     - End: `#FF5500`
   - Animation: Linear progress over 1200ms
   - Text: Transitions to `#FFFFFF` as fill reaches 50%
   - Fill implementation: `linear-gradient(to right, #FF5500 ${progress}%, transparent ${progress}%)`

4. **Complete (1200ms):**
   - Background: `#FF5500` (full)
   - Text: `#FFFFFF`
   - Trigger: Call `onEnterMatrix()` callback
   - Transition to workspace begins

5. **Focus (Keyboard):**
   - Outline: 2px solid `#FF5500`, offset 2px
   - Same interaction as mouse hold (spacebar activates)

*Release Behavior:*
- If user releases before 1200ms, progress resets
- Animation: Gradient retracts, text color reverts
- Duration: 200ms ease-out

### Bottom Disclaimer

**Text:**
- Content: "Testnet only. Not financial advice."
- Position: Fixed, bottom: 24px, centered horizontally
- Font: Inter, Regular (400), 12px
- Color: `#AAAAAA` (subtle but present)
- Text-align: center

**Optional Separator:**
- 1px line above text
- Color: `#D0D0D0`
- Width: 200px, centered
- Margin-bottom: 12px from text

## Page Transition

**Exit Animation (on hold complete):**
- Fade out: 500ms
- Opacity: 1 → 0
- Optional blur: filter: blur(4px)
- Timing: ease-out
- Uses Framer Motion `AnimatePresence` (matches App.tsx pattern)

**Entry to Workspace:**
- Workspace fades in with `initial={{ opacity: 0, scale: 0.95 }}`
- Duration: 800ms
- Timing: circOut easing

## Responsive Breakpoints

### Mobile (< 768px)

- Logo: 32px font size
- Tagline: 14px font size
- Button: 200px × 50px
- Corner indicators: 12px from edges (instead of 24px)
- Bottom disclaimer: 12px from bottom

### Desktop (≥ 768px)

- Logo: 48px font size (or 64px for more impact)
- Tagline: 16px font size
- Button: 240px × 60px
- Corner indicators: 24px from edges
- Bottom disclaimer: 24px from bottom

## Accessibility

**Keyboard Navigation:**
- Button receives focus with Tab
- Focus state: 2px orange outline, 2px offset
- Spacebar activates hold (same as mouse)
- Screen reader: "Hold button for 1.2 seconds to enter workspace"

**Screen Reader:**
- Page title: "Quant Matrix - DeFi Strategy Builder"
- Skip link: "Skip to workspace" (hidden, appears on focus)
- Button aria-label: "Hold for 1.2 seconds to enter workspace"
- Network status aria-live region updates

**Reduced Motion:**
- If `prefers-reduced-motion: reduce`:
  - Skip progress animation, instant fill at 600ms
  - Skip blur transition
  - Maintain fade but faster (300ms)

## Implementation Notes

### Remove Existing Elements

From current `LandingPage.tsx`, remove:
- ThreeBackground component
- StrategyRow components and strategy showcase section
- All scroll-based content sections
- Ticker animation (ETH/GAS/TVL cycling)
- Bottom-left context text
- Mix-blend-difference effects
- Dark theme classes

### Keep Existing Logic

Maintain:
- `onEnterMatrix` callback prop
- Hold timeout mechanism (1200ms)
- `isHolding` state
- `startHold` and `endHold` functions
- Cleanup on unmount

### New Dependencies

None - all design system tokens already defined in Task 1 (Tailwind config, design-tokens.css)

### File Changes

- **Modify:** `components/LandingPage.tsx`
- **Remove dependency:** `components/ThreeBackground` import (if no longer used elsewhere)
- **Use:** Existing design system (Typography, colors from tailwind.config.js)

## Comparison: Before vs After

### Before (Current)
- Black background
- White text with mix-blend-difference
- 3D animated background
- Multiple scroll sections
- Ticker cycling in corner
- Dramatic, moody aesthetic

### After (This Design)
- Off-white canvas (#FAFAF8)
- Near-black text (#0A0A0A)
- No animations except hold progress
- Single centered screen (no scroll)
- Static network status
- Minimal, professional aesthetic

## Success Criteria

✅ Visual consistency with workspace brutalist design
✅ Maintains deliberate "hold to execute" entry pattern
✅ Professional, institutional appearance
✅ Clear network/beta status indicators
✅ Legal disclaimer present
✅ Fully accessible (keyboard, screen reader, reduced motion)
✅ Responsive across devices
✅ Clean code, no unnecessary dependencies
