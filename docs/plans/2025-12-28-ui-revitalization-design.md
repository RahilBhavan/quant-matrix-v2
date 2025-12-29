# Quant Matrix UI Revitalization Design

**Date:** 2025-12-28
**Status:** Design Complete
**Scope:** Complete UI/UX overhaul across entire application

## Executive Summary

This design document outlines a complete reimagining of the Quant Matrix user interface, transforming it from a "generic Web3" aesthetic to an **institutional-grade financial terminal** inspired by brutalist design principles and the Sciemo.ai aesthetic.

**Core Philosophy:** "Institutional Precision"

The new design prioritizes:
- **Clarity over decoration** - Every element serves a functional purpose
- **Precision over friendliness** - Users are professionals, not casual traders
- **Typography as interface** - Clean hierarchy through scale and weight, not color
- **Protocol awareness** - Visual system adapts to show context (Uniswap pink when swapping, Aave purple when lending)

## Design System Foundation

### Visual Rules (Non-Negotiable)

1. **0px border radius globally** - All elements are sharp-edged rectangles
2. **No soft shadows** - Depth through borders, scale, and solid overlays only
3. **90-degree angles** - All layouts snap to orthogonal grid (24px base unit)
4. **High contrast** - Clear visual hierarchy through size and color, not subtlety
5. **Monospace for data** - Numbers, addresses, code always in monospace
6. **Sans-serif for UI** - Clean, legible font for labels and controls

### Color System

**Base Colors:**
- **Canvas**: `#FAFAF8` - Warm off-white, reduces eye strain vs pure white
- **Primary Text**: `#0A0A0A` - Near-black for maximum legibility
- **Structural Borders**: `#D0D0D0` - Light gray for non-interactive boundaries
- **Active Borders**: `#0A0A0A` - Black for focus states and active elements

**Protocol-Aware Accent System:**

Instead of a single accent color, we use protocol colors strategically to create context:

- **Action Orange**: `#FF5500` - Primary CTAs, active states
- **Uniswap Pink**: `#FF007A` - When Uniswap blocks/actions are active
- **Aave Purple**: `#B6509E` - When Aave blocks/actions are active
- **Success Green**: `#00D395` - Confirmations, positive metrics, profit
- **Alert Red**: `#FF4444` - Errors, warnings, losses

**Rationale:** Users see Uniswap's pink when working with swaps, Aave's purple when lending. This creates visual coherence between the tool and the protocols being used.

### Typography

**Primary Fonts:**
- **UI/Labels/Headers**: Inter or IBM Plex Sans
  - Weights: Regular (400), Medium (500), Bold (700)
  - All-caps for section headers only
  - Sentence case for most UI labels

- **Data/Code/Numbers**: IBM Plex Mono or JetBrains Mono
  - Weight: Medium (500) for all data
  - Used for: wallet addresses, token amounts, percentages, timestamps, error codes

**Type Scale:**
- **H1 (Page Title)**: 24px, Bold, Uppercase, Letter-spacing: 0.05em
- **H2 (Section Header)**: 16px, Bold, Uppercase
- **H3 (Card Title)**: 14px, Medium, Sentence Case
- **Body**: 14px, Regular
- **Small**: 12px, Regular
- **Data (Monospace)**: 14px, Medium

**Text Colors:**
- Primary: `#0A0A0A` (near-black)
- Secondary: `#666666` (medium gray for meta-data)
- Disabled: `#AAAAAA` (light gray)

### Grid System

**24px Base Unit:**
- All spacing is a multiple of 24px: 24, 48, 72, 96, etc.
- Smaller increments (12px, 6px) allowed for micro-spacing within components

**Layout Grid:**
- 12-column grid
- Gutter: 24px
- Margin: 48px (desktop), 24px (tablet), 12px (mobile)

## Global Layout & Navigation

### Context-Aware Header

**Structure (60px height, 1px bottom border):**

```
┌─────────────────────────────────────────────────────────────────┐
│ QUANT MATRIX | WORKSPACE    [TAB1][TAB2][TAB3]    SEPOLIA | 0x12│
└─────────────────────────────────────────────────────────────────┘
```

**Left Section (33%):**
- Logo: "QUANT MATRIX" in monospace, `letter-spacing: -0.02em`
- Current view: Small label showing active view (WORKSPACE / BACKTEST / PORTFOLIO / OPTIMIZE)

**Center Section (33% - Context-Aware):**

Displays controls relevant to current view:
- **In Workspace**: Block category tabs (TRADING | LENDING | LIQUIDITY | LOGIC | RISK)
- **In Backtest**: Date range selector + capital input + interval dropdown
- **In Portfolio**: Filter toggles (ALL | ACTIVE | ARCHIVED)
- **In Optimize**: Algorithm selector (BAYESIAN | GENETIC) + iteration count

**Right Section (33%):**
- Network indicator: `SEPOLIA` with colored dot (green = connected, red = disconnected)
- Wallet display:
  - Disconnected: `[ DISCONNECTED ]`
  - Connected: `[ 0x12...89 | 2.45 ETH ]`
  - Click: Opens wallet modal
  - Hover: Black background, white text (instant transition, no animation)

### View Switching (Command Palette)

**Primary Navigation:** Keyboard-first command palette

- Press `/` anywhere to open command palette
- Overlay modal (centered, 600px wide):
  ```
  ┌─────────────────────────────────┐
  │ > _                             │  ← Search input
  ├─────────────────────────────────┤
  │ 1. WORKSPACE                    │
  │ 2. BACKTEST                     │
  │ 3. PORTFOLIO                    │
  │ 4. OPTIMIZE                     │
  └─────────────────────────────────┘
  ```
- Type to filter: "work", "back", "port", "opt"
- Number shortcuts: `1` = Workspace, `2` = Backtest, etc.
- Arrow keys + Enter to select

**Visual Hint:** Small `[/]` text in bottom-right corner of screen

### Empty State

When canvas is empty, show centered message:
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│      [ CANVAS READY ]               │
│                                     │
│  SELECT CATEGORY ABOVE OR           │
│  PRESS / TO BEGIN                   │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Key Principle:** No validation errors on empty state. No noise. Just guidance.

## Workspace Canvas & 3D Block System

### The Canvas

**Background:**
- Base: `#FAFAF8` (warm off-white)
- Dot grid overlay: 1px dots in `#E0E0E0`, 24px spacing
- Grid provides spatial reference without visual noise
- Grid fades to 30% opacity when blocks are being dragged

**Pan & Zoom:**
- Infinite canvas with smooth panning
- Zoom levels: 50%, 75%, 100%, 125%, 150%
- Zoom controls: Bottom-left corner `[ - 100% + ]`
- Keyboard: `Cmd +` / `Cmd -` / `Cmd 0` (reset)

### The 3D Spine

**Physical Structure:**

Instead of a weak vertical line, we render a **raised platform**:
- Center vertical column: 120px wide
- Isometric depth effect shows it as a 3D surface
- Grid lines on platform indicate snap points (24px spacing)
- When empty: Dashed outline (2px orange) with text `[ DROP FIRST BLOCK HERE ]`

**Snap Behavior:**
- Blocks snap to 24px grid on spine
- Visual feedback: Orange snap guides appear when dragging near snap point
- Audio feedback (optional): Subtle click sound on snap

### Block Visual Design

**Structure (120px wide, variable height):**

```
┌─────────────────────────┐
│ UNISWAP                 │  ← Header (20px, protocol color bg, white text)
├─────────────────────────┤
│         ⟲               │  ← Body (min 60px, white bg)
│    Swap Tokens          │     Icon: 24x24 geometric shape
│                         │     Label: Sans-serif, sentence case
├─────────────────────────┤
│ • USDC → WETH          │  ← Params preview (optional, gray)
│ • 1000.00              │     Monospace, 12px, `#666666`
└─────────────────────────┘
```

**Component Breakdown:**

**Header (20px height):**
- Background: Protocol color (Uniswap: `#FF007A`, Aave: `#B6509E`)
- Text: Protocol name, uppercase, sans-serif, white
- Padding: 0 8px

**Body (60-100px height):**
- Background: White
- Icon: Centered, 24x24px, black geometric shape
- Label: Centered below icon, 14px, sentence case

**Params Preview (optional, 30px height):**
- Background: `#F5F5F3` (very light gray)
- Text: Monospace, 12px, gray
- Shows key parameters (max 2 lines)
- Format: `• TOKEN: VALUE`

**Connection Sockets:**
- **Top socket**: 4x4px solid square, top center of block
- **Bottom socket**: 4x4px solid square, bottom center of block
- **Colors**:
  - Empty: `#CCCCCC` (light gray)
  - Connected: `#0A0A0A` (black)
  - Incompatible: `#FF4444` (red)
  - Hovered: Protocol color

**Block States:**

**Idle:**
- Body: White background
- Header: Protocol color
- Border: 1px `#D0D0D0`

**Hovered:**
- Border grows to 2px black (inward, no size change)
- Cursor: grab

**Selected:**
- Body: `#0A0A0A` (black)
- Text: White
- Header: Inverted (white bg, black text)
- Border: 2px protocol color

**Error:**
- Border: 2px `#FF5500` (orange)
- Diagonal hatch overlay: 2px lines at 45°, `rgba(255,85,0,0.1)`

**Executing (Live):**
- Header: Pulsing glow effect (protocol color, 500ms pulse)
- Border: 2px protocol color

**Dragging:**
- Opacity: 50%
- Cursor: grabbing
- Original position shows dashed outline

## Block Palette & Connection System

### Categorized Tab System

**Tab Bar (40px height, below main header when in Workspace):**

```
[ TRADING ]  [ LENDING ]  [ LIQUIDITY ]  [ LOGIC ]  [ RISK ]
   active      inactive     inactive      inactive   inactive
```

**Tab Styling:**
- **Active**:
  - Bottom border: 2px protocol color
  - Text: Bold, sentence case
  - Background: Subtle tint of protocol color (`rgba(color, 0.05)`)

- **Inactive**:
  - Text: Gray (`#666666`), regular weight
  - No border
  - Hover: Text changes to protocol color

**Tab-to-Category Mapping:**
- TRADING → Shows Uniswap blocks (color: `#FF007A`)
- LENDING → Shows Aave blocks (color: `#B6509E`)
- LIQUIDITY → Shows Uniswap LP blocks (color: `#FF007A`)
- LOGIC → Shows conditional blocks (color: `#FFD93D`)
- RISK → Shows risk management blocks (color: `#6C63FF`)

### Block Grid (Palette)

**Layout (appears below tabs when category selected):**

Shows 4-6 blocks per row in a tight grid:

```
┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐
│ UNISWAP   │  │ UNISWAP   │  │ UNISWAP   │  │ UNISWAP   │
│ ⟲         │  │ 💹        │  │ 💧        │  │ 💰        │
│ Swap      │  │ Price     │  │ Create LP │  │ Collect   │
│ Tokens    │  │ Check     │  │           │  │ Fees      │
│ [⋮⋮]      │  │ [⋮⋮]      │  │ [⋮⋮]      │  │ [⋮⋮]      │
└───────────┘  └───────────┘  └───────────┘  └───────────┘
```

**Palette Card (80px x 100px):**
- Protocol color top bar: 4px height
- Icon: 32px centered
- Label: 12px, two lines max, centered
- Drag handle: `[⋮⋮]` in bottom-right corner (appears on hover)

**Drag Behavior:**
1. User clicks and drags palette card
2. Dashed orange outline (2px) appears at cursor position
3. Outline snaps to grid points on spine (24px increments)
4. Orange snap guides show alignment
5. Release → Block materializes with quick fade-in (100ms linear)
6. If dropped directly below another block → auto-connects

### Smart Contextual Suggestions

After adding a block, palette shows **contextual chips** at top:

```
┌────────────────────────────────────────────────────────────┐
│ Often paired with: [ AAVE BORROW ] [ HEALTH CHECK ]        │
└────────────────────────────────────────────────────────────┘
```

**Logic:**
- Added `AAVE_SUPPLY` → Suggests `AAVE_BORROW`, `HEALTH_FACTOR_CHECK`
- Added `UNISWAP_SWAP` → Suggests `PRICE_CHECK`, `STOP_LOSS`
- Added `IF_CONDITION` → Suggests another conditional or `GAS_CHECKER`

**Interaction:**
- Click chip → Instantly adds block below currently selected block
- Dismiss: Small `[×]` on right side of suggestion bar

### Connection System (Manhattan Routing)

**Line Visual Style:**
- Stroke: 2px solid black
- Hard 90-degree angles only (no curves)
- Minimum segment length: 24px

**Execution Animation:**
When strategy is executing (backtest or live):
- Small orange square (6x6px) travels along connection lines
- Speed: 200px/second
- Represents data flow between blocks

**Junction Nodes:**
Where connections meet or split:
- 6px solid black circle
- Indicates decision point or data merge

**Crossover Bridges:**
Where lines cross without connecting:
- Small gap (4px) with subtle "bridge" visual
- Top line continues, bottom line shows gap

**Connection States:**
- **Idle**: 2px solid black
- **Hovered**: 3px, color changes to protocol color
- **Selected**: 3px, protocol color
- **Invalid**: 2px, red, dashed pattern

## Block Configuration Modal

### Modal Structure

**Trigger:** Double-click block OR click block + press Enter

**Modal Window (centered, 600px wide, variable height):**

```
┌─────────────────────────────────────────────────────────────┐
│ CONFIGURE: UNISWAP SWAP                                 [×] │  ← Header (protocol color)
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TOKEN IN                                                   │  ← Label (uppercase, 10px)
│  ┌───────────────────────────────────────────────────────┐ │
│  │ USDC                                                ▼ │ │  ← Dropdown
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  TOKEN OUT                                                  │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ WETH                                                ▼ │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  AMOUNT                                                     │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 1000.00                                               │ │  ← Input (monospace)
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  SLIPPAGE TOLERANCE                                         │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 0.5                                                   │ │
│  └───────────────────────────────────────────────────────┘ │
│  ─────────────────────────────────────────────────── 0.5%  │  ← Slider
│  0.1%                                               2.0%   │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ESTIMATED OUTPUT: 0.4875 WETH                         │ │  ← Preview box
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    [ SAVE CONFIGURATION ]                   │  ← Footer
└─────────────────────────────────────────────────────────────┘
```

**Backdrop:**
- Semi-transparent white: `rgba(250,250,248, 0.95)`
- Blur: None (performance reasons)
- Click outside → Close modal

**Modal Window:**
- Background: White
- Border: 2px solid black
- Shadow: None
- Max width: 600px
- Padding: 24px

**Header:**
- Background: Protocol color
- Text: "CONFIGURE: [BLOCK NAME]", white, uppercase
- Close button: `[×]` in monospace, top-right

### Form Controls

**Text Inputs:**
- No background fill
- Bottom border only: 1px `#D0D0D0`
- Focus state: Border thickens to 2px black
- Cursor: Thick block cursor (terminal style) for monospace fields
- Padding: 8px 0

**Dropdowns:**
- Full border: 1px `#D0D0D0`
- Chevron icon: `▼` in monospace (not SVG)
- Focus: Border changes to 2px black
- Options panel:
  - Appears below (pushes content down, no float)
  - OR: Sharp-edged overlay with 2px black border
  - Each option: Full-width row, monospace
  - Hover: Black background, white text

**Sliders:**
- Track: 1px horizontal line, `#D0D0D0`
- Thumb: 12x12px solid black square
- Labels: Min/max values at ends in small monospace
- Current value: Displayed above slider in larger monospace

**Number Inputs:**
- Always use monospace font
- Auto-format with thousand separators (1,000.00)
- Decimal precision based on token (USDC: 2, ETH: 4)

**Preview Box:**
- Background: `#F5F5F3` (light gray)
- Border: 1px `#D0D0D0`
- Padding: 12px
- Text: Monospace, 14px
- Format: `ESTIMATED OUTPUT: 0.4875 WETH`

### Validation (Inline Contextual)

**Warning State (Yellow):**

When parameter is valid but risky:
- Small yellow triangle `▲` appears next to field label
- Hover shows tooltip:
  ```
  ┌─────────────────────────────────────┐
  │ Slippage >2% may result in          │
  │ significant loss                    │
  └─────────────────────────────────────┘
  ```
- Tooltip: Black box, white monospace text, 4px padding, instant appear

**Error State (Red):**

When parameter is invalid:
- Field border turns 2px red
- Error message appears below field:
  ```
  ERR: AMOUNT EXCEEDS BALANCE
  ```
- Message in red monospace, 12px
- Save button disabled (gray, `cursor: not-allowed`)

**Validation Timing:**
- Triggers on **blur** (user tabs away)
- Triggers on **save attempt**
- Never validates empty fields
- Never shows errors on modal open

## Portfolio Dashboard (Card-Based Grid)

### Grid System

**Base Grid:**
- 12 columns
- 24px gutters
- Cards can span: 3 (quarter), 4 (third), 6 (half), or 12 (full) columns

**Card Interaction:**
- **Drag**: Click and drag top bar (shows `[⋮⋮⋮]` grip pattern)
- **Resize**: Drag bottom-right corner (8x8px black square handle)
- **Remove**: Click `[×]` in top-right (appears on card hover)

**Card Structure:**
```
┌─────────────────────────────────────┐
│ CARD TITLE                   [⋮⋮⋮] │  ← Header (40px, gray bg)
├─────────────────────────────────────┤
│                                     │
│  Card Content                       │  ← Body (white bg)
│                                     │
└─────────────────────────────────────┘
```

### Core Dashboard Cards

**1. Total Value Card (6 columns):**
```
┌─────────────────────────────────────┐
│ PORTFOLIO VALUE              [⋮⋮⋮] │
├─────────────────────────────────────┤
│                                     │
│         $45,234.89                  │  ← 32px monospace
│                                     │
│  24h: +$1,234.56 (+2.8%)           │  ← Green if positive
│  7d:  -$456.78 (-1.0%)             │  ← Red if negative
│                                     │
└─────────────────────────────────────┘
```

**2. Positions Table Card (12 columns):**
```
┌──────────────────────────────────────────────────────────────┐
│ ACTIVE POSITIONS                                     [⋮⋮⋮]  │
├──────────────────────────────────────────────────────────────┤
│ PROTOCOL │ TYPE    │ ASSET  │ AMOUNT    │ VALUE     │ APY   │  ← Header row
├──────────┼─────────┼────────┼───────────┼───────────┼───────┤
│ •AAVE    │ SUPPLY  │ USDC   │ 5,000.00  │ $5,000.00 │ 4.2%  │  ← Data rows
│ •AAVE    │ BORROW  │ WETH   │ 1.2500    │ $2,500.00 │ 2.8%  │
│ •UNISWAP │ LP      │ ETH-USDC│ 0.5 ETH   │ $1,234.00 │ 12.5% │
└──────────┴─────────┴────────┴───────────┴───────────┴───────┘
```

- Header: Black background, white text, uppercase, 12px
- Rows: Alternating backgrounds (`#FAFAF8` / `#F5F5F3`)
- Protocol dot: Colored circle (6px) before protocol name
- Monospace for all numbers
- Click row: Opens detail modal

**3. Performance Chart Card (6 columns):**
```
┌─────────────────────────────────────┐
│ PERFORMANCE (30D)            [⋮⋮⋮] │
├─────────────────────────────────────┤
│     │                          ╱    │
│  50k│                      ╱──      │
│     │                  ╱──          │
│  45k│              ╱──              │
│     │          ╱──                  │
│  40k│──────╱──                      │
│     └──────────────────────────     │
│      Jan 1    Jan 15    Jan 30     │
└─────────────────────────────────────┘
```

- Line: 1px black stroke
- No area fill, no grid lines inside chart
- Axes: Minimal tick marks, small monospace labels
- Hover: Vertical crosshair line + data tooltip

**4. Gas Tracker Card (3 columns):**
```
┌──────────────────────┐
│ GAS SPENT     [⋮⋮⋮] │
├──────────────────────┤
│                      │
│  THIS MONTH          │
│  0.0456 ETH          │
│  ≈ $91.20            │
│                      │
│  AVG/TX: $3.80       │
└──────────────────────┘
```

**5. Health Factor Card (3 columns, conditional):**

Only shown if user has Aave borrow positions:
```
┌──────────────────────┐
│ HEALTH FACTOR [⋮⋮⋮] │
├──────────────────────┤
│                      │
│      2.45            │  ← Large number, color-coded
│                      │
│  SAFE                │
│                      │
│  [ LIQUIDATION       │
│    AT 1.00 ]         │
└──────────────────────┘
```

Color coding:
- `> 2.0`: Green
- `1.5 - 2.0`: Orange
- `< 1.5`: Red

### Card Management

**Add Card:**
- Button in top-right: `[ + ADD CARD ]`
- Opens dropdown menu:
  ```
  ┌──────────────────────┐
  │ Token Balances       │
  │ Protocol Stats       │
  │ Transaction History  │
  │ APY Tracker          │
  └──────────────────────┘
  ```

**Reset Layout:**
- Button: `[ RESET TO DEFAULT ]`
- Confirmation modal before resetting

## Backtest View & Results

### Configuration Bar (Inline)

Appears in header center section when in Backtest view:

```
DATE: [ 2024-01-01 ] → [ 2024-06-30 ]  |  CAPITAL: [ $10,000 ]  |  INTERVAL: [ 24h ▼ ]  |  [ RUN BACKTEST ]
```

**Date Pickers:**
- Click → Calendar modal opens
- Calendar styling: Grid of dates, black border, monospace dates
- Selected date: Black background, white text

**Capital Input:**
- Monospace font
- Auto-formats: `10000` → `$10,000`
- Min: $100, Max: $1,000,000

**Interval Dropdown:**
- Options: 1h, 6h, 12h, 24h, 7d
- Format matches configuration modals

**Run Button:**
- Black background, white text
- Full height of header bar (60px)
- Uppercase: "RUN BACKTEST"
- Disabled if strategy has errors

### Results Layout (Split View)

**Left Side (40%): Metrics Panel**

```
┌─────────────────────────────────────┐
│ BACKTEST RESULTS                    │
├─────────────────────────────────────┤
│                                     │
│ TOTAL RETURN                        │
│ $12,456.78  (+24.6%)               │  ← 32px monospace, green
│                                     │
│ ─────────────────────────────       │
│                                     │
│ SHARPE RATIO        2.34            │  ← 14px monospace
│ MAX DRAWDOWN       -12.3%           │
│ WIN RATE           68.5%            │
│ TOTAL TRADES       142              │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ GAS COSTS          0.123 ETH        │
│ PROTOCOL FEES      $234.56          │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ WALK-FORWARD VALIDATION             │
│ IN-SAMPLE          +28.4%           │
│ OUT-OF-SAMPLE      +24.6%           │
│ DEGRADATION        13.4%            │  ← Color: green <20%, yellow 20-60%, red >60%
│                                     │
└─────────────────────────────────────┘
```

**Right Side (60%): Equity Curve**

```
┌───────────────────────────────────────────────────────┐
│ EQUITY CURVE                                          │
├───────────────────────────────────────────────────────┤
│      │                                           ╱    │
│  15k │                                       ╱──      │
│      │                                   ╱──          │
│  12k │                               ╱──              │
│      │                           ╱──                  │
│  10k │───────────────────────╱──                      │
│      │   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░          │
│      └────────────────────────────────────────        │
│       Jan    Feb    Mar    Apr    May    Jun         │
│                                                       │
│  ▓ = Training Period    ░ = Test Period              │
└───────────────────────────────────────────────────────┘
```

**Chart Specs:**
- Line: 2px black stroke
- No area fill
- Axes: 1px black lines, minimal tick marks
- Shaded regions (walk-forward windows):
  - Training: Dark gray (`rgba(0,0,0,0.1)`)
  - Test: Light gray (`rgba(0,0,0,0.05)`)
- Hover: Vertical crosshair + tooltip

**Tooltip (on hover):**
```
┌──────────────────┐
│ 2024-03-15       │
│ $12,456.78       │
│ +24.6%           │
└──────────────────┘
```
Black box, white monospace text, 4px padding

### Trade History Table (Full Width Below)

```
┌────────────────────────────────────────────────────────────────────┐
│ TRADE HISTORY                                          [ EXPORT ]  │
├────────────────────────────────────────────────────────────────────┤
│ DATE       │ TYPE    │ PROTOCOL │ DETAILS         │ PNL     │ GAS  │
├────────────┼─────────┼──────────┼─────────────────┼─────────┼──────┤
│ 2024-01-05 │ SWAP    │ UNISWAP  │ 100 USDC→WETH   │ +$12.34 │ $2.1 │
│ 2024-01-12 │ SUPPLY  │ AAVE     │ 1000 USDC       │ +$4.56  │ $3.2 │
│ 2024-01-15 │ BORROW  │ AAVE     │ 0.5 WETH        │ -$1.23  │ $4.5 │
└────────────┴─────────┴──────────┴─────────────────┴─────────┴─────┘
```

- Header: Black bg, white text
- Rows: Alternating backgrounds
- PNL column: Green for positive, red for negative
- Monospace for dates and numbers
- Click row: Expands detail modal
- Export button: Downloads CSV

### Progress Modal (While Running)

```
┌─────────────────────────────┐
│ RUNNING BACKTEST            │
├─────────────────────────────┤
│                             │
│  ████████████░░░░░░░  68%   │  ← Black fill, gray track
│                             │
│  ITERATION 142/210          │  ← Monospace
│  EST. TIME: 2m 34s          │
│                             │
│  [ STOP ]                   │  ← Red button
└─────────────────────────────┘
```

## Optimize View

### Layout (3-Column)

**Left Column (25%): Configuration**
```
┌─────────────────────────┐
│ OPTIMIZATION SETTINGS   │
├─────────────────────────┤
│                         │
│ ALGORITHM               │
│ ○ BAYESIAN              │
│ ● GENETIC               │
│                         │
│ ─────────────────       │
│                         │
│ OBJECTIVES              │
│ ☑ SHARPE RATIO          │
│ ☑ MAX DRAWDOWN          │
│ ☐ TOTAL RETURN          │
│ ☐ WIN RATE              │
│ ☐ GAS COSTS             │
│                         │
│ ─────────────────       │
│                         │
│ ITERATIONS              │
│ [ 100 ]                 │
│                         │
│ ─────────────────       │
│                         │
│ [ START OPTIMIZATION ]  │
│                         │
└─────────────────────────┘
```

**Radio Buttons:**
- Circle outline: 1px black
- Selected: Filled black circle

**Checkboxes:**
- Square outline: 1px black
- Checked: Black checkmark inside

**Center Column (50%): Pareto Frontier**
```
┌───────────────────────────────────────────────────┐
│ PARETO FRONTIER                                   │
├───────────────────────────────────────────────────┤
│                                                   │
│   Sharpe                                          │
│    3.0│              ●                            │
│       │           ●     ●                         │
│    2.5│        ●           ●                      │
│       │     ●                                     │
│    2.0│  ●                                        │
│       │                                           │
│    1.5│        ○  ○  ○  ○                        │
│       └─────────────────────────────              │
│         -5%  -10%  -15%  -20%  -25%               │
│                   Max Drawdown                    │
│                                                   │
│  ITERATION 45/100  |  EST. 3m 20s                │
└───────────────────────────────────────────────────┘
```

**Chart Details:**
- Axes: 1px black lines
- Points: 6px circles
  - Pareto optimal (frontier): Filled green circles
  - Dominated: Gray outline circles
- Hover: Shows tooltip with full parameter set + metrics
- Click: Highlights point, shows details in right column

**Right Column (25%): Results**
```
┌─────────────────────────┐
│ TOP SOLUTIONS           │
├─────────────────────────┤
│                         │
│ #1  SHARPE: 2.45        │
│     DRAWDOWN: -12.3%    │
│                         │
│     RSI: 32.5           │
│     POSITION: 25%       │
│     SLIPPAGE: 0.8%      │
│                         │
│     [ APPLY ]           │
│                         │
│ ───────────────         │
│                         │
│ #2  SHARPE: 2.38        │
│     DRAWDOWN: -10.1%    │
│     ...                 │
│                         │
└─────────────────────────┘
```

## Global UI Patterns

### Buttons

**Primary Button:**
- Background: `#0A0A0A` (black)
- Text: White, uppercase, sans-serif bold
- Height: 50px
- Padding: 0 24px
- Hover: Background → `#FF5500` (orange)
- Transition: None or 100ms linear

**Secondary Button:**
- Background: White
- Border: 1px solid black
- Text: Black, uppercase
- Height: 50px
- Padding: 0 24px
- Hover: Background → Black, Text → White
- Transition: None or 100ms linear

**Disabled Button:**
- Background: `#CCCCCC` (light gray)
- Text: `#888888` (medium gray)
- Cursor: not-allowed
- No hover effects

### Modals

**Backdrop:**
- Color: `rgba(250,250,248, 0.95)`
- Blur: None
- Click outside: Closes modal (unless blocking)

**Modal Window:**
- Centered on screen
- Background: White
- Border: 2px solid black
- Shadow: None
- Max width: 800px (varies by modal type)
- Padding: 24px

**Modal Header:**
- Background: Protocol color OR black
- Text: White, uppercase, bold
- Height: 50px
- Close button: `[×]` in monospace, top-right

### Tooltips

**Trigger:** Hover for 500ms

**Style:**
- Background: Black
- Text: White, monospace, 12px
- Padding: 4px 8px
- Border: None
- Shadow: None
- Max width: 200px

**Position:** Above element (no arrow/pointer)

**Animation:** Instant appear/disappear

### Loading States

**Spinner:**
- Rotating square (12x12px black)
- Rotation: 360° in 1000ms linear
- Not a circle

**Progress Bar:**
- Track: 1px horizontal line, `#D0D0D0`
- Fill: Black rectangle, grows left-to-right
- Percentage: Monospace text above bar
- Height: 4px

**Skeleton Loading:**
- No shimmer/pulse effects
- Solid gray rectangles (`#E0E0E0`)
- Match dimensions of expected content

### Animations

**Philosophy:** Instant or extremely fast. No "smooth" animations.

**Transitions:**
- Page changes: Instant (0ms)
- Modal open/close: Instant (0ms)
- Hover states: Instant OR 100ms linear
- Button clicks: Instant
- Data updates: Numbers morph smoothly (300ms ease-out) but layout is instant

**Motion:**
- No spring animations
- No easing curves except for number morphing
- Prefer instant state changes

## Typography Rules

### Capitalization

**Uppercase:**
- Section headers (H1, H2)
- Button labels
- Tab labels
- Modal titles
- Table headers

**Sentence case:**
- Block labels
- Form labels (with small exception for acronyms like "USDC")
- Body text
- Tooltips

**Monospace:**
- All numbers (amounts, percentages, ratios)
- All addresses (wallet, contract, transaction)
- All timestamps
- Error codes
- Terminal-like messages

### Formatting

**Numbers:**
- Thousand separator: Comma (1,000.00)
- Decimals: Consistent per token (USDC: 2, ETH: 4, BTC: 8)
- Percentages: Always show sign (+2.5%, -1.2%)
- Currency: Dollar sign prefix ($1,234.56)

**Dates:**
- Format: YYYY-MM-DD (ISO 8601)
- Monospace font
- Or: Mon DD for abbreviated (Jan 15)

**Addresses:**
- Truncated: `0x12...89` (first 4, last 2 characters)
- Full address: Monospace, breakable with `word-break: break-all`
- Copy button: Small `[COPY]` text next to address

## Responsive Behavior

### Mobile (< 768px)

**Strategy Builder:**
- **Disabled** - Building complex node graphs on mobile is impractical
- Show message:
  ```
  ┌─────────────────────────┐
  │                         │
  │  DESKTOP TERMINAL       │
  │  REQUIRED FOR EDITING   │
  │                         │
  │  Use mobile for:        │
  │  • Monitoring           │
  │  • Viewing results      │
  │                         │
  └─────────────────────────┘
  ```

**Portfolio Dashboard:**
- Cards stack vertically (single column)
- All cards become 12 columns wide
- Drag-to-reorder disabled
- Scrollable list instead

**Backtest View:**
- Configuration moves to vertical form
- Metrics and chart stack vertically
- Table becomes horizontally scrollable

**Header:**
- Logo only (QUANT MATRIX)
- Hamburger menu (literally text "MENU", not icon)
- Menu opens full-screen overlay:
  ```
  ┌─────────────────────────┐
  │                         │
  │  1. WORKSPACE           │
  │  2. BACKTEST            │
  │  3. PORTFOLIO           │
  │  4. OPTIMIZE            │
  │                         │
  │  WALLET: 0x12...89      │
  │  NETWORK: SEPOLIA       │
  │                         │
  │  [ DISCONNECT ]         │
  │                         │
  └─────────────────────────┘
  ```
  Black background, white text

### Tablet (768px - 1024px)

**Strategy Builder:**
- Enabled but simplified
- Palette switches to scrollable horizontal strip
- Canvas takes full width

**Dashboard:**
- 2-column grid (cards span 6 columns each)

## Content & Copywriting

### Tone

**Objective, technical, system-like**

**Bad Examples:**
- "Connect your wallet to start making money!"
- "Whoops! Something went wrong 😅"
- "You're all set!"

**Good Examples:**
- "INITIALIZE PROTOCOL CONNECTION"
- "ERR_TRANSACTION_REVERTED: SLIPPAGE TOLERANCE EXCEEDED"
- "CONFIGURATION SAVED"

### Error Messages

Format: `ERR_CODE: DESCRIPTION`

Examples:
- `ERR_INSUFFICIENT_BALANCE: USDC BALANCE TOO LOW`
- `ERR_NETWORK_MISMATCH: SWITCH TO SEPOLIA TESTNET`
- `ERR_INVALID_PARAMETER: AMOUNT MUST BE > 0`

### Success Messages

Format: `STATUS: DESCRIPTION`

Examples:
- `SUCCESS: TRANSACTION CONFIRMED`
- `SAVED: STRATEGY UPDATED`
- `CONNECTED: 0x12...89`

### System Status

Passive voice, present tense:

- `SYSTEM: READY`
- `WALLET: DISCONNECTED`
- `NETWORK: SEPOLIA`
- `BACKTEST: RUNNING`
- `OPTIMIZATION: COMPLETE`

## Implementation Notes

### CSS Framework

**Tailwind CSS** recommended with custom config:

```js
module.exports = {
  theme: {
    borderRadius: {
      none: '0px', // Global reset
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      mono: ['IBM Plex Mono', 'monospace'],
    },
    colors: {
      canvas: '#FAFAF8',
      ink: '#0A0A0A',
      border: '#D0D0D0',
      orange: '#FF5500',
      uniswap: '#FF007A',
      aave: '#B6509E',
      success: '#00D395',
      error: '#FF4444',
    },
    spacing: {
      // 24px base unit scale
      0: '0px',
      1: '6px',
      2: '12px',
      3: '24px',
      4: '48px',
      5: '72px',
      6: '96px',
    },
  },
}
```

### Animation Library

**Framer Motion** for number morphing only.

All other transitions should be CSS with:
- `transition: none` OR
- `transition: all 100ms linear`

No spring physics, no easing curves (except number morphing).

### React Flow Customization

For the node editor:

**Custom Node Component:**
- Override default styling completely
- Implement block structure as described
- Custom handle positioning (4x4px squares)

**Custom Edge Component:**
- Implement Manhattan routing
- Override default Bezier curves
- Add execution animation overlay

**Edge Styling:**
- `stroke: #0A0A0A`
- `strokeWidth: 2`
- `fill: none`

## Success Metrics

**Usability:**
- Time to build first strategy: <2 minutes (vs ~5 minutes currently)
- User-reported readability score: >8/10
- Error rate reduction: <30% fewer invalid strategies submitted

**Trust & Professionalism:**
- User survey: "This looks institutional-grade": >80% agree
- User survey: "I trust this with real money": >70% agree

**Efficiency:**
- Block selection time: <5 seconds (from opening palette to drop)
- Configuration time per block: <30 seconds
- Time to understand backtest results: <1 minute

## Appendix: Block Iconography

Since we're avoiding standard icon sets, here are geometric primitives for each block type:

**Trading Blocks:**
- SWAP: Two arrows in circle (⟲)
- PRICE_CHECK: Graph line (📈)

**Liquidity Blocks:**
- CREATE_LP: Water drop (💧)
- COLLECT_FEES: Dollar sign ($)

**Lending Blocks:**
- SUPPLY: Downward arrow (↓)
- BORROW: Upward arrow (↑)
- REPAY: Return arrow (↵)
- HEALTH_CHECK: Heart (♥)

**Logic Blocks:**
- IF_CONDITION: Question mark (?)
- GAS_CHECKER: Fuel pump (⛽)

**Risk Blocks:**
- STOP_LOSS: Stop sign (⬛)
- POSITION_SIZE: Bar chart (📊)

These should be rendered as SVG geometric shapes (circles, triangles, squares) in black, not emoji.

---

**End of Design Document**
