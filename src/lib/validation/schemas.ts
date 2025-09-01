import { z } from 'zod';
import { validatePhone } from './phone.ts';

// Base schemas for common patterns
const uuidSchema = z.string().uuid('Invalid UUID format');

const phoneSchema = z.string()
  .max(20, 'El teléfono debe tener máximo 20 caracteres')
  .optional()
  .refine((val) => !val || validatePhone(val), {
    message: 'El teléfono debe tener un formato válido para los países soportados'
  });
const emailSchema = z.string().email('Invalid email format').optional();
const timestampSchema = z.string().datetime('Invalid timestamp format');
const positiveNumberSchema = z.number().positive('Must be a positive number');
const nonNegativeNumberSchema = z.number().nonnegative('Must be non-negative');

// SAT Code validation for Mexican tax compliance
const satCodeSchema = z.string().length(8, 'SAT code must be exactly 8 characters').regex(/^[0-9]{8}$/, 'SAT code must contain only numbers');

// Status enums
const orderStatusSchema = z.enum(['pending', 'preparing', 'ready', 'delivered', 'cancelled']);
const syncStatusSchema = z.enum(['pending', 'synced', 'error']);
const userRoleSchema = z.enum(['owner', 'employee']);
const entityTypeSchema = z.enum(['order', 'product', 'business_category']);
const actionTypeSchema = z.enum(['create', 'update', 'delete']);

// OrderItem schema
export const OrderItemSchema = z.object({
  id: z.number().optional(),
  order_id: uuidSchema,
  product_id: uuidSchema.optional(),
  product_name: z.string().min(1, 'Product name is required').max(255, 'Product name too long'),
  quantity: positiveNumberSchema,
  unit_price: positiveNumberSchema,
  subtotal: positiveNumberSchema,
  notes: z.string().max(500, 'Notes too long').optional(),
});

// Order schema with comprehensive validation
export const OrderSchema = z.object({
  id: uuidSchema,
  business_id: uuidSchema,
  branch_id: uuidSchema,
  employee_id: uuidSchema,
  client_name: z.string().min(1, 'Client name is required').max(255, 'Client name too long'),
  client_phone: phoneSchema,
  total: positiveNumberSchema,
  delivery_date: z.string().date('Invalid delivery date'),
  delivery_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  status: orderStatusSchema,
  client_generated_id: uuidSchema.optional(),
  last_modified_at: timestampSchema,
  modified_by: uuidSchema.optional(),
  created_at: timestampSchema,
  items: z.array(OrderItemSchema).optional(),
  // Compatibility fields
  clientGeneratedId: uuidSchema.optional(),
  syncStatus: syncStatusSchema.optional(),
  version: z.number().int().nonnegative().optional(),
  updatedAt: timestampSchema.optional(),
});

// Product schema with enhanced validation
export const ProductSchema = z.object({
  id: z.number().optional(),
  businessId: uuidSchema,
  business_id: uuidSchema.optional(), // API compatibility
  name: z.string().min(1, 'Product name is required').max(255, 'Product name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  price: positiveNumberSchema,
  cost: nonNegativeNumberSchema.optional(),
  category: z.string().max(100, 'Category name too long').optional(), // Legacy field
  categoryId: uuidSchema.optional(), // New dynamic category reference
  satCode: satCodeSchema.optional(), // SAT code for Mexican tax compliance
  taxRate: z.number().min(0).max(1, 'Tax rate must be between 0 and 1').optional(), // Tax rate (0.16 = 16% IVA)
  stock: nonNegativeNumberSchema,
  image_url: z.string().url('Invalid image URL').optional(),
  isActive: z.boolean(),
  is_active: z.boolean().optional(), // API compatibility
  syncStatus: syncStatusSchema,
  createdAt: timestampSchema,
  created_at: timestampSchema.optional(), // API compatibility
  updatedAt: timestampSchema,
  lastModifiedAt: timestampSchema.optional(),
  clientGeneratedId: uuidSchema.optional(),
  version: z.number().int().nonnegative().optional(),
});

// CreateOrderData schema for form validation
export const CreateOrderDataSchema = z.object({
  client_name: z.string().min(1, 'Client name is required').max(255, 'Client name too long'),
  client_phone: phoneSchema,
  delivery_date: z.string().date('Invalid delivery date'),
  delivery_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  items: z.array(z.object({
    product_name: z.string().min(1, 'Product name is required').max(255, 'Product name too long'),
    quantity: positiveNumberSchema,
    unit_price: positiveNumberSchema,
    subtotal: positiveNumberSchema,
    notes: z.string().max(500, 'Notes too long').optional(),
  })).min(1, 'At least one item is required'),
});

// OrderFormData schema for frontend forms
export const OrderFormDataSchema = z.object({
  clientName: z.string().min(1, 'Client name is required').max(255, 'Client name too long'),
  clientPhone: phoneSchema,
  deliveryDate: z.string().date('Invalid delivery date'),
  deliveryTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  items: z.array(z.object({
    productName: z.string().min(1, 'Product name is required').max(255, 'Product name too long'),
    quantity: positiveNumberSchema,
    unitPrice: positiveNumberSchema,
    notes: z.string().max(500, 'Notes too long').optional(),
  })).min(1, 'At least one item is required'),
});

// User schema
export const UserSchema = z.object({
  id: uuidSchema,
  email: emailSchema.refine(val => val !== undefined, { message: 'Email is required' }),
  name: z.string().max(255, 'Name too long').optional(),
  businessId: uuidSchema.optional(),
  role: userRoleSchema.optional(),
  avatar_url: z.string().url('Invalid avatar URL').optional(),
  provider: z.string().max(50, 'Provider name too long').optional(),
});

// Business schema
export const BusinessSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1, 'Business name is required').max(255, 'Business name too long'),
  ownerId: uuidSchema,
  owner_id: uuidSchema.optional(), // API compatibility
  businessType: z.string().max(100, 'Business type too long').optional(),
  business_type: z.string().max(100, 'Business type too long').optional(), // API compatibility
  taxRegimeCode: z.string().max(10, 'Tax regime code too long').optional(),
  tax_regime_code: z.string().max(10, 'Tax regime code too long').optional(), // API compatibility
  address: z.string().max(500, 'Address too long').optional(),
  phone: phoneSchema,
  email: emailSchema,
  createdAt: timestampSchema,
  created_at: timestampSchema.optional(), // API compatibility
  updatedAt: timestampSchema,
  updated_at: timestampSchema.optional(), // API compatibility
});

// BusinessCategory schema
export const BusinessCategorySchema = z.object({
  id: z.number().optional(),
  businessId: uuidSchema,
  business_id: uuidSchema.optional(), // API compatibility
  categoryId: uuidSchema,
  category_id: uuidSchema.optional(), // API compatibility
  categoryName: z.string().min(1, 'Category name is required').max(255, 'Category name too long'),
  category_name: z.string().min(1, 'Category name is required').max(255, 'Category name too long').optional(), // API compatibility
  icon: z.string().min(1, 'Icon is required').max(100, 'Icon name too long'),
  satCode: satCodeSchema,
  sat_code: satCodeSchema.optional(), // API compatibility
  isActive: z.boolean(),
  is_active: z.boolean().optional(), // API compatibility
  clientGeneratedId: uuidSchema.optional(),
  client_generated_id: uuidSchema.optional(), // API compatibility
  syncStatus: syncStatusSchema,
  sync_status: z.string().optional(), // API compatibility
  lastModifiedAt: timestampSchema,
  last_modified_at: timestampSchema.optional(), // API compatibility
  createdAt: timestampSchema,
  created_at: timestampSchema.optional(), // API compatibility
});

// Client schema
export const ClientSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1, 'Client name is required').max(255, 'Client name too long'),
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().max(500, 'Address too long').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  total_orders: nonNegativeNumberSchema,
  total_spent: nonNegativeNumberSchema,
  last_order_date: timestampSchema.optional(),
  business_id: uuidSchema,
  is_active: z.boolean(),
  created_at: timestampSchema,
  updated_at: timestampSchema,
});

// SyncQueueItem schema
export const SyncQueueItemSchema = z.object({
  id: z.number().optional(),
  entityType: entityTypeSchema,
  entityId: uuidSchema,
  action: actionTypeSchema,
  timestamp: timestampSchema,
  retries: z.number().int().nonnegative().optional(),
  lastError: z.string().max(1000, 'Error message too long').optional(),
});

// Runtime validation helpers
export function validateOrder(data: unknown) {
  return OrderSchema.parse(data);
}

export function validateProduct(data: unknown) {
  return ProductSchema.parse(data);
}

export function validateCreateOrderData(data: unknown) {
  return CreateOrderDataSchema.parse(data);
}

export function validateOrderFormData(data: unknown) {
  return OrderFormDataSchema.parse(data);
}

export function validateUser(data: unknown) {
  return UserSchema.parse(data);
}

export function validateBusiness(data: unknown) {
  return BusinessSchema.parse(data);
}

export function validateBusinessCategory(data: unknown) {
  return BusinessCategorySchema.parse(data);
}

export function validateClient(data: unknown) {
  return ClientSchema.parse(data);
}

export function validateSyncQueueItem(data: unknown) {
  return SyncQueueItemSchema.parse(data);
}

// Safe validation helpers that return success/error objects
export function safeValidateOrder(data: unknown) {
  return OrderSchema.safeParse(data);
}

export function safeValidateProduct(data: unknown) {
  return ProductSchema.safeParse(data);
}

export function safeValidateCreateOrderData(data: unknown) {
  return CreateOrderDataSchema.safeParse(data);
}

export function safeValidateOrderFormData(data: unknown) {
  return OrderFormDataSchema.safeParse(data);
}

export function safeValidateUser(data: unknown) {
  return UserSchema.safeParse(data);
}

export function safeValidateBusiness(data: unknown) {
  return BusinessSchema.safeParse(data);
}

export function safeValidateBusinessCategory(data: unknown) {
  return BusinessCategorySchema.safeParse(data);
}

export function safeValidateClient(data: unknown) {
  return ClientSchema.safeParse(data);
}

export function safeValidateSyncQueueItem(data: unknown) {
  return SyncQueueItemSchema.safeParse(data);
}

// Type inference from schemas
export type OrderType = z.infer<typeof OrderSchema>;
export type ProductType = z.infer<typeof ProductSchema>;
export type CreateOrderDataType = z.infer<typeof CreateOrderDataSchema>;
export type OrderFormDataType = z.infer<typeof OrderFormDataSchema>;
export type UserType = z.infer<typeof UserSchema>;
export type BusinessType = z.infer<typeof BusinessSchema>;
export type BusinessCategoryType = z.infer<typeof BusinessCategorySchema>;
export type ClientType = z.infer<typeof ClientSchema>;
export type SyncQueueItemType = z.infer<typeof SyncQueueItemSchema>; 