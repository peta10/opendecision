# OpenDecision UI Implementation Plan
## Reference-Based Redesign for Minimalist, Modern Interface

Based on the reference images (Gemini, ChatGPT, Google Shopping, niche.com, category grid) and meeting discussion, this document outlines the comprehensive UI transformation plan.

---

## 1. Design Philosophy

### Core Principles (from References)
| Reference | Key Pattern to Adopt |
|-----------|---------------------|
| **ChatGPT** | Neutral dark/light theme, centered focus, minimal color, clean input styling |
| **Gemini** | Greeting-first UX, action buttons below input, quick suggestions |
| **Google Shopping** | Left sidebar filters (compact), right side results, floating cards |
| **niche.com** | Left panel → Right floating cards, "Add to List" pattern, details inline |
| **Category Grid** | Floating cards on single background, subtle shadows, clean icons |

### Visual Direction
- **Background**: Single neutral surface (no busy gradients)
- **Cards**: Floating with subtle shadows (not boxed sections)
- **Colors**: 90% grayscale, accent only for CTAs and Scout AI
- **Typography**: Clean, high contrast, less decorative
- **Spacing**: Generous whitespace, breathing room

---

## 2. Color System Overhaul

### Current → New Palette

```css
/* OLD: Too minty, too much color */
--scout: #6EDCD1;
--scout-light: #8FE8DF;
--scout-dark: #4BBEB3;

/* NEW: ChatGPT-inspired neutrals + subtle accent */
:root {
  /* Primary Neutrals */
  --bg-primary: #FAFAFA;           /* Main background */
  --bg-secondary: #F5F5F5;         /* Card backgrounds */
  --bg-tertiary: #FFFFFF;          /* Elevated surfaces */

  /* Text Hierarchy */
  --text-primary: #1A1A1A;         /* Headlines, important text */
  --text-secondary: #4A4A4A;       /* Body text */
  --text-muted: #8E8E8E;           /* Labels, hints */
  --text-disabled: #BDBDBD;        /* Disabled states */

  /* Borders & Dividers */
  --border-default: #E5E5E5;       /* Standard borders */
  --border-subtle: #F0F0F0;        /* Subtle separators */
  --border-focus: #1A1A1A;         /* Focus states */

  /* Scout AI Accent (reserved for AI elements only) */
  --scout-accent: #4BBEB3;         /* Scout buttons, compass */
  --scout-bg: rgba(75, 190, 179, 0.08);  /* Subtle AI backgrounds */
  --scout-border: rgba(75, 190, 179, 0.2); /* AI element borders */

  /* Functional Colors */
  --success: #22C55E;
  --warning: #EAB308;
  --error: #EF4444;
}
```

### Color Usage Rules
1. **Scout accent** ONLY for AI elements (compass, Scout panel, AI suggestions)
2. **All other UI** uses neutral grayscale
3. **Interactive states** use darker shades, not color changes
4. **Shadows** replace colored borders for depth

---

## 3. Layout Architecture

### Current 50/50 Grid → New Asymmetric Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ HEADER (hides on scroll down, shows on scroll up)                   │
├──────────────────────┬──────────────────────────────────────────────┤
│                      │                                              │
│  DECISION PROFILE    │         PRODUCTS AREA                        │
│  (narrower: 320px)   │         (full remaining width)               │
│                      │                                              │
│  ┌────────────────┐  │  ┌─ Added Products (compact, top) ─────────┐ │
│  │ Objective      │  │  │ [Logo] Monday.com          ✓ In Hub    │ │
│  │ (text area)    │  │  │ [Logo] Asana               ✓ In Hub    │ │
│  └────────────────┘  │  └────────────────────────────────────────┘ │
│                      │                                              │
│  ┌────────────────┐  │  ┌─ Recommended Products ───────────────────┐│
│  │ Team Size  ▼  │  │  │                                          ││
│  │ Methodology▼  │  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ││
│  │ Industry   ▼  │  │  │  │ Card 1  │  │ Card 2  │  │ Card 3  │  ││
│  └────────────────┘  │  │  └─────────┘  └─────────┘  └─────────┘  ││
│                      │  │                                          ││
│  ┌────────────────┐  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ││
│  │ Criteria ▼    │  │  │  │ Card 4  │  │ Card 5  │  │ Card 6  │  ││
│  │ (collapsed)   │  │  │  └─────────┘  └─────────┘  └─────────┘  ││
│  └────────────────┘  │  └────────────────────────────────────────┘ │
│                      │                                              │
│  [Guided ⟳]         │                                              │
│                      │                                              │
└──────────────────────┴──────────────────────────────────────────────┘
```

### Grid Specification
```css
.setup-view {
  display: grid;
  grid-template-columns: 320px 1fr;  /* Fixed left, fluid right */
  gap: 24px;
  padding: 24px;
  min-height: calc(100vh - 60px);
  background: var(--bg-primary);
}
```

---

## 4. Component Redesigns

### 4.1 Decision Profile Panel (ProjectProfileCard.tsx)

**Current State**: Large, 50% width, many sections expanded
**Target State**: Compact 320px fixed width, collapsed sections, streamlined

#### Changes Required:

```tsx
// NEW STRUCTURE
<aside className="decision-profile">
  {/* Header - Compact */}
  <header className="flex items-center justify-between mb-4">
    <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
      Decision Profile
    </h2>
    <button className="scout-guided-btn">
      <CompassIcon /> Guided
    </button>
  </header>

  {/* Objective - FIRST, prominent */}
  <section className="objective-section mb-4">
    <label className="text-xs text-text-muted mb-1.5 block">
      What are you trying to improve?
    </label>
    <textarea
      className="objective-input"
      placeholder="e.g., We need better resource allocation visibility..."
      rows={3}
    />
  </section>

  {/* Context Tags - Dropdowns in a row */}
  <section className="context-tags mb-4">
    <div className="grid grid-cols-2 gap-2">
      <Select label="Team Size" options={teamSizes} />
      <Select label="Methodology" options={methodologies} />
    </div>
    <Select label="Industry" options={industries} className="mt-2" />
  </section>

  {/* Criteria - COLLAPSED by default */}
  <Collapsible title="Evaluation Criteria" defaultOpen={false}>
    <CriteriaSliders compact />
  </Collapsible>

  {/* Attachments - Collapsed */}
  <Collapsible title="Attachments" defaultOpen={false}>
    <FileUpload />
  </Collapsible>
</aside>
```

#### Styling:
```css
.decision-profile {
  width: 320px;
  background: var(--bg-tertiary);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  height: fit-content;
  position: sticky;
  top: 80px;
}

.objective-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-default);
  border-radius: 8px;
  font-size: 14px;
  resize: none;
  transition: border-color 0.15s;
}

.objective-input:focus {
  border-color: var(--border-focus);
  outline: none;
}
```

---

### 4.2 Products Panel (ProductsPanel.tsx)

**Current State**: Vertical stack, boxed sections, glass morphism
**Target State**: Floating cards on flat background, niche.com inspired

#### New Structure:

```tsx
<main className="products-area">
  {/* Added Products - Compact horizontal list at top */}
  {addedProducts.length > 0 && (
    <section className="added-products">
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-text-muted uppercase">
          In Decision Hub ({addedProducts.length})
        </h3>
        <button className="text-xs text-text-muted hover:text-text-primary">
          View All →
        </button>
      </header>
      <div className="flex flex-wrap gap-2">
        {addedProducts.map(product => (
          <AddedProductChip key={product.id} product={product} onRemove={onRemove} />
        ))}
      </div>
    </section>
  )}

  {/* Sort/Filter Bar */}
  <div className="flex items-center justify-between mb-4">
    <div className="text-sm text-text-secondary">
      {products.length} products match your criteria
    </div>
    <Select
      value={sortBy}
      onChange={setSortBy}
      options={['Best Match', 'Name A-Z', 'Most Popular']}
    />
  </div>

  {/* Product Grid - Floating cards */}
  <div className="products-grid">
    {products.map(product => (
      <ProductCard key={product.id} product={product} />
    ))}
  </div>
</main>
```

#### Product Card Design (niche.com inspired):

```tsx
<article className="product-card">
  {/* Top: Logo + Name + Match Score */}
  <div className="flex items-start justify-between mb-3">
    <div className="flex items-center gap-3">
      <div className="product-logo" style={{ background: product.brandColor }}>
        {/* Logo or initial */}
      </div>
      <div>
        <h4 className="product-name">{product.name}</h4>
        <p className="product-type">{product.type}</p>
      </div>
    </div>
    <MatchScore score={product.matchScore} />
  </div>

  {/* Middle: Key criteria scores (expandable) */}
  <div className="criteria-preview">
    {topCriteria.map(c => (
      <CriteriaBar key={c.id} name={c.name} score={c.score} />
    ))}
  </div>

  {/* Bottom: Actions */}
  <div className="product-actions">
    <button className="btn-secondary">View Details</button>
    <button className="btn-primary">
      <Plus /> Add to Hub
    </button>
  </div>
</article>
```

#### Styling:
```css
.products-area {
  flex: 1;
  padding: 0;
}

.added-products {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

/* For initial state: one product per row */
.products-grid.single-column {
  grid-template-columns: 1fr;
  max-width: 600px;
}

.product-card {
  background: var(--bg-tertiary);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04),
              0 4px 12px rgba(0, 0, 0, 0.02);
  transition: box-shadow 0.15s, transform 0.15s;
}

.product-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06),
              0 8px 24px rgba(0, 0, 0, 0.04);
  transform: translateY(-2px);
}

.product-logo {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.product-type {
  font-size: 13px;
  color: var(--text-muted);
}
```

---

### 4.3 Scout AI Symbol

**Current State**: Full robot character
**Target State**: Simple animated compass (for buttons/FAB only)

```tsx
// ScoutCompass.tsx
interface ScoutCompassProps {
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

export const ScoutCompass: React.FC<ScoutCompassProps> = ({
  size = 'md',
  animate = true
}) => {
  const sizes = {
    sm: 20,
    md: 28,
    lg: 40
  };
  const s = sizes[size];

  return (
    <div className={cn('scout-compass', animate && 'animate-scout')}>
      <svg
        width={s}
        height={s}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polygon
          points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    </div>
  );
};
```

#### Animation:
```css
.scout-compass {
  color: var(--scout-accent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.scout-compass.animate-scout svg polygon {
  animation: compass-pulse 3s ease-in-out infinite;
  transform-origin: center;
}

@keyframes compass-pulse {
  0%, 100% {
    opacity: 1;
    transform: rotate(0deg) scale(1);
  }
  25% {
    transform: rotate(15deg) scale(1.05);
  }
  50% {
    opacity: 0.8;
    transform: rotate(0deg) scale(0.95);
  }
  75% {
    transform: rotate(-15deg) scale(1.05);
  }
}

/* Glow effect on hover/active */
.scout-compass:hover svg,
.scout-compass.active svg {
  filter: drop-shadow(0 0 8px var(--scout-accent));
}
```

---

### 4.4 Header with Scroll Behavior

**Target**: Hide on scroll down, show on scroll up (like Amazon)

```tsx
// AppHeader.tsx
export const AppHeader: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        // Scrolling down & past threshold
        setIsVisible(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={cn(
        'app-header',
        isVisible ? 'header-visible' : 'header-hidden'
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
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-subtle);
  z-index: 100;
  transition: transform 0.3s ease;
}

.header-visible {
  transform: translateY(0);
}

.header-hidden {
  transform: translateY(-100%);
}
```

---

## 5. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create new CSS custom properties (color system)
- [ ] Update Tailwind config with new design tokens
- [ ] Create base component styles (buttons, inputs, cards)
- [ ] Implement ScoutCompass component

### Phase 2: Layout Restructure (Week 2)
- [ ] Refactor SetupView grid layout (50/50 → 320px/fluid)
- [ ] Redesign ProjectProfileCard (compact, collapsible sections)
- [ ] Redesign ProductsPanel with floating cards
- [ ] Implement scroll-aware header

### Phase 3: Component Polish (Week 3)
- [ ] Product card redesign with match scores
- [ ] Added products compact section
- [ ] Criteria sliders compact mode
- [ ] Search and filter improvements

### Phase 4: Scout AI Elements (Week 4)
- [ ] ScoutCompass integration everywhere
- [ ] Update AIChatPanel styling
- [ ] Scout FAB with compass
- [ ] Guided button updates

---

## 6. File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `tailwind.config.ts` | Modify | Add new design tokens |
| `globals.css` | Modify | New CSS custom properties |
| `SetupView.tsx` | Major Refactor | New grid layout |
| `ProjectProfileCard.tsx` | Major Refactor | Compact design, collapsible |
| `ProductsPanel.tsx` | Major Refactor | Floating cards layout |
| `AppHeader.tsx` | Modify | Scroll-aware behavior |
| `ScoutCompass.tsx` | New | Simple animated compass |
| `product-card.css` | New | Product card styles |
| `decision-profile.css` | New | Profile panel styles |

---

## 7. Key Metrics to Achieve

| Metric | Current | Target |
|--------|---------|--------|
| Decision Profile width | 50% | 320px fixed |
| Primary colors used | 5+ | 2 (neutral + scout accent) |
| Card shadow depth | Heavy glass | Subtle 2-layer |
| Default collapsed sections | 0 | 2 (criteria, attachments) |
| Scout symbol complexity | Full robot | Simple compass |
| Header scroll behavior | Fixed always | Hide on scroll down |

---

## 8. Design Tokens Reference

```json
{
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "32px",
    "2xl": "48px"
  },
  "radius": {
    "sm": "6px",
    "md": "8px",
    "lg": "12px",
    "xl": "16px",
    "full": "9999px"
  },
  "shadow": {
    "subtle": "0 1px 3px rgba(0, 0, 0, 0.04)",
    "card": "0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02)",
    "elevated": "0 2px 8px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.04)"
  },
  "transition": {
    "fast": "0.15s ease",
    "normal": "0.25s ease",
    "slow": "0.35s ease"
  }
}
```

---

*Document created based on meeting transcript and reference images: Gemini, ChatGPT, Google Shopping, niche.com, category grid.*
