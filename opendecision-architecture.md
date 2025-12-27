# OpenDecision Architecture

## Overview

OpenDecision follows a **feature-based architecture** inspired by [Bulletproof React](https://github.com/alan2207/bulletproof-react). The core principle is organizing code by business domain rather than technical type, creating self-contained feature modules with clear boundaries.

```
src/opendecision/
├── app/              # Application orchestration layer
├── features/         # Business domain modules
├── shared/           # Cross-cutting infrastructure
├── data/             # Static data & constants
└── index.ts          # Public API barrel export
```

---

## Core Principles

### 1. Unidirectional Dependencies
Code flows in one direction: `shared → features → app`

```
┌─────────────────────────────────────────────────────┐
│                        app/                          │
│         (orchestrates features, handles routing)     │
└─────────────────────────┬───────────────────────────┘
                          │ imports from
                          ▼
┌─────────────────────────────────────────────────────┐
│                     features/                        │
│    (self-contained business domains with UI)         │
└─────────────────────────┬───────────────────────────┘
                          │ imports from
                          ▼
┌─────────────────────────────────────────────────────┐
│                      shared/                         │
│       (types, utils, hooks, UI primitives)           │
└─────────────────────────────────────────────────────┘
```

**Rules:**
- `shared/` NEVER imports from `features/` or `app/`
- `features/` NEVER imports from `app/`
- `features/` CAN import from other `features/` (sparingly)
- `app/` orchestrates everything

### 2. Feature Encapsulation
Each feature is a mini-application with its own:
- Components (UI specific to this feature)
- Hooks (feature-specific state/logic)
- Types (if needed beyond shared types)
- Index.ts (public API)

### 3. Barrel Exports
Every feature exposes a clean public API via `index.ts`:

```typescript
// Import from feature barrel (preferred)
import { ToolSection, FilterSystem } from '@/opendecision/features/tools';

// NOT from deep paths (avoid)
import { ToolSection } from '@/opendecision/features/tools/components/ToolSection';
```

---

## Folder Structure

### `/app` - Application Layer

The orchestration layer that wires features together.

```
app/
├── flows/           # Main application flows
│   └── DecisionFlow.tsx    # Primary decision-making UI orchestrator
├── layouts/         # Page layout components (reserved)
└── providers/       # Combined context providers (reserved)
```

**DecisionFlow.tsx** is the main component that:
- Manages global application state
- Coordinates between features (criteria, tools, comparison)
- Handles the decision-making workflow
- Integrates AI chat sidebar

---

### `/features` - Business Domains

Each feature is a self-contained module for a specific business capability.

```
features/
├── admin/           # Administrative functionality
├── ai-chat/         # AI assistant integration
├── comparison/      # Tool comparison & visualization
├── criteria/        # Criteria management & rating
├── profile/         # User/project profile
├── ranking/         # Guided ranking system
├── recommendations/ # AI-powered recommendations
└── tools/           # Tool discovery & filtering
```

#### Feature Structure Pattern

Each feature follows this structure:

```
feature-name/
├── components/      # Feature-specific React components
│   ├── MainComponent.tsx
│   └── SubComponent.tsx
├── hooks/           # Feature-specific hooks (optional)
├── utils/           # Feature-specific utilities (optional)
├── types.ts         # Feature-specific types (optional)
└── index.ts         # Public API exports
```

#### Feature Details

| Feature | Purpose | Key Components |
|---------|---------|----------------|
| **tools** | Tool discovery, filtering, display | `ToolSection`, `FilterSystem`, `RecommendedToolsSection` |
| **criteria** | Criteria management & user ratings | `CriteriaSection`, `CriteriaGuidance` |
| **comparison** | Radar charts & tool comparison | `ComparisonChart`, `ComparisonSection` |
| **ranking** | Guided ranking wizard | `GuidedRankingForm`, `GuidedSubmitAnimation` |
| **ai-chat** | AI assistant sidebar | `AIChatPanel`, `ChatHistoryDropdown` |
| **recommendations** | AI tool recommendations | `EnhancedRecommendationSection` |
| **profile** | Project profile management | `ProjectProfileSection`, `FileUpload` |
| **admin** | Tool CRUD, analytics | `AdminDashboard`, `AdminToolForm` |

---

### `/shared` - Cross-Cutting Infrastructure

Reusable code that any feature can import.

```
shared/
├── components/      # Reusable UI components
│   ├── ui/          # Base primitives (shadcn)
│   ├── cards/       # Card components
│   ├── layout/      # Layout components
│   ├── animations/  # Animation wrappers
│   ├── auth/        # Authentication UI
│   ├── common/      # Common utilities (ErrorBoundary, etc.)
│   ├── forms/       # Form components
│   ├── interactive/ # Draggable, sortable components
│   ├── navigation/  # Nav components
│   └── overlays/    # Modal/overlay components
├── contexts/        # React contexts
├── hooks/           # Shared React hooks
├── lib/             # External library wrappers
├── services/        # API/data services
├── types/           # TypeScript definitions
└── utils/           # Utility functions
```

#### Key Shared Modules

| Module | Contents |
|--------|----------|
| `types/` | `Tool`, `Criterion`, `FilterCondition`, etc. |
| `hooks/` | `useUnifiedMobileDetection`, `useLenis`, `useShuffleAnimation` |
| `contexts/` | `GuidanceContext`, `SpaceContext` |
| `services/` | `chatHistoryService`, `aiService` |
| `utils/` | `filterTools`, `toolRating`, `criteriaStorage` |

---

### `/data` - Static Data

Application constants and default data.

```
data/
├── tools.ts              # Default tool definitions
├── criteria.ts           # Default criteria definitions
└── criteriaDescriptions.ts  # Criteria rating descriptions
```

---

## Import Patterns

### Preferred: Absolute Imports

Always use the `@/opendecision/` alias:

```typescript
// Good - absolute imports
import { Tool, Criterion } from '@/opendecision/shared/types';
import { ToolSection } from '@/opendecision/features/tools';
import { DecisionFlow } from '@/opendecision/app/flows/DecisionFlow';

// Avoid - relative imports across boundaries
import { Tool } from '../../../shared/types';  // ❌
```

### Feature Imports

```typescript
// From barrel export (preferred for public API)
import { ComparisonChart } from '@/opendecision/features/comparison';

// Direct import (when barrel doesn't expose it)
import { ChartControls } from '@/opendecision/features/comparison/components/ChartControls';
```

### Shared Component Imports

```typescript
// UI primitives
import { Button } from '@/opendecision/shared/components/ui/button';
import { Slider } from '@/opendecision/shared/components/ui/slider';

// Layout components
import { SplitView } from '@/opendecision/shared/components/layout/SplitView';

// Common utilities
import { ErrorBoundary } from '@/opendecision/shared/components/common/ErrorBoundary';
```

---

## Data Flow

### State Management

OpenDecision uses a hybrid approach:

1. **React Context** - Global UI state (guidance, space)
2. **Local State** - Component-specific state
3. **localStorage** - Persistence (criteria values, chat history)
4. **Supabase** - Server state (tools, projects)

```
┌─────────────────────────────────────────────────────┐
│                   DecisionFlow                       │
│  ┌─────────────────────────────────────────────┐    │
│  │ State: criteria, tools, filters, view mode  │    │
│  └─────────────────────────────────────────────┘    │
│         │                    │                       │
│         ▼                    ▼                       │
│  ┌─────────────┐      ┌─────────────┐               │
│  │ CriteriaSection    │ ToolSection │               │
│  │ (user ratings)     │ (filtering) │               │
│  └─────────────┘      └─────────────┘               │
│         │                    │                       │
│         └────────┬───────────┘                       │
│                  ▼                                   │
│         ┌─────────────────┐                         │
│         │ ComparisonChart │                         │
│         │ (visualization) │                         │
│         └─────────────────┘                         │
└─────────────────────────────────────────────────────┘
```

### Criteria → Tools Flow

```
User adjusts criterion rating
         │
         ▼
CriteriaSection updates state
         │
         ▼
DecisionFlow recalculates tool scores
         │
         ▼
ToolSection re-renders with new order
         │
         ▼
ComparisonChart updates visualization
```

---

## Adding New Features

### Step 1: Create Feature Structure

```bash
mkdir -p src/opendecision/features/my-feature/components
```

### Step 2: Create Components

```typescript
// features/my-feature/components/MyComponent.tsx
import { Tool } from '@/opendecision/shared/types';
import { Button } from '@/opendecision/shared/components/ui/button';

export const MyComponent = () => {
  return <div>...</div>;
};
```

### Step 3: Create Barrel Export

```typescript
// features/my-feature/index.ts
export { MyComponent } from './components/MyComponent';
export { MyOtherComponent } from './components/MyOtherComponent';
```

### Step 4: Use in App Layer

```typescript
// app/flows/DecisionFlow.tsx
import { MyComponent } from '@/opendecision/features/my-feature';
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `app/flows/DecisionFlow.tsx` | Main application orchestrator (1500+ lines) |
| `features/tools/components/ToolSection.tsx` | Tool list with filtering |
| `features/criteria/components/CriteriaSection.tsx` | Criteria rating interface |
| `features/comparison/components/ComparisonChart.tsx` | Radar chart visualization |
| `features/ranking/components/GuidedRankingForm.tsx` | Step-by-step ranking wizard |
| `shared/types/index.ts` | Core TypeScript definitions |
| `shared/utils/filterTools.ts` | Tool filtering logic |
| `shared/utils/toolRating.ts` | Score calculation utilities |

---

## Best Practices

### Do's
- Import from feature barrel exports when possible
- Keep features focused on a single business domain
- Put truly reusable code in `shared/`
- Use absolute imports with `@/opendecision/`

### Don'ts
- Don't import from `app/` into `features/`
- Don't import from `features/` into `shared/`
- Don't create deep component hierarchies within features
- Don't bypass barrel exports without good reason

### When to Create a New Feature
- The functionality represents a distinct business domain
- It has 3+ components that work together
- It could theoretically be developed independently

### When to Use Shared
- The code is truly generic (not business-specific)
- Multiple features need the same component/utility
- It's a UI primitive or infrastructure concern

---

## Migration Notes

### Renamed Components
| Old Name | New Name | Location |
|----------|----------|----------|
| `EmbeddedPPMToolFlow` | `DecisionFlow` | `app/flows/` |
| `ppm-tool` | `opendecision` | `src/` |

### Moved Locations
| Component Type | Old Location | New Location |
|----------------|--------------|--------------|
| AI components | `components/ai/` | `features/ai-chat/components/` |
| Charts | `components/charts/` | `features/comparison/components/` |
| Filters | `components/filters/` | `features/tools/components/` |
| UI primitives | `components/ui/` | `shared/components/ui/` |
| Cards | `components/cards/` | `shared/components/cards/` |
