// ============================================================================
// UNIFIED UI COMPONENTS EXPORT
// ============================================================================
// This file serves as the single source of truth for all UI components
// All components should be imported from this file, not individual files

// Core Components (Radix-based with design system integration)
export { Button, buttonVariants } from './button.tsx'
export { Input } from './input.tsx'
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card.tsx'
export { Badge } from './badge.tsx'
export { Alert } from './alert.tsx'
export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './dialog.tsx'
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs.tsx'
export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './select.tsx'
export { Label } from './label.tsx'
export { Textarea } from './textarea.tsx'
export { Switch } from './switch.tsx'
export { Slider } from './slider.tsx'
export { Separator } from './separator.tsx'
export { Skeleton } from './skeleton.tsx'

// Enhanced Components (Custom implementations)
export { EnhancedButton } from './enhanced-button.tsx'
export { StatusBadge } from './status-badge.tsx'
export { StatsCard } from './stats-card.tsx'
export { EmptyState } from './empty-state.tsx'
export { SafeContent } from './safe-content.tsx'

// Design System Utilities
export { designSystem } from '../../lib/design-system.ts'
export { cn } from '../../lib/ui-utils.ts'

// ============================================================================
// DEPRECATED - DO NOT USE THESE IMPORTS
// ============================================================================
// ❌ Don't import from these files directly:
// - design-system-components.tsx (deprecated)
// - enhanced-design-system.tsx (deprecated)
// 
// ✅ Use this index file instead:
// import { Button, EnhancedButton, StatusBadge } from '@/components/ui'
// ============================================================================ 