import { type ComponentProps, type ReactNode } from 'react';

// Generic utility types for better type safety

/**
 * Makes specific keys required in an optional object type
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Makes specific keys optional in a required object type
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Creates a strict subset where only specified keys are allowed
 */
export type StrictPick<T, K extends keyof T> = Pick<T, K> & {
  [P in Exclude<keyof T, K>]?: never;
};

/**
 * Deep readonly utility type
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Non-empty array type
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Branded types for type safety
 */
export type Brand<T, B> = T & { __brand: B };

// Specific branded types for IDs and values
export type UUID = Brand<string, 'UUID'>;
export type Email = Brand<string, 'Email'>;
export type PhoneNumber = Brand<string, 'PhoneNumber'>;
export type Timestamp = Brand<string, 'Timestamp'>;
export type PositiveNumber = Brand<number, 'PositiveNumber'>;
export type SATCode = Brand<string, 'SATCode'>;

// Component prop utility types

/**
 * Base props that most components should have
 */
export interface BaseProps {
  className?: string;
  children?: ReactNode;
  'data-testid'?: string;
}

/**
 * Props for components that can be disabled
 */
export interface DisableableProps {
  disabled?: boolean;
}

/**
 * Props for components with loading states
 */
export interface LoadingProps {
  isLoading?: boolean;
  loadingText?: string;
}

/**
 * Props for components with error states
 */
export interface ErrorProps {
  error?: string | Error | null;
  onErrorClear?: () => void;
}

/**
 * Props for modal/dialog components
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel?: () => void;
  title?: string;
}

/**
 * Props for form components
 */
export interface FormProps<T = Record<string, unknown>> {
  onSubmit: (data: T) => void | Promise<void>;
  initialValues?: Partial<T>;
  validationSchema?: unknown; // Zod schema
  disabled?: boolean;
}

/**
 * Props for list components with pagination
 */
export interface PaginatedListProps<T> {
  items: T[];
  totalCount?: number;
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Props for searchable components
 */
export interface SearchableProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  placeholder?: string;
}

/**
 * Props for sortable components
 */
export interface SortableProps<T = string> {
  sortBy?: T;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (sortBy: T, sortOrder: 'asc' | 'desc') => void;
}

/**
 * Props for filterable components
 */
export interface FilterableProps<T = Record<string, unknown>> {
  filters?: T;
  onFiltersChange?: (filters: T) => void;
}

/**
 * Generic CRUD operation props
 */
export interface CRUDProps<T, TCreate = Omit<T, 'id'>, TUpdate = Partial<T>> {
  onCreate?: (data: TCreate) => void | Promise<void>;
  onUpdate?: (id: string, data: TUpdate) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  onRead?: (id: string) => void | Promise<void>;
}

/**
 * Props for async operation components
 */
export interface AsyncOperationProps<T> {
  operation: () => Promise<T>;
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
  onComplete?: () => void;
}

// Specific component prop types

/**
 * Enhanced button props with common patterns
 */
export type ButtonProps = ComponentProps<'button'> & 
  BaseProps & 
  DisableableProps & 
  LoadingProps & {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    icon?: ReactNode;
    iconPosition?: 'left' | 'right';
  };

/**
 * Enhanced input props with validation
 */
export type InputProps = ComponentProps<'input'> & 
  BaseProps & 
  DisableableProps & 
  ErrorProps & {
    label?: string;
    helperText?: string;
    required?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
  };

/**
 * Card component props
 */
export interface CardProps extends BaseProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  clickable?: boolean;
  onClick?: () => void;
}

/**
 * Data table props with generic type safety
 */
export interface DataTableProps<T extends Record<string, unknown>> 
  extends BaseProps, 
    PaginatedListProps<T>, 
    SearchableProps, 
    SortableProps<keyof T>,
    FilterableProps {
  columns: Array<{
    key: keyof T;
    title: string;
    render?: (value: T[keyof T], item: T) => ReactNode;
    sortable?: boolean;
    width?: string | number;
  }>;
  onRowClick?: (item: T) => void;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  actions?: Array<{
    label: string;
    onClick: (item: T) => void;
    icon?: ReactNode;
    disabled?: (item: T) => boolean;
  }>;
}

// API response utility types

/**
 * Standard API response structure
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

/**
 * Paginated API response
 */
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * API error response
 */
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// Hook utility types

/**
 * Standard async hook return type
 */
export interface AsyncHookReturn<T, TError = Error> {
  data: T | null;
  isLoading: boolean;
  error: TError | null;
  refetch: () => Promise<void>;
}

/**
 * Mutation hook return type
 */
export interface MutationHookReturn<TData, TVariables, TError = Error> {
  mutate: (variables: TVariables) => Promise<TData>;
  data: TData | null;
  isLoading: boolean;
  error: TError | null;
  reset: () => void;
}

/**
 * Form hook return type
 */
export interface FormHookReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
  handleChange: (field: keyof T, value: T[keyof T]) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (e: React.FormEvent) => void;
  resetForm: () => void;
}

// Sync and offline types

/**
 * Sync status for offline-capable entities
 */
export type SyncStatus = 'pending' | 'synced' | 'error' | 'conflict';

/**
 * Offline-capable entity interface
 */
export interface OfflineEntity {
  syncStatus: SyncStatus;
  lastModifiedAt: Timestamp;
  clientGeneratedId?: UUID;
  version?: number;
}

/**
 * Conflict resolution strategy
 */
export type ConflictResolution = 'client-wins' | 'server-wins' | 'manual';

/**
 * Sync conflict information
 */
export interface SyncConflict<T> {
  entityId: UUID;
  entityType: string;
  clientVersion: T;
  serverVersion: T;
  conflictedFields: Array<keyof T>;
  resolution?: ConflictResolution;
}

// Event utility types

/**
 * Custom event handler with additional data
 */
export type EventHandler<T = unknown> = (event: React.SyntheticEvent, data?: T) => void;

/**
 * Async event handler
 */
export type AsyncEventHandler<T = unknown> = (event: React.SyntheticEvent, data?: T) => Promise<void>;

// Validation utility types

/**
 * Field validation rule
 */
export interface ValidationRule<T> {
  message: string;
  validator: (value: T) => boolean;
}

/**
 * Form field configuration
 */
export interface FieldConfig<T> {
  required?: boolean;
  rules?: ValidationRule<T>[];
  transform?: (value: unknown) => T;
  defaultValue?: T;
}

// Generic constraints for better type safety

/**
 * Ensures T has an id field
 */
export type WithId<T = unknown> = T & { id: string | number };

/**
 * Ensures T has timestamp fields
 */
export type WithTimestamps<T = unknown> = T & {
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/**
 * Ensures T has sync capabilities
 */
export type WithSync<T = unknown> = T & OfflineEntity;

/**
 * Complete entity type with all common fields
 */
export type CompleteEntity<T = unknown> = WithId<WithTimestamps<WithSync<T>>>;

// Type guards for runtime type checking

export function isWithId(obj: unknown): obj is WithId {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}

export function isWithTimestamps(obj: unknown): obj is WithTimestamps {
  return (
    typeof obj === 'object' && 
    obj !== null && 
    'createdAt' in obj && 
    'updatedAt' in obj
  );
}

export function isWithSync(obj: unknown): obj is WithSync {
  return (
    typeof obj === 'object' && 
    obj !== null && 
    'syncStatus' in obj && 
    'lastModifiedAt' in obj
  );
}

export function isCompleteEntity(obj: unknown): obj is CompleteEntity {
  return isWithId(obj) && isWithTimestamps(obj) && isWithSync(obj);
} 