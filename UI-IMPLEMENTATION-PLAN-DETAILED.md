# OpenDecision UI Implementation Plan — DETAILED SPECIFICATION

## Document Purpose
This document provides pixel-perfect specifications for the UI redesign based on:
- Meeting transcript between Parker and Matt
- Reference images: Gemini, ChatGPT, Google Shopping, niche.com, Amazon
- Current state screenshots of Products Panel and Criteria Panel

---

# PART 1: GLOBAL DESIGN SYSTEM

## 1.1 Color Palette — The "Less Minty" Direction

**Meeting Note**: *"It's too minty... I want it to be more black and white... ChatGPT colors"*

### Primary Palette (95% of UI)
```css
:root {
  /* ═══════════════════════════════════════════════════════════════
     BACKGROUNDS — Layered depth system
     ═══════════════════════════════════════════════════════════════ */
  --bg-base: #FAFAFA;              /* Page background */
  --bg-surface: #FFFFFF;           /* Cards, panels */
  --bg-elevated: #FFFFFF;          /* Modals, dropdowns */
  --bg-sunken: #F5F5F5;            /* Input fields, wells */
  --bg-hover: #F0F0F0;             /* Hover states */
  --bg-active: #E8E8E8;            /* Active/pressed states */

  /* ═══════════════════════════════════════════════════════════════
     TEXT — High contrast hierarchy
     ═══════════════════════════════════════════════════════════════ */
  --text-primary: #1A1A1A;         /* Headlines, product names */
  --text-secondary: #4A4A4A;       /* Body copy, descriptions */
  --text-tertiary: #6B6B6B;        /* Labels, metadata */
  --text-muted: #9CA3AF;           /* Placeholders, hints */
  --text-disabled: #D1D5DB;        /* Disabled states */
  --text-inverse: #FFFFFF;         /* Text on dark backgrounds */

  /* ═══════════════════════════════════════════════════════════════
     BORDERS — Subtle definition
     ═══════════════════════════════════════════════════════════════ */
  --border-default: #E5E7EB;       /* Standard borders */
  --border-subtle: #F3F4F6;        /* Very light separators */
  --border-strong: #D1D5DB;        /* Emphasized borders */
  --border-focus: #1A1A1A;         /* Focus rings */

  /* ═══════════════════════════════════════════════════════════════
     SCOUT AI ACCENT — ONLY for AI elements
     This is the ONLY place teal/mint appears
     ═══════════════════════════════════════════════════════════════ */
  --scout-primary: #4BBEB3;        /* Scout buttons, compass needle */
  --scout-secondary: #6EDCD1;      /* Scout hover states */
  --scout-bg: rgba(75, 190, 179, 0.06);   /* Subtle AI backgrounds */
  --scout-border: rgba(75, 190, 179, 0.15); /* AI element borders */
  --scout-glow: rgba(75, 190, 179, 0.4);    /* Glow effects */

  /* ═══════════════════════════════════════════════════════════════
     FUNCTIONAL COLORS
     ═══════════════════════════════════════════════════════════════ */
  --success: #10B981;              /* Added, completed */
  --success-bg: rgba(16, 185, 129, 0.08);
  --warning: #F59E0B;              /* Caution states */
  --error: #EF4444;                /* Errors, remove */
  --error-bg: rgba(239, 68, 68, 0.08);

  /* ═══════════════════════════════════════════════════════════════
     MATCH SCORE COLORS — Gradient from poor to excellent
     ═══════════════════════════════════════════════════════════════ */
  --score-excellent: #10B981;      /* 85-100% */
  --score-good: #6EE7B7;           /* 70-84% */
  --score-average: #FCD34D;        /* 50-69% */
  --score-poor: #F87171;           /* Below 50% */
}
```

### Color Application Rules

| Element Type | Background | Text | Border | Notes |
|-------------|------------|------|--------|-------|
| Page background | `--bg-base` | — | — | #FAFAFA flat |
| Product cards | `--bg-surface` | — | `--border-subtle` | White with subtle shadow |
| Added products section | `--bg-sunken` | — | none | Recessed container |
| Input fields | `--bg-sunken` | `--text-primary` | `--border-default` | Gray fill |
| Buttons (primary) | `#1A1A1A` | `--text-inverse` | none | Black buttons |
| Buttons (secondary) | transparent | `--text-secondary` | `--border-default` | Outlined |
| Scout AI elements | `--scout-bg` | `--scout-primary` | `--scout-border` | ONLY teal |
| Tags/badges | `--bg-sunken` | `--text-tertiary` | none | Neutral chips |

---

## 1.2 Typography System

```css
:root {
  /* Font Stack */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Font Sizes — Mobile-first, scale up */
  --text-xs: 0.6875rem;     /* 11px - Labels, badges */
  --text-sm: 0.8125rem;     /* 13px - Secondary text, descriptions */
  --text-base: 0.875rem;    /* 14px - Body text */
  --text-md: 0.9375rem;     /* 15px - Product names, emphasis */
  --text-lg: 1rem;          /* 16px - Section headers */
  --text-xl: 1.125rem;      /* 18px - Panel headers */
  --text-2xl: 1.25rem;      /* 20px - Page titles */

  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;

  /* Letter Spacing */
  --tracking-tight: -0.01em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
}
```

### Typography Application

| Element | Size | Weight | Color | Letter Spacing |
|---------|------|--------|-------|----------------|
| Product name | `--text-md` (15px) | `--font-semibold` | `--text-primary` | `--tracking-tight` |
| Product description | `--text-sm` (13px) | `--font-normal` | `--text-secondary` | `--tracking-normal` |
| Section header | `--text-lg` (16px) | `--font-semibold` | `--text-primary` | `--tracking-tight` |
| Label (uppercase) | `--text-xs` (11px) | `--font-semibold` | `--text-tertiary` | `--tracking-wider` |
| Match score | `--text-sm` (13px) | `--font-medium` | varies by score | `--tracking-normal` |
| Button text | `--text-sm` (13px) | `--font-medium` | varies | `--tracking-normal` |
| Tag/badge | `--text-xs` (11px) | `--font-medium` | `--text-tertiary` | `--tracking-normal` |

---

## 1.3 Spacing & Layout System

```css
:root {
  /* Spacing Scale — 4px base unit */
  --space-0: 0;
  --space-1: 0.25rem;    /* 4px */
  --space-2: 0.5rem;     /* 8px */
  --space-3: 0.75rem;    /* 12px */
  --space-4: 1rem;       /* 16px */
  --space-5: 1.25rem;    /* 20px */
  --space-6: 1.5rem;     /* 24px */
  --space-8: 2rem;       /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */

  /* Border Radius */
  --radius-sm: 4px;      /* Tags, small elements */
  --radius-md: 6px;      /* Buttons, inputs */
  --radius-lg: 8px;      /* Cards */
  --radius-xl: 12px;     /* Panels, modals */
  --radius-2xl: 16px;    /* Large containers */
  --radius-full: 9999px; /* Pills, avatars */

  /* Shadows — Subtle, not glassy */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.03);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.04), 0 4px 6px rgba(0, 0, 0, 0.02);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.05), 0 10px 10px rgba(0, 0, 0, 0.02);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;
  --transition-spring: 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## 1.4 Layout Grid — The Critical Change

**Meeting Note**: *"Google Shopping... left side is like filters... products on the right"*

### Current Layout (WRONG)
```
┌─────────────────────────────────────────────────────────────────┐
│                           HEADER                                 │
├────────────────────────────┬────────────────────────────────────┤
│                            │                                    │
│     DECISION PROFILE       │         PRODUCTS PANEL             │
│         (50%)              │            (50%)                   │
│                            │                                    │
└────────────────────────────┴────────────────────────────────────┘
```

### Target Layout (CORRECT)
```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER (60px) — Hides on scroll down, shows on scroll up        │
├───────────────┬─────────────────────────────────────────────────┤
│               │                                                 │
│   DECISION    │              PRODUCTS AREA                      │
│   PROFILE     │                                                 │
│               │  ┌─ Added (compact) ──────────────────────────┐ │
│   Width:      │  │ [chip] [chip] [chip]  Go to DecisionHub →  │ │
│   320px       │  └────────────────────────────────────────────┘ │
│   FIXED       │                                                 │
│               │  ┌─ Recommended ──────────────────────────────┐ │
│   Sticky      │  │                                            │ │
│   top: 84px   │  │  ┌─────────────────────────────────────┐   │ │
│               │  │  │ Product Card (full width initially) │   │ │
│               │  │  └─────────────────────────────────────┘   │ │
│               │  │                                            │ │
│               │  │  ┌─────────────────────────────────────┐   │ │
│               │  │  │ Product Card                        │   │ │
│               │  │  └─────────────────────────────────────┘   │ │
│               │  │                                            │ │
│               │  └────────────────────────────────────────────┘ │
│               │                                                 │
└───────────────┴─────────────────────────────────────────────────┘
```

### CSS Implementation
```css
.setup-view {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: var(--space-6); /* 24px */
  padding: var(--space-6);
  min-height: calc(100vh - 60px);
  background: var(--bg-base);
  align-items: start; /* Panels align to top */
}

.decision-profile {
  width: 320px;
  position: sticky;
  top: 84px; /* Header height (60px) + spacing (24px) */
  max-height: calc(100vh - 108px); /* Viewport - header - padding */
  overflow-y: auto;
  scrollbar-width: thin;
}

.products-area {
  flex: 1;
  min-width: 0; /* Prevent overflow */
}

/* Responsive: Stack on smaller screens */
@media (max-width: 1024px) {
  .setup-view {
    grid-template-columns: 1fr;
  }

  .decision-profile {
    position: relative;
    top: 0;
    width: 100%;
    max-height: none;
  }
}
```

---

# PART 2: DECISION PROFILE PANEL (Left Side)

## 2.1 Current vs Target State

### Current Problems (from screenshot)
- Too wide (50% of screen)
- Rich text editor is overkill
- Attachments section takes too much space
- Criteria sliders expanded by default
- Multiple sections competing for attention

### Target State
**Meeting Note**: *"Objective at top... tags should be in dropdown... smaller panel"*

```
┌─────────────────────────────────────┐
│  DECISION PROFILE                   │
│  ─────────────────────────────────  │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ What must improve in 6 months?  ││
│  │ ________________________________││
│  │ |                              |||
│  │ |  [Textarea - 3 lines]        |||
│  │ |______________________________|||
│  └─────────────────────────────────┘│
│                                     │
│  ┌──────────┐ ┌──────────┐         │
│  │Team Size▼│ │Method   ▼│         │
│  └──────────┘ └──────────┘         │
│  ┌─────────────────────────────────┐│
│  │ Industry                      ▼ ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ ▶ Evaluation Criteria (4)       ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ ▶ Attachments (0)               ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │  ◎  Run Guided Profile          ││
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

## 2.2 Component Specifications

### 2.2.1 Panel Container
```tsx
// DecisionProfilePanel.tsx
<aside className="decision-profile-panel">
  {/* No visible header - implicit by position */}
  <div className="profile-content">
    {/* Sections go here */}
  </div>
</aside>
```

```css
.decision-profile-panel {
  width: 320px;
  background: var(--bg-surface);
  border-radius: var(--radius-xl); /* 12px */
  padding: var(--space-5); /* 20px */
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-subtle);
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4); /* 16px between sections */
}
```

### 2.2.2 Objective Section (TOP - Most Important)
**Meeting Note**: *"Objective at top"*

```tsx
<section className="objective-section">
  <label className="section-label">
    What must improve in 6 months?
  </label>
  <textarea
    className="objective-input"
    placeholder="e.g., We need better visibility into resource allocation across 50+ concurrent projects..."
    rows={3}
  />
</section>
```

```css
.section-label {
  display: block;
  font-size: var(--text-sm); /* 13px */
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  margin-bottom: var(--space-2); /* 8px */
}

.objective-input {
  width: 100%;
  padding: var(--space-3); /* 12px */
  background: var(--bg-sunken);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md); /* 6px */
  font-size: var(--text-base); /* 14px */
  font-family: var(--font-sans);
  color: var(--text-primary);
  resize: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  line-height: var(--leading-normal);
}

.objective-input::placeholder {
  color: var(--text-muted);
}

.objective-input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.08);
}
```

### 2.2.3 Context Dropdowns
**Meeting Note**: *"Tags should be in dropdown"*

```tsx
<section className="context-section">
  <div className="context-row">
    <SelectDropdown
      label="Team Size"
      value={teamSize}
      onChange={setTeamSize}
      options={[
        { value: '1-50', label: '1-50 users' },
        { value: '51-200', label: '51-200 users' },
        { value: '201-500', label: '201-500 users' },
        { value: '500+', label: '500+ users' },
      ]}
    />
    <SelectDropdown
      label="Methodology"
      value={methodology}
      onChange={setMethodology}
      options={[
        { value: 'agile', label: 'Agile' },
        { value: 'waterfall', label: 'Waterfall' },
        { value: 'hybrid', label: 'Hybrid' },
        { value: 'other', label: 'Other' },
      ]}
    />
  </div>
  <SelectDropdown
    label="Industry"
    value={industry}
    onChange={setIndustry}
    options={[
      { value: 'technology', label: 'Technology' },
      { value: 'finance', label: 'Financial Services' },
      { value: 'healthcare', label: 'Healthcare' },
      { value: 'manufacturing', label: 'Manufacturing' },
      { value: 'retail', label: 'Retail' },
      { value: 'other', label: 'Other' },
    ]}
    fullWidth
  />
</section>
```

```css
.context-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2); /* 8px */
}

.context-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2); /* 8px */
}

/* Select Dropdown Component */
.select-dropdown {
  position: relative;
}

.select-dropdown.full-width {
  grid-column: 1 / -1;
}

.select-label {
  display: block;
  font-size: var(--text-xs); /* 11px */
  font-weight: var(--font-medium);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  margin-bottom: var(--space-1); /* 4px */
}

.select-trigger {
  width: 100%;
  padding: var(--space-2) var(--space-3); /* 8px 12px */
  padding-right: var(--space-8); /* Room for chevron */
  background: var(--bg-sunken);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  font-size: var(--text-sm); /* 13px */
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  transition: border-color var(--transition-fast);

  /* Chevron icon */
  background-image: url("data:image/svg+xml,..."); /* Down chevron */
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 12px;
}

.select-trigger:hover {
  border-color: var(--border-strong);
}

.select-trigger:focus {
  outline: none;
  border-color: var(--border-focus);
}
```

### 2.2.4 Collapsible Sections
**Meeting Note**: Criteria should be COLLAPSED by default

```tsx
interface CollapsibleSectionProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  count,
  defaultOpen = false,
  children
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="collapsible-section">
      <button
        className="collapsible-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <ChevronRight className={cn('trigger-icon', isOpen && 'rotated')} />
        <span className="trigger-title">{title}</span>
        {count !== undefined && (
          <span className="trigger-count">({count})</span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="collapsible-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
```

```css
.collapsible-section {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.collapsible-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3); /* 12px */
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.collapsible-trigger:hover {
  background: var(--bg-hover);
}

.trigger-icon {
  width: 16px;
  height: 16px;
  color: var(--text-tertiary);
  transition: transform var(--transition-fast);
}

.trigger-icon.rotated {
  transform: rotate(90deg);
}

.trigger-title {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.trigger-count {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.collapsible-content {
  padding: 0 var(--space-3) var(--space-3);
}
```

### 2.2.5 Criteria Sliders (Compact Version)
**Current Issue**: Takes too much vertical space
**Solution**: Compact inline design

```tsx
// Current (from screenshot):
// ┌─────────────────────────────────────────────┐
// │ Flexibility & Customization          ✕     │
// │ [1] [2] [3] [4] [5]    Importance Level    │
// └─────────────────────────────────────────────┘

// Target (compact):
// ┌─────────────────────────────────────────────┐
// │ Flexibility & Custom...  [1][2][■][4][5] ✕ │
// └─────────────────────────────────────────────┘
```

```tsx
<div className="criteria-slider-compact">
  <span className="criteria-name" title={criterion.name}>
    {truncate(criterion.name, 22)}
  </span>
  <div className="criteria-buttons">
    {[1, 2, 3, 4, 5].map(value => (
      <button
        key={value}
        className={cn('rating-btn', rating === value && 'active')}
        onClick={() => setRating(value)}
      >
        {value}
      </button>
    ))}
  </div>
  <button className="remove-btn" onClick={onRemove}>
    <X size={12} />
  </button>
</div>
```

```css
.criteria-slider-compact {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--border-subtle);
}

.criteria-slider-compact:last-child {
  border-bottom: none;
}

.criteria-name {
  flex: 1;
  font-size: var(--text-xs); /* 11px */
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.criteria-buttons {
  display: flex;
  gap: 2px;
}

.rating-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-tertiary);
  background: transparent;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.rating-btn:hover {
  border-color: var(--border-strong);
  background: var(--bg-hover);
}

.rating-btn.active {
  background: var(--text-primary);
  border-color: var(--text-primary);
  color: var(--text-inverse);
}

.remove-btn {
  padding: var(--space-1);
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--transition-fast), color var(--transition-fast);
}

.criteria-slider-compact:hover .remove-btn {
  opacity: 1;
}

.remove-btn:hover {
  color: var(--error);
}
```

### 2.2.6 Guided Button (Scout Accent)
**Meeting Note**: *"Scout is simple compass... animated"*

```tsx
<button className="guided-button">
  <ScoutCompass size="sm" animate />
  <span>Run Guided Profile</span>
</button>
```

```css
.guided-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--scout-bg);
  border: 1px solid var(--scout-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--scout-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.guided-button:hover {
  background: rgba(75, 190, 179, 0.12);
  border-color: var(--scout-primary);
}

.guided-button:active {
  transform: scale(0.98);
}

/* This is ONE of the few places teal/mint appears */
```

---

# PART 3: PRODUCTS PANEL (Right Side)

## 3.1 Current vs Target State

### Current Problems (from screenshot)
- "Added" section takes too much space with full cards
- Product cards have too much visual noise
- Tags are scattered on cards
- Match score presentation inconsistent
- "Show more tools" feels buried

### Target State
**Meeting Notes**:
- *"Floating on a single background"*
- *"niche.com style"*
- *"Added products more minimalistic"*
- *"One product per row initially"*

## 3.2 Complete Products Area Structure

```tsx
<main className="products-area">
  {/* Header Row */}
  <header className="products-header">
    <div className="header-left">
      <h2 className="products-title">Products</h2>
      <span className="products-count">{products.length} matches</span>
    </div>
    <div className="header-right">
      <button className="ask-scout-btn">
        <ScoutCompass size="sm" />
        Ask about products
      </button>
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search tools..."
      />
    </div>
  </header>

  {/* Added Products - Compact Chips */}
  {addedProducts.length > 0 && (
    <section className="added-section">
      <div className="added-header">
        <span className="added-label">Added ({addedProducts.length})</span>
        <button className="go-to-hub-link">
          Go to DecisionHub →
        </button>
      </div>
      <div className="added-chips">
        {addedProducts.map(product => (
          <AddedProductChip
            key={product.id}
            product={product}
            onRemove={() => removeProduct(product.id)}
          />
        ))}
      </div>
    </section>
  )}

  {/* Sort/Filter Bar */}
  <div className="sort-bar">
    <div className="recommendation-indicator">
      <span className="indicator-dot" />
      <span className="indicator-label">Strong recommendations</span>
    </div>
    <SortDropdown value={sort} onChange={setSort} />
  </div>

  {/* Products List */}
  <div className="products-list">
    {products.map(product => (
      <ProductCard
        key={product.id}
        product={product}
        isAdded={isProductAdded(product.id)}
        onAdd={() => addProduct(product)}
      />
    ))}
  </div>

  {/* Load More */}
  {hasMore && (
    <button className="load-more-btn">
      Show more tools
      <ChevronDown size={16} />
    </button>
  )}
</main>
```

## 3.3 Component Specifications

### 3.3.1 Products Header
```css
.products-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.products-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.products-count {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.ask-scout-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--text-primary); /* Black button */
  border: none;
  border-radius: var(--radius-full); /* Pill shape */
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-inverse);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.ask-scout-btn:hover {
  background: #333;
  transform: translateY(-1px);
}

/* Search Input */
.search-input-wrapper {
  position: relative;
  width: 200px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  padding-left: 36px;
  background: var(--bg-sunken);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.search-input:focus {
  outline: none;
  border-color: var(--border-focus);
}
```

### 3.3.2 Added Products Section (Compact)
**Meeting Note**: *"Added products more minimalistic, at top"*

```tsx
const AddedProductChip: React.FC<{ product: Tool; onRemove: () => void }> = ({
  product,
  onRemove
}) => (
  <div className="added-chip">
    <div className="chip-avatar" style={{ background: product.brandColor }}>
      {product.name.charAt(0)}
    </div>
    <span className="chip-name">{product.name}</span>
    <button className="chip-remove" onClick={onRemove}>
      <X size={12} />
    </button>
  </div>
);
```

```css
.added-section {
  background: var(--bg-sunken);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-4);
}

.added-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.added-label {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
}

.go-to-hub-link {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-tertiary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.go-to-hub-link:hover {
  color: var(--text-primary);
}

.added-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.added-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  padding-right: var(--space-1);
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
}

.added-chip:hover {
  border-color: var(--border-strong);
}

.chip-avatar {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: var(--font-bold);
  color: white;
}

.chip-name {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.chip-remove {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-full);
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0.5;
  transition: all var(--transition-fast);
}

.chip-remove:hover {
  opacity: 1;
  background: var(--error-bg);
  color: var(--error);
}
```

### 3.3.3 Sort Bar
```css
.sort-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.recommendation-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, #6B7280 0%, #9CA3AF 50%, #6B7280 100%);
  /* Subtle animation */
  animation: indicator-pulse 2s ease-in-out infinite;
}

@keyframes indicator-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.indicator-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
}
```

### 3.3.4 Product Card (The Critical Component)
**Meeting Notes**:
- *"Floating on a single background"*
- *"niche.com style"*
- *"One product per row initially"*

```tsx
interface ProductCardProps {
  product: Tool;
  isAdded: boolean;
  onAdd: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, isAdded, onAdd }) => {
  const matchScore = calculateMatchScore(product);
  const tags = [...product.methodologies, ...product.useCases].slice(0, 3);

  return (
    <article className="product-card">
      {/* Row 1: Avatar, Name, Score, Action */}
      <div className="card-header">
        <div className="card-identity">
          <div
            className="product-avatar"
            style={{ background: getBrandGradient(product.name) }}
          >
            {product.name.charAt(0)}
          </div>
          <div className="product-info">
            <h3 className="product-name">{product.name}</h3>
            <div className="product-tags">
              {tags.map(tag => (
                <span key={tag} className="product-tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="card-actions">
          <MatchScoreBadge score={matchScore} />
          <button className="info-btn">
            <Info size={16} />
          </button>
          {isAdded ? (
            <div className="added-indicator">
              <Check size={14} />
              In DecisionHub
            </div>
          ) : (
            <button className="add-btn" onClick={onAdd}>
              + Add to DecisionHub
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Description */}
      <p className="product-description">
        {product.description || generateDescription(product)}
      </p>
    </article>
  );
};
```

```css
.products-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* Single column by default, as per meeting */
.product-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  transition: all var(--transition-fast);
}

.product-card:hover {
  border-color: var(--border-default);
  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-3);
}

.card-identity {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  flex: 1;
  min-width: 0;
}

.product-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: white;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-size: var(--text-md); /* 15px */
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.product-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.product-tag {
  display: inline-block;
  padding: 2px 8px;
  background: var(--bg-sunken);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs); /* 11px */
  font-weight: var(--font-medium);
  color: var(--text-tertiary);
}

.card-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.info-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.info-btn:hover {
  border-color: var(--border-strong);
  color: var(--text-secondary);
}

.add-btn {
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.add-btn:hover {
  border-color: var(--text-primary);
  color: var(--text-primary);
  background: var(--bg-hover);
}

.added-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  background: var(--success-bg);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--success);
}

.product-description {
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

### 3.3.5 Match Score Badge
```tsx
interface MatchScoreBadgeProps {
  score: number;
}

const MatchScoreBadge: React.FC<MatchScoreBadgeProps> = ({ score }) => {
  const getScoreColor = (score: number) => {
    if (score >= 85) return '--score-excellent';
    if (score >= 70) return '--score-good';
    if (score >= 50) return '--score-average';
    return '--score-poor';
  };

  return (
    <div
      className="match-score-badge"
      style={{ '--score-color': `var(${getScoreColor(score)})` } as React.CSSProperties}
    >
      <span className="score-value">{score}%</span>
      <span className="score-label">Match<br/>Score</span>
    </div>
  );
};
```

```css
.match-score-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  background: var(--bg-sunken);
  border: 2px solid var(--score-color);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.score-value {
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  line-height: 1;
}

.score-label {
  font-size: 8px;
  font-weight: var(--font-medium);
  color: var(--text-muted);
  text-align: center;
  line-height: 1.1;
  margin-top: 2px;
}
```

### 3.3.6 Load More Button
```css
.load-more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  width: 100%;
  padding: var(--space-3);
  margin-top: var(--space-4);
  background: transparent;
  border: none;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-muted);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.load-more-btn:hover {
  color: var(--text-primary);
}

.load-more-btn svg {
  transition: transform var(--transition-fast);
}

.load-more-btn:hover svg {
  transform: translateY(2px);
}
```

---

# PART 4: SCOUT AI SYMBOL

## 4.1 Design Requirements

**Meeting Notes**:
- *"Simple compass symbol"*
- *"Animated... subtle animation"*
- *"Not a robot"*

## 4.2 Scout Compass Component

```tsx
// components/scout/ScoutCompass.tsx

interface ScoutCompassProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  className?: string;
}

const sizes = {
  xs: 14,
  sm: 18,
  md: 24,
  lg: 32,
  xl: 48,
};

export const ScoutCompass: React.FC<ScoutCompassProps> = ({
  size = 'md',
  animate = true,
  className,
}) => {
  const s = sizes[size];

  return (
    <div
      className={cn(
        'scout-compass',
        animate && 'scout-compass-animate',
        className
      )}
      style={{ width: s, height: s }}
    >
      <svg
        width={s}
        height={s}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer circle */}
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Compass needle - diamond shape pointing to cardinal directions */}
        <path
          d="M12 2 L14 12 L12 22 L10 12 Z"
          fill="currentColor"
          className="compass-needle-vertical"
        />
        <path
          d="M2 12 L12 10 L22 12 L12 14 Z"
          fill="currentColor"
          fillOpacity="0.3"
          className="compass-needle-horizontal"
        />

        {/* Center dot */}
        <circle
          cx="12"
          cy="12"
          r="2"
          fill="currentColor"
        />
      </svg>
    </div>
  );
};
```

## 4.3 Scout Compass Animations

```css
.scout-compass {
  color: var(--scout-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* Animated state */
.scout-compass-animate {
  animation: scout-breathe 4s ease-in-out infinite;
}

@keyframes scout-breathe {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 0 0 transparent);
  }
  50% {
    transform: scale(1.05);
    filter: drop-shadow(0 0 6px var(--scout-glow));
  }
}

/* Needle animation - subtle rotation */
.scout-compass-animate .compass-needle-vertical {
  transform-origin: center;
  animation: needle-seek 8s ease-in-out infinite;
}

@keyframes needle-seek {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(10deg); }
  50% { transform: rotate(0deg); }
  75% { transform: rotate(-10deg); }
}

/* Hover state - more pronounced */
.scout-compass:hover {
  animation: none;
  transform: scale(1.1);
  filter: drop-shadow(0 0 8px var(--scout-glow));
}

.scout-compass:hover .compass-needle-vertical {
  animation: needle-spin 0.5s ease-out;
}

@keyframes needle-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Active/Loading state */
.scout-compass.loading {
  animation: scout-pulse 1s ease-in-out infinite;
}

@keyframes scout-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(0.95);
    opacity: 0.7;
  }
}

.scout-compass.loading .compass-needle-vertical {
  animation: needle-spin 1s linear infinite;
}
```

## 4.4 Scout Symbol Usage

| Location | Size | Animate | Notes |
|----------|------|---------|-------|
| "Ask about products" button | sm (18px) | false | Static in button |
| Guided Profile button | sm (18px) | true | Subtle animation |
| AI Chat panel header | md (24px) | true | Active animation |
| Scout FAB | lg (32px) | true | Prominent |
| Scout Overlay header | xl (48px) | true | Large hero |
| Loading states | md (24px) | loading | Spinning |

---

# PART 5: HEADER WITH SCROLL BEHAVIOR

## 5.1 Requirements

**Meeting Note**: *"Amazon style... hide when scrolling down, show when scrolling up"*

## 5.2 Implementation

```tsx
// components/layout/AppHeader.tsx

export const AppHeader: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10; // Minimum scroll distance to trigger

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      // Check if at top of page
      setIsAtTop(currentScrollY < 10);

      // Only trigger if scroll delta exceeds threshold
      if (Math.abs(scrollDelta) < scrollThreshold) {
        return;
      }

      if (scrollDelta > 0 && currentScrollY > 60) {
        // Scrolling DOWN and past header height
        setIsVisible(false);
      } else if (scrollDelta < 0) {
        // Scrolling UP
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    // Throttle scroll handler
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, []);

  return (
    <header
      className={cn(
        'app-header',
        isVisible ? 'header-visible' : 'header-hidden',
        isAtTop && 'header-at-top'
      )}
    >
      {/* Header content */}
    </header>
  );
};
```

```css
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  z-index: 100;
  transition: transform var(--transition-slow),
              box-shadow var(--transition-slow),
              border-color var(--transition-slow);
}

.header-visible {
  transform: translateY(0);
}

.header-hidden {
  transform: translateY(-100%);
}

/* When at top of page - no shadow, lighter border */
.header-at-top {
  border-color: transparent;
  box-shadow: none;
}

/* When scrolled - add shadow for depth */
.header-visible:not(.header-at-top) {
  box-shadow: var(--shadow-sm);
  border-color: var(--border-subtle);
}
```

---

# PART 6: IMPLEMENTATION CHECKLIST

## Phase 1: Foundation (Days 1-2)
- [ ] Create `design-tokens.css` with all CSS custom properties
- [ ] Update `tailwind.config.ts` with new design tokens
- [ ] Create `ScoutCompass` component
- [ ] Update `globals.css` to import design tokens

## Phase 2: Layout (Days 3-4)
- [ ] Refactor `SetupView.tsx` - change from 50/50 to 320px/fluid
- [ ] Implement scroll-aware `AppHeader`
- [ ] Update main content margin/padding

## Phase 3: Decision Profile (Days 5-6)
- [ ] Create new `DecisionProfilePanel` component
- [ ] Move objective to top
- [ ] Implement context dropdowns (Team Size, Methodology, Industry)
- [ ] Create collapsible sections for Criteria and Attachments
- [ ] Implement compact criteria sliders
- [ ] Add Guided button with Scout compass

## Phase 4: Products Panel (Days 7-9)
- [ ] Create new `ProductsArea` container
- [ ] Implement compact `AddedProductChip` components
- [ ] Create new `ProductCard` design
- [ ] Implement `MatchScoreBadge` component
- [ ] Update sort bar and indicators
- [ ] Add load more functionality

## Phase 5: Polish (Days 10-11)
- [ ] Add hover/focus states to all interactive elements
- [ ] Implement transitions and micro-animations
- [ ] Test responsive behavior
- [ ] Color consistency audit (remove excess mint/teal)
- [ ] Accessibility review (contrast, focus states)

## Phase 6: Integration (Days 12-14)
- [ ] Replace old components with new ones
- [ ] Test data flow and state management
- [ ] Cross-browser testing
- [ ] Performance optimization
- [ ] Final QA

---

# PART 7: FILE CHANGES MATRIX

| File | Change Type | Priority | Estimated LOC |
|------|-------------|----------|---------------|
| `src/styles/design-tokens.css` | NEW | P0 | ~200 |
| `tailwind.config.ts` | MODIFY | P0 | ~100 |
| `src/app/globals.css` | MODIFY | P0 | ~50 |
| `src/opendecision/shared/components/scout/ScoutCompass.tsx` | NEW | P1 | ~80 |
| `src/opendecision/shared/components/layout/AppHeader.tsx` | MODIFY | P1 | ~150 |
| `src/opendecision/features/setup/components/SetupView.tsx` | MAJOR REFACTOR | P1 | ~100 |
| `src/opendecision/features/setup/components/DecisionProfilePanel.tsx` | NEW | P1 | ~300 |
| `src/opendecision/features/setup/components/ProductsArea.tsx` | NEW | P1 | ~200 |
| `src/opendecision/features/setup/components/ProductCard.tsx` | NEW | P1 | ~150 |
| `src/opendecision/features/setup/components/AddedProductChip.tsx` | NEW | P2 | ~50 |
| `src/opendecision/features/setup/components/MatchScoreBadge.tsx` | NEW | P2 | ~40 |
| `src/opendecision/features/setup/components/CollapsibleSection.tsx` | NEW | P2 | ~60 |
| `src/opendecision/features/setup/components/SelectDropdown.tsx` | NEW | P2 | ~80 |
| `src/opendecision/features/setup/components/CriteriaSlidersCompact.tsx` | NEW | P2 | ~100 |
| `src/opendecision/shared/components/ui/criteria-sliders.tsx` | DEPRECATE | P3 | -200 |
| `src/opendecision/features/setup/components/ProjectProfileCard.tsx` | DEPRECATE | P3 | -400 |
| `src/opendecision/features/setup/components/ProductsPanel.tsx` | DEPRECATE | P3 | -350 |

**Total New Code**: ~1,510 LOC
**Total Deprecated**: ~950 LOC
**Net Change**: +560 LOC

---

*This document serves as the complete specification for the OpenDecision UI redesign. All measurements, colors, and behaviors are derived from the meeting transcript and reference images provided.*
