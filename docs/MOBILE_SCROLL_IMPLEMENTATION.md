# Mobile Scroll Implementation

## Overview

This implementation provides automatic mobile scroll functionality that positions input fields optimally when they receive focus on mobile devices. The solution includes both a global automatic hook and a manual hook for custom control.

## Features

✅ **Global Automatic**: Works across the entire app without any code changes  
✅ **Mobile Only**: Only activates on screens ≤ 768px  
✅ **Smart Timing**: Waits for virtual keyboard to appear before scrolling  
✅ **Smooth Animation**: Uses smooth scrolling behavior  
✅ **Optimal Positioning**: Positions fields 120px from the top for best visibility  
✅ **Performance Optimized**: Minimal impact on desktop performance  

## Implementation

### Global Hook (Automatic)

The global hook is already integrated into your app's root component (`src/routes/__root.tsx`):

```tsx
import { useGlobalMobileScroll } from '../hooks/useGlobalMobileScroll.ts'

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => {
    // ✅ Global mobile scroll functionality
    useGlobalMobileScroll()
    
    return (
      // Your app content...
    )
  },
})
```

**How it works:**
- Listens for `focusin` events on the entire document
- Only triggers for `INPUT`, `TEXTAREA`, and `SELECT` elements
- Only activates on mobile devices (≤ 768px)
- Automatically scrolls to position the field 120px from the top
- Uses a 300ms delay to allow the virtual keyboard to appear first

**Why only one hook?**
Since the global implementation automatically handles all input fields across the entire app, there's no need for manual control. The global solution is simpler, more maintainable, and covers all use cases.

## Files Created

1. **`src/hooks/useGlobalMobileScroll.ts`** - Global automatic scroll hook
2. **Updated `src/routes/__root.tsx`** - Integrated global hook

## How It Works

### Global Implementation

```typescript
export const useGlobalMobileScroll = () => {
  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      
      // Solo para inputs, textareas y selects
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      
      // Solo en móvil (768px o menos)
      if (window.innerWidth > 768) return
      
      // Delay para que aparezca el teclado virtual primero
      setTimeout(() => {
        const rect = target.getBoundingClientRect()
        const scrollTop = window.pageYOffset + rect.top - 120 // 120px desde el top
        
        window.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: 'smooth'
        })
      }, 300)
    }

    document.addEventListener('focusin', handleFocusIn)
    return () => document.removeEventListener('focusin', handleFocusIn)
  }, [])
}
```

### Why Only Global Implementation?

The global implementation is sufficient because:

1. **Automatic Coverage**: Works on all input fields across the entire app
2. **No Manual Work**: No need to add event handlers to individual components
3. **Consistent Behavior**: Same scroll behavior everywhere
4. **Simpler Maintenance**: Only one hook to maintain
5. **Better Performance**: Single event listener vs multiple ones

## Benefits

### For Users
- **Better UX**: No manual scrolling needed on mobile
- **Consistent Behavior**: Works the same across all forms
- **Keyboard Friendly**: Optimized for virtual keyboard interaction
- **Smooth Experience**: Animated scrolling feels natural

### For Developers
- **Zero Refactoring**: Works with existing code
- **Automatic**: No need to add event handlers to every input
- **Performance**: Minimal overhead, only active on mobile
- **Maintainable**: Centralized logic, easy to modify

## Testing

To test the implementation:

1. **Open your app on a mobile device or use browser dev tools mobile view**
2. **Navigate to any form** (e.g., `/auth` page)
3. **Tap on any input field**
4. **Verify that the page scrolls smoothly to position the field at the top**

### Test Cases

- ✅ Login form inputs
- ✅ Registration form inputs  
- ✅ Any other form inputs in your app
- ✅ Textarea elements
- ✅ Select dropdowns
- ✅ Desktop behavior (should not trigger)
- ✅ Resize behavior (should update mobile detection)

## Customization

### Adjust Scroll Offset

To change the 120px offset from the top:

```typescript
// In useGlobalMobileScroll.ts or useMobileScroll.ts
const scrollTop = window.pageYOffset + rect.top - 150 // Change 120 to desired offset
```

### Adjust Delay

To change the 300ms delay:

```typescript
// In useGlobalMobileScroll.ts or useMobileScroll.ts
setTimeout(() => {
  // scroll logic
}, 500) // Change 300 to desired delay
```

### Adjust Mobile Breakpoint

To change the 768px mobile breakpoint:

```typescript
// In useGlobalMobileScroll.ts
if (window.innerWidth > 1024) return // Change 768 to desired breakpoint

// In useMobileScroll.ts
isMobileRef.current = window.innerWidth <= 1024 // Change 768 to desired breakpoint
```

## Troubleshooting

### Common Issues

1. **Not working on mobile**
   - Check if the hook is properly imported in `__root.tsx`
   - Verify mobile breakpoint (768px)
   - Check browser console for errors

2. **Scrolling too much/too little**
   - Adjust the offset value (currently 120px)
   - Test on different mobile devices

3. **Performance issues**
   - The hook only runs on mobile devices
   - Event listener is properly cleaned up
   - Minimal DOM queries

### Debug Mode

Add console logs for debugging:

```typescript
const handleFocusIn = (event: FocusEvent) => {
  const target = event.target as HTMLElement
  
  console.log('Focus event:', target.tagName, window.innerWidth)
  
  if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
  if (window.innerWidth > 768) return
  
  console.log('Scrolling to field:', target.id || target.tagName)
  // ... rest of logic
}
```

## Future Enhancements

Potential improvements:

- **Custom scroll behavior per field type**
- **Different offsets for different screen sizes**
- **Integration with form validation**
- **Accessibility improvements**
- **Performance optimizations for very long forms**

---

**Status**: ✅ Implemented and Active  
**Last Updated**: Current  
**Compatibility**: All modern browsers, mobile-first approach 