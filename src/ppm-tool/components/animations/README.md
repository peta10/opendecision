# 🎭 Tool Shuffle Animation System

A comprehensive animation system for smooth tool reordering with delightful visual feedback.

## 🚀 Quick Start

```tsx
import { useShuffleAnimation, useToolOrderShuffle } from '@/hooks/useShuffleAnimation';
import { ShuffleContainer } from '@/components/animations/ShuffleContainer';
import { AnimatedToolCard } from '@/components/animations/AnimatedToolCard';

function ToolList({ tools, criteria }) {
  // Initialize shuffle animation
  const shuffleAnimation = useShuffleAnimation({
    delayMs: 500,           // Wait 0.5s before animating
    shuffleDurationMs: 1200, // Animation duration
    disabled: false         // Enable animations
  });

  // Calculate sorted tools (this triggers animation when order changes)
  const sortedTools = useMemo(() => {
    return tools.sort((a, b) => calculateScore(b, criteria) - calculateScore(a, criteria));
  }, [tools, criteria]);

  // Set up automatic shuffle triggering
  useToolOrderShuffle(sortedTools, shuffleAnimation, {
    triggerOnChange: true
  });

  return (
    <ShuffleContainer
      tools={sortedTools}
      shuffleAnimation={shuffleAnimation}
      isMobile={isMobile}
      enableParticles={true}
    >
      {sortedTools.map((tool, index) => (
        <AnimatedToolCard key={tool.id} tool={tool} index={index}>
          <YourToolCard tool={tool} />
        </AnimatedToolCard>
      ))}
    </ShuffleContainer>
  );
}
```

## 🎯 How It Works

### 1. Animation Flow
```
User changes criteria → 0.5s delay → Shuffle animation → New tool order
```

### 2. Key Components

#### `useShuffleAnimation`
- Manages animation timing and state
- Handles the 0.5s delay before shuffling
- Provides animation control methods

#### `ShuffleContainer`
- Wraps tool lists with animation context
- Uses Framer Motion for smooth transitions
- Includes optional particle effects

#### `AnimatedToolCard`
- Wraps individual tool cards
- Provides smooth position transitions for shuffling (not size changes)
- Preserves original CSS hover effects for professional feel
- Allows clean expand/collapse behavior without interference

#### `useToolOrderShuffle`
- Automatically detects tool order changes
- Triggers shuffle animation when needed
- Compares tool IDs to detect reordering

### 3. Animation States

- **`idle`**: Normal state, no animation
- **`delaying`**: 0.5s delay phase (shows subtle loading indicator)
- **`shuffling`**: Active shuffle animation with:
  - Smooth layout transitions as tools move to new positions
  - Enhanced shadow for visual depth during movement
  - Spring-based animations for natural feel
  - Optional particle effects

## 🎨 Customization

### Animation Options
```tsx
const shuffleAnimation = useShuffleAnimation({
  delayMs: 500,           // Delay before animation starts
  shuffleDurationMs: 1200, // Total animation duration
  disabled: false         // Disable for testing/accessibility
});
```

### Mobile Optimization
```tsx
<ShuffleContainer
  isMobile={isMobile}        // Shorter, simpler animations
  enableParticles={!isMobile} // Disable particles on mobile for performance
/>
```

### Professional Design
```tsx
// No click/tap bounce effects - keeps interaction professional
// Original CSS hover effects preserved (subtle shadow/border changes)
// Only layout transitions for tool reordering

### Accessibility
```tsx
// Animations automatically respect prefers-reduced-motion
// Additional disable option:
const shuffleAnimation = useShuffleAnimation({
  disabled: prefersReducedMotion
});
```

## 🔧 Integration Points

### Manual Criteria Changes
```tsx
// In CriteriaSection.tsx - Slider changes
onValueChange={(value) => {
  const updatedCriteria = criteria.map(c => 
    c.id === criterion.id ? { ...c, userRating: value[0] } : c
  );
  onCriteriaChange(updatedCriteria); // This triggers tool reordering
}}
```

### Guided Rankings
```tsx
// In GuidedRankingForm.tsx - Completed rankings
const handleUpdateRankings = (rankings) => {
  setCriteria(prevCriteria => 
    prevCriteria.map(criterion => ({
      ...criterion,
      userRating: rankings[criterion.id] || criterion.userRating
    }))
  ); // This triggers tool reordering
};
```

## 🎯 CSS Classes & Data Attributes

The system uses data attributes for styling and debugging:

```css
/* Animation states */
[data-is-shuffling="true"] { /* Shuffling state */ }
[data-is-delaying="true"]  { /* Delay state */ }

/* Individual tools */
[data-tool-id]             { /* Tool card styling */ }
[data-shuffle-id]          { /* Unique animation ID */ }
```

## 🐛 Debugging

### Development Mode
```tsx
// Clean animations with no visible debug indicators
// Animation state is tracked internally for proper functionality
// Use browser dev tools to inspect data attributes if needed
```

### Console Logging
```tsx
// Enable detailed logging
const shuffleAnimation = useShuffleAnimation({
  delayMs: 500,
  shuffleDurationMs: 1200,
  disabled: false
});

// Animation triggers are logged in useToolOrderShuffle
```

## 🎭 Animation Details

### Tool Card Animation Sequence
1. **Shuffle Phase**: Smooth position transitions as tools move to new order
2. **Settle Phase**: Spring-based layout animations for natural movement
3. **Expand/Collapse**: Instant show/hide of tool details for immediate response
4. **Professional**: No bounce effects, clean transitions, preserves original hover styling

### Staggered Animation
- Desktop: 80ms stagger between tool cards
- Mobile: 50ms stagger for faster feel
- 100ms delay before children start animating

### Performance Optimizations
- Uses `will-change: transform` for hardware acceleration
- GPU-accelerated transforms (scale, translate)
- Layout containment on mobile devices
- Reduced motion respect for accessibility

## 📱 Mobile Considerations

- Shorter animation duration (800ms vs 1200ms)
- Fewer particle effects (3 vs 6)
- Faster stagger timing (50ms vs 80ms)
- Layout containment for better performance

## 🔮 Future Enhancements

Potential future improvements:
- Sound effects for shuffle completion
- Custom easing curves per tool type
- Theme-based particle colors
- Advanced stagger patterns
- Tool-specific animation styles

---

Built with ❤️ using Framer Motion and React