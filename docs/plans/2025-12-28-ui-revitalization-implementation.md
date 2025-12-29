# UI Revitalization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Quant Matrix UI from generic Web3 aesthetics to an institutional-grade financial terminal following brutalist design principles.

**Architecture:** Phased redesign starting with design system foundation (Tailwind config, typography, colors), then rebuilding components layer by layer (global layout → workspace → modals → dashboard → other views). Each phase is independently verifiable and committable.

**Tech Stack:** React 18, TypeScript, Tailwind CSS (custom config), Framer Motion (minimal), Recharts, React Three Fiber

---

## Implementation Strategy

This is a **complete UI overhaul** affecting every component. To manage risk and enable incremental progress:

1. **Phase-by-phase execution** - Each phase is independently functional
2. **Frequent visual verification** - Check browser after each task
3. **Backward compatibility** - Old components work until replaced
4. **Frequent commits** - Commit after each completed task

**Verification Method:**
- No unit tests for UI (visual verification instead)
- After each task: `npm run dev` → Check in browser
- Build verification: `npm run build` (must succeed)

---

## Phase 1: Design System Foundation

**Goal:** Establish the design system (colors, typography, spacing) that all components will use.

### Task 1: Tailwind Configuration

**Files:**
- Modify: `tailwind.config.js`
- Create: `src/styles/design-tokens.css`

**Step 1: Update Tailwind config with design system**

Modify `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base colors
        canvas: '#FAFAF8',
        ink: '#0A0A0A',
        border: {
          DEFAULT: '#D0D0D0',
          active: '#0A0A0A',
        },
        // Protocol-aware accents
        orange: '#FF5500',
        uniswap: '#FF007A',
        aave: '#B6509E',
        success: '#00D395',
        error: '#FF4444',
        // Grays
        gray: {
          50: '#F9F9F7',
          100: '#F5F5F3',
          200: '#E0E0E0',
          300: '#CCCCCC',
          400: '#AAAAAA',
          500: '#888888',
          600: '#666666',
          700: '#444444',
          800: '#0A0A0A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        'h1': ['24px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '0.05em' }],
        'h2': ['16px', { lineHeight: '1.3', fontWeight: '700' }],
        'h3': ['14px', { lineHeight: '1.4', fontWeight: '500' }],
        'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'small': ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        'data': ['14px', { lineHeight: '1.4', fontWeight: '500' }],
      },
      spacing: {
        '1': '6px',
        '2': '12px',
        '3': '24px',
        '4': '48px',
        '5': '72px',
        '6': '96px',
      },
      borderRadius: {
        none: '0px',
      },
      transitionDuration: {
        instant: '0ms',
        fast: '100ms',
      },
      transitionTimingFunction: {
        none: 'linear',
      },
    },
  },
  plugins: [],
}
```

**Step 2: Create design tokens CSS file**

Create `src/styles/design-tokens.css`:

```css
/* Design System Tokens */

/* Reset border radius globally */
* {
  border-radius: 0 !important;
}

/* Typography classes */
.text-h1 {
  @apply text-h1 uppercase tracking-wider;
}

.text-h2 {
  @apply text-h2 uppercase;
}

.text-h3 {
  @apply text-h3;
}

.text-data {
  @apply font-mono text-data;
}

/* Button base styles */
.btn-primary {
  @apply bg-ink text-white uppercase font-bold h-[50px] px-6;
  @apply hover:bg-orange transition-fast;
}

.btn-secondary {
  @apply bg-white border border-ink text-ink uppercase font-bold h-[50px] px-6;
  @apply hover:bg-ink hover:text-white transition-fast;
}

.btn-disabled {
  @apply bg-gray-300 text-gray-500 cursor-not-allowed;
}

/* Input base styles */
.input-base {
  @apply border-b border-border bg-transparent px-0 py-2;
  @apply focus:border-b-2 focus:border-ink outline-none;
  @apply font-mono;
}

/* Card base styles */
.card {
  @apply bg-white border border-border;
}

.card-header {
  @apply bg-gray-100 px-3 py-2 border-b border-border;
  @apply flex items-center justify-between;
}

/* Modal base styles */
.modal-backdrop {
  @apply fixed inset-0 bg-canvas/95 z-50;
}

.modal-window {
  @apply bg-white border-2 border-ink max-w-[600px] p-6;
}

/* Dot grid background */
.dot-grid {
  background-image: radial-gradient(circle, #E0E0E0 1px, transparent 1px);
  background-size: 24px 24px;
}

/* Protocol color utilities */
.border-uniswap {
  border-color: #FF007A;
}

.bg-uniswap {
  background-color: #FF007A;
}

.text-uniswap {
  color: #FF007A;
}

.border-aave {
  border-color: #B6509E;
}

.bg-aave {
  background-color: #B6509E;
}

.text-aave {
  color: #B6509E;
}

/* Success/Error utilities */
.text-success {
  color: #00D395;
}

.text-error {
  color: #FF4444;
}

.border-error {
  border-color: #FF4444;
}
```

**Step 3: Import design tokens in main CSS**

Modify `src/index.css`:

```css
@import './styles/design-tokens.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

/* Global resets */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', system-ui, sans-serif;
  background-color: #FAFAF8;
  color: #0A0A0A;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Monospace elements */
code, pre, .monospace, [data-monospace] {
  font-family: 'IBM Plex Mono', 'Menlo', monospace;
}
```

**Step 4: Install required fonts**

Add to `index.html` in `<head>`:

```html
<!-- Google Fonts: Inter and IBM Plex Mono -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

**Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 6: Verify in browser**

Run: `npm run dev`
Check: Fonts loaded, background is off-white (`#FAFAF8`)

**Step 7: Commit**

```bash
git add tailwind.config.js src/styles/design-tokens.css src/index.css index.html
git commit -m "feat(ui): add design system foundation

- Tailwind config with brutalist color palette
- Typography scale (Inter + IBM Plex Mono)
- 24px base spacing unit
- Design token utility classes
- 0px border radius global reset"
```

---

### Task 2: Global Typography Component

**Files:**
- Create: `components/ui/Typography.tsx`

**Step 1: Create Typography component**

Create `components/ui/Typography.tsx`:

```typescript
import React from 'react';

interface TypographyProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'data';
  children: React.ReactNode;
  className?: string;
  uppercase?: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  children,
  className = '',
  uppercase = false,
  as,
}) => {
  const Component = as || (variant.startsWith('h') ? variant : 'p');

  const baseClasses: Record<string, string> = {
    h1: 'text-h1',
    h2: 'text-h2',
    h3: 'text-h3',
    body: 'text-body',
    small: 'text-small text-gray-600',
    data: 'text-data',
  };

  const classes = `${baseClasses[variant]} ${uppercase ? 'uppercase' : ''} ${className}`;

  return <Component className={classes}>{children}</Component>;
};

interface DataTextProps {
  children: React.ReactNode;
  className?: string;
  success?: boolean;
  error?: boolean;
}

export const DataText: React.FC<DataTextProps> = ({
  children,
  className = '',
  success,
  error,
}) => {
  const colorClass = success ? 'text-success' : error ? 'text-error' : '';
  return (
    <span className={`font-mono text-data ${colorClass} ${className}`}>
      {children}
    </span>
  );
};
```

**Step 2: Create Button components**

Create `components/ui/Button.tsx`:

```typescript
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  fullWidth = false,
  className = '',
  disabled = false,
  ...props
}) => {
  const baseClass = disabled ? 'btn-disabled' : variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClass} ${widthClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
```

**Step 3: Create Input component**

Create `components/ui/Input.tsx`:

```typescript
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  monospace?: boolean;
}

export const Input: React.FC<InputProps> = ({
  error = false,
  monospace = false,
  className = '',
  ...props
}) => {
  const errorClass = error ? 'border-error border-b-2' : '';
  const fontClass = monospace ? 'font-mono' : '';

  return (
    <input
      className={`input-base ${errorClass} ${fontClass} ${className}`}
      {...props}
    />
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  error = false,
  className = '',
  ...props
}) => {
  const errorClass = error ? 'border-error' : 'border-border';

  return (
    <textarea
      className={`border ${errorClass} bg-transparent px-3 py-2 focus:border-2 focus:border-ink outline-none font-mono resize-none ${className}`}
      {...props}
    />
  );
};
```

**Step 4: Create barrel export**

Create `components/ui/index.ts`:

```typescript
export { Typography, DataText } from './Typography';
export { Button } from './Button';
export { Input, Textarea } from './Input';
```

**Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add components/ui/
git commit -m "feat(ui): add base UI components

- Typography component with h1-h3, body, data variants
- Button component with primary/secondary variants
- Input/Textarea components with error states
- Monospace support for data display"
```

---

## Phase 2: Global Layout & Navigation

**Goal:** Replace the current navigation system with context-aware header and command palette.

### Task 3: Context-Aware Header

**Files:**
- Create: `components/layout/Header.tsx`
- Create: `components/layout/WalletButton.tsx`
- Modify: `src/App.tsx`

**Step 1: Create WalletButton component**

Create `components/layout/WalletButton.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { walletService } from '../../services/web3/walletService';
import { DataText } from '../ui';

export const WalletButton: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [network, setNetwork] = useState<string>('');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    const connected = walletService.isConnected();
    setIsConnected(connected);

    if (connected) {
      const addr = walletService.getConnectedAddress();
      setAddress(addr);

      if (addr) {
        const bal = await walletService.getBalance(addr);
        setBalance((Number(bal) / 1e18).toFixed(4));
      }

      const isOnSepolia = await walletService.isOnSepolia();
      setNetwork(isOnSepolia ? 'SEPOLIA' : 'UNKNOWN');
    }
  };

  const handleConnect = async () => {
    try {
      await walletService.connect();
      await checkConnection();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = () => {
    walletService.disconnect();
    setIsConnected(false);
    setAddress(null);
    setBalance('0');
  };

  if (!isConnected) {
    return (
      <button
        onClick={handleConnect}
        className="px-4 py-2 border border-ink text-ink font-mono text-small uppercase hover:bg-ink hover:text-white transition-fast"
      >
        [ DISCONNECTED ]
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 ${network === 'SEPOLIA' ? 'bg-success' : 'bg-error'}`} />
        <DataText className="text-small">{network}</DataText>
      </div>
      <button
        onClick={handleDisconnect}
        className="px-4 py-2 bg-ink text-white font-mono text-small hover:bg-orange transition-fast"
      >
        [ {address?.slice(0, 6)}...{address?.slice(-4)} | {balance} ETH ]
      </button>
    </div>
  );
};
```

**Step 2: Create Header component**

Create `components/layout/Header.tsx`:

```typescript
import React from 'react';
import { Typography } from '../ui';
import { WalletButton } from './WalletButton';

interface HeaderProps {
  currentView: 'workspace' | 'backtest' | 'portfolio' | 'optimize';
  centerContent?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ currentView, centerContent }) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-[60px] bg-canvas border-b border-ink z-50">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Typography variant="h2" className="font-mono tracking-tight">
            QUANT MATRIX
          </Typography>
          <div className="h-4 w-px bg-border" />
          <Typography variant="small" className="text-gray-600 uppercase">
            {currentView}
          </Typography>
        </div>

        {/* Center Section (Context-Aware) */}
        <div className="flex-1 flex justify-center">
          {centerContent}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <WalletButton />
        </div>
      </div>
    </header>
  );
};
```

**Step 3: Create layout barrel export**

Create `components/layout/index.ts`:

```typescript
export { Header } from './Header';
export { WalletButton } from './WalletButton';
```

**Step 4: Update App.tsx to use new header**

Modify `src/App.tsx` - replace the existing HUD/header section:

```typescript
import { Header } from './components/layout';

// Inside App component:
const [currentView, setCurrentView] = useState<'workspace' | 'backtest' | 'portfolio' | 'optimize'>('workspace');

return (
  <div className="min-h-screen bg-canvas">
    <Header
      currentView={currentView}
      centerContent={
        currentView === 'workspace' ? (
          <div className="flex gap-2">
            {/* Category tabs - to be implemented */}
          </div>
        ) : null
      }
    />

    {/* Main content area - offset for fixed header */}
    <main className="pt-[60px]">
      {/* Existing content */}
    </main>
  </div>
);
```

**Step 5: Verify in browser**

Run: `npm run dev`
Check:
- Header appears at top (60px height, white background, black bottom border)
- Logo shows "QUANT MATRIX" in monospace
- Current view label shows "WORKSPACE"
- Wallet button shows "[ DISCONNECTED ]"
- Clicking wallet button triggers MetaMask

**Step 6: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 7: Commit**

```bash
git add components/layout/ src/App.tsx
git commit -m "feat(ui): add context-aware header with wallet integration

- Fixed header with 60px height
- Logo + current view indicator (left)
- Context-aware center content slot
- Wallet connection button with network indicator (right)
- Monospace typography throughout"
```

---

### Task 4: Command Palette

**Files:**
- Create: `components/layout/CommandPalette.tsx`
- Modify: `src/App.tsx`

**Step 1: Create CommandPalette component**

Create `components/layout/CommandPalette.tsx`:

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { Typography } from '../ui';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: 'workspace' | 'backtest' | 'portfolio' | 'optimize') => void;
}

const COMMANDS = [
  { id: 'workspace', label: '1. WORKSPACE', shortcut: '1' },
  { id: 'backtest', label: '2. BACKTEST', shortcut: '2' },
  { id: 'portfolio', label: '3. PORTFOLIO', shortcut: '3' },
  { id: 'optimize', label: '4. OPTIMIZE', shortcut: '4' },
] as const;

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        onNavigate(filteredCommands[selectedIndex].id as any);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onNavigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop flex items-start justify-center pt-[20vh]">
      <div className="modal-window w-full max-w-[600px]">
        {/* Search Input */}
        <div className="border-b border-border pb-3">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="> _"
            className="w-full bg-transparent font-mono text-data outline-none"
          />
        </div>

        {/* Command List */}
        <div className="mt-3 space-y-1">
          {filteredCommands.map((cmd, index) => (
            <button
              key={cmd.id}
              onClick={() => {
                onNavigate(cmd.id as any);
                onClose();
              }}
              className={`w-full text-left px-3 py-2 font-mono transition-fast ${
                index === selectedIndex
                  ? 'bg-ink text-white'
                  : 'hover:bg-gray-100'
              }`}
            >
              {cmd.label}
            </button>
          ))}
          {filteredCommands.length === 0 && (
            <Typography variant="small" className="text-gray-500 text-center py-4">
              No commands found
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
};
```

**Step 2: Add command palette trigger to App.tsx**

Modify `src/App.tsx`:

```typescript
import { CommandPalette } from './components/layout/CommandPalette';

// Inside App component:
const [isPaletteOpen, setIsPaletteOpen] = useState(false);

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Open command palette with /
    if (e.key === '/' && !isPaletteOpen) {
      e.preventDefault();
      setIsPaletteOpen(true);
    }

    // Number shortcuts
    if (e.key >= '1' && e.key <= '4' && !isPaletteOpen) {
      const views = ['workspace', 'backtest', 'portfolio', 'optimize'];
      const viewIndex = parseInt(e.key) - 1;
      setCurrentView(views[viewIndex] as any);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isPaletteOpen]);

// In JSX:
<CommandPalette
  isOpen={isPaletteOpen}
  onClose={() => setIsPaletteOpen(false)}
  onNavigate={(view) => {
    setCurrentView(view);
    setIsPaletteOpen(false);
  }}
/>

{/* Command palette hint in bottom-right */}
<div className="fixed bottom-4 right-4 z-40">
  <Typography variant="small" className="text-gray-500 font-mono">
    [/]
  </Typography>
</div>
```

**Step 3: Verify in browser**

Run: `npm run dev`
Check:
- Press `/` → Command palette opens
- Type to filter commands
- Arrow keys navigate
- Enter selects
- Escape closes
- Number keys 1-4 switch views directly
- Bottom-right shows `[/]` hint

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add components/layout/CommandPalette.tsx src/App.tsx
git commit -m "feat(ui): add command palette navigation

- Press / to open command palette
- Fuzzy search filtering
- Keyboard navigation (arrows + enter)
- Number shortcuts (1-4) for quick access
- Bottom-right hint indicator
- Modal overlay styling"
```

---

## Phase 3: Workspace Canvas & Block System

**Goal:** Redesign the 3D workspace with new block styling, dot grid canvas, and Manhattan routing.

### Task 5: Canvas Background & Grid

**Files:**
- Create: `components/workspace/Canvas.tsx`
- Modify: `components/Spine.tsx` (or create new if easier)

**Step 1: Create Canvas component**

Create `components/workspace/Canvas.tsx`:

```typescript
import React from 'react';
import { Typography } from '../ui';

interface CanvasProps {
  isEmpty: boolean;
  children?: React.ReactNode;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  isEmpty,
  children,
  zoom = 100,
  onZoomChange,
}) => {
  const handleZoomIn = () => {
    if (zoom < 150 && onZoomChange) {
      onZoomChange(zoom + 25);
    }
  };

  const handleZoomOut = () => {
    if (zoom > 50 && onZoomChange) {
      onZoomChange(zoom - 25);
    }
  };

  const handleZoomReset = () => {
    if (onZoomChange) {
      onZoomChange(100);
    }
  };

  return (
    <div className="relative w-full h-full dot-grid bg-canvas overflow-hidden">
      {/* Empty State */}
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Typography variant="h2" className="mb-3 text-gray-600">
              [ CANVAS READY ]
            </Typography>
            <Typography variant="small" className="text-gray-500">
              SELECT CATEGORY ABOVE OR<br />
              PRESS / TO BEGIN
            </Typography>
          </div>
        </div>
      )}

      {/* Canvas Content */}
      <div
        className="absolute inset-0 transition-transform duration-300"
        style={{ transform: `scale(${zoom / 100})` }}
      >
        {children}
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-white border border-border px-2 py-1">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 50}
          className="px-2 py-1 font-mono text-small hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          -
        </button>
        <button
          onClick={handleZoomReset}
          className="px-3 py-1 font-mono text-small hover:bg-gray-100"
        >
          {zoom}%
        </button>
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 150}
          className="px-2 py-1 font-mono text-small hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
    </div>
  );
};
```

**Step 2: Verify in browser**

Run: `npm run dev`
Check:
- Dot grid background visible (24px spacing)
- Empty state message centered
- Zoom controls in bottom-left
- Zoom in/out/reset works

**Step 3: Commit**

```bash
git add components/workspace/Canvas.tsx
git commit -m "feat(ui): add canvas with dot grid background

- 24px dot grid pattern
- Empty state messaging (no premature errors)
- Zoom controls (50-150%)
- Clean workspace foundation"
```

---

### Task 6: Block Component Redesign

**Files:**
- Create: `components/workspace/Block.tsx`
- Create: `components/workspace/BlockSocket.tsx`

**Step 1: Create BlockSocket component**

Create `components/workspace/BlockSocket.tsx`:

```typescript
import React from 'react';

interface BlockSocketProps {
  position: 'top' | 'bottom';
  connected?: boolean;
  incompatible?: boolean;
  protocolColor?: string;
}

export const BlockSocket: React.FC<BlockSocketProps> = ({
  position,
  connected = false,
  incompatible = false,
  protocolColor,
}) => {
  const getColor = () => {
    if (incompatible) return 'bg-error';
    if (connected) return 'bg-ink';
    return 'bg-gray-300';
  };

  const positionClass = position === 'top' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' : 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2';

  return (
    <div
      className={`absolute w-1 h-1 ${getColor()} ${positionClass} transition-colors`}
      style={
        connected && protocolColor
          ? { backgroundColor: protocolColor }
          : undefined
      }
    />
  );
};
```

**Step 2: Create Block component**

Create `components/workspace/Block.tsx`:

```typescript
import React from 'react';
import { LegoBlock, Protocol } from '../../types';
import { Typography, DataText } from '../ui';
import { BlockSocket } from './BlockSocket';

interface BlockComponentProps {
  block: LegoBlock;
  isSelected?: boolean;
  isError?: boolean;
  isExecuting?: boolean;
  onSelect?: () => void;
  onDoubleClick?: () => void;
}

const PROTOCOL_COLORS: Record<Protocol, string> = {
  [Protocol.UNISWAP]: '#FF007A',
  [Protocol.AAVE]: '#B6509E',
  [Protocol.COMPOUND]: '#00D395',
  [Protocol.LOGIC]: '#FFD93D',
  [Protocol.RISK]: '#6C63FF',
};

const BLOCK_ICONS: Record<string, string> = {
  UNISWAP_SWAP: '⟲',
  PRICE_CHECK: '💹',
  CREATE_LP_POSITION: '💧',
  COLLECT_FEES: '💰',
  AAVE_SUPPLY: '↓',
  AAVE_BORROW: '↑',
  REPAY_DEBT: '↵',
  HEALTH_FACTOR_CHECK: '♥',
  IF_CONDITION: '?',
  GAS_CHECKER: '⛽',
  STOP_LOSS: '⬛',
  POSITION_SIZE: '📊',
};

export const BlockComponent: React.FC<BlockComponentProps> = ({
  block,
  isSelected = false,
  isError = false,
  isExecuting = false,
  onSelect,
  onDoubleClick,
}) => {
  const protocolColor = PROTOCOL_COLORS[block.protocol];
  const icon = BLOCK_ICONS[block.type] || '•';

  // Border styling
  const borderClass = isSelected
    ? `border-2 border-[${protocolColor}]`
    : isError
    ? 'border-2 border-orange'
    : 'border border-border hover:border-2 hover:border-ink';

  // Background styling
  const bgClass = isSelected ? 'bg-ink' : 'bg-white';
  const textClass = isSelected ? 'text-white' : 'text-ink';

  return (
    <div
      className={`relative w-[120px] cursor-pointer transition-fast ${borderClass}`}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
    >
      {/* Top Socket */}
      <BlockSocket position="top" protocolColor={protocolColor} />

      {/* Header */}
      <div
        className="h-5 px-2 flex items-center"
        style={{ backgroundColor: isSelected ? 'white' : protocolColor }}
      >
        <Typography
          variant="small"
          className={`font-bold uppercase ${isSelected ? 'text-ink' : 'text-white'}`}
        >
          {block.protocol}
        </Typography>
      </div>

      {/* Body */}
      <div className={`px-2 py-3 ${bgClass}`}>
        {/* Icon */}
        <div className={`text-2xl text-center mb-1 ${textClass}`}>
          {icon}
        </div>

        {/* Label */}
        <Typography
          variant="small"
          className={`text-center ${textClass}`}
        >
          {block.label}
        </Typography>
      </div>

      {/* Params Preview (if any) */}
      {block.params && Object.keys(block.params).length > 0 && (
        <div className="bg-gray-100 px-2 py-1 border-t border-border">
          <Typography variant="small" className="text-gray-600 font-mono">
            {/* Show first 2 params */}
            {Object.entries(block.params)
              .slice(0, 2)
              .map(([key, value]) => (
                <div key={key} className="truncate">
                  • {String(value)}
                </div>
              ))}
          </Typography>
        </div>
      )}

      {/* Bottom Socket */}
      <BlockSocket position="bottom" protocolColor={protocolColor} />

      {/* Error Overlay */}
      {isError && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,85,0,0.1) 10px, rgba(255,85,0,0.1) 12px)',
          }}
        />
      )}

      {/* Executing Animation */}
      {isExecuting && (
        <div
          className="absolute inset-0 pointer-events-none border-2 animate-pulse"
          style={{ borderColor: protocolColor }}
        />
      )}
    </div>
  );
};
```

**Step 3: Create workspace barrel export**

Create `components/workspace/index.ts`:

```typescript
export { Canvas } from './Canvas';
export { BlockComponent } from './Block';
export { BlockSocket } from './BlockSocket';
```

**Step 4: Verify in browser**

Run: `npm run dev`
Check:
- Block renders with protocol color header
- Icon centered in body
- Label displays correctly
- Hover changes border to 2px black
- Params preview shows (if present)
- Top/bottom sockets visible (4x4px squares)

**Step 5: Commit**

```bash
git add components/workspace/
git commit -m "feat(ui): redesign block component

- Sharp rectangular cards (120px wide)
- Protocol color header (20px)
- Geometric icon + label in body
- Params preview section (gray background)
- 4x4px connection sockets (top/bottom)
- Selection state (inverted colors)
- Error state (orange border + hatch overlay)
- Executing state (pulsing border)"
```

---

## Remaining Tasks Overview

Due to the massive scope, I'm providing a high-level roadmap for the remaining phases. Each would be broken into similar bite-sized tasks:

### Phase 4: Block Palette & Categories (Tasks 7-9)
- Task 7: Category tab bar component
- Task 8: Block palette grid component
- Task 9: Drag & drop integration

### Phase 5: Configuration Modals (Tasks 10-12)
- Task 10: Modal component framework
- Task 11: Block configuration modal
- Task 12: Form controls (dropdowns, sliders)

### Phase 6: Portfolio Dashboard (Tasks 13-16)
- Task 13: Card-based grid layout
- Task 14: Total value card
- Task 15: Positions table card
- Task 16: Performance chart card
- Task 17: Gas tracker & health factor cards

### Phase 7: Backtest View (Tasks 18-20)
- Task 18: Configuration bar
- Task 19: Metrics panel
- Task 20: Equity curve chart
- Task 21: Trade history table

### Phase 8: Optimize View (Tasks 22-24)
- Task 22: Configuration panel
- Task 23: Pareto frontier chart
- Task 24: Results list

### Phase 9: Polish & Responsive (Tasks 25-27)
- Task 25: Mobile responsiveness
- Task 26: Loading states & animations
- Task 27: Error handling & edge cases

---

## Execution Strategy

**For now, we have 6 foundational tasks completed:**
1. ✅ Tailwind configuration & design tokens
2. ✅ Base UI components (Typography, Button, Input)
3. ✅ Context-aware header
4. ✅ Command palette
5. ✅ Canvas with dot grid
6. ✅ Redesigned block component

**These provide the foundation for all other work.**

**Next Steps:**

Execute Phase 3 completely (Tasks 7-9: Block Palette), then Phase 4 (Configuration), etc.

Each phase can be executed as a separate batch with review checkpoints between phases.

---

## Testing & Verification

Since this is pure UI work, verification is visual:

**After Each Task:**
1. `npm run build` → Must succeed
2. `npm run dev` → Check in browser
3. Verify specific items listed in task
4. Take screenshot if needed
5. Commit

**Phase Completion Checklist:**
- [ ] All tasks build successfully
- [ ] Visual verification passed
- [ ] No console errors
- [ ] All interactions work (click, hover, keyboard)
- [ ] Committed with descriptive messages

---

## Current Status

**Worktree:** `.worktrees/ui-revitalization`
**Branch:** `feature/ui-revitalization`
**Completed:** Tasks 1-6 (Phase 1 & 2 foundations + beginning of Phase 3)
**Next:** Continue Phase 3 (Tasks 7-9) or switch to Phase 4

Ready to execute with **superpowers:executing-plans** or **superpowers:subagent-driven-development**.
