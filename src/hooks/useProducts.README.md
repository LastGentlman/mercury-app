# useProducts Hook Documentation

## Overview

The `useProducts` hook is a comprehensive React Query-based hook that provides full CRUD operations for products with offline-first functionality, real-time synchronization, and robust error handling.

## Features

- ✅ **Offline-First Architecture** - Works seamlessly offline using IndexedDB
- ✅ **Real-time Synchronization** - Syncs with server when online
- ✅ **Full CRUD Operations** - Create, Read, Update, Delete products
- ✅ **Business-Specific** - Multi-tenant support with business isolation
- ✅ **Active Product Filtering** - Automatically filters active products
- ✅ **Category Management** - Extracts and manages product categories
- ✅ **Optimistic Updates** - Immediate UI updates with background sync
- ✅ **Error Handling** - Comprehensive error handling with user feedback
- ✅ **Loading States** - Detailed loading states for all operations
- ✅ **TypeScript Support** - Full type safety and IntelliSense

## Installation

The hook is already integrated into the project. No additional installation required.

## Basic Usage

```typescript
import { useProducts } from '@/hooks/useProducts';

function MyComponent() {
  const { 
    products, 
    isLoading, 
    error,
    createProduct,
    updateProduct,
    deleteProduct 
  } = useProducts({ businessId: 'your-business-id' });

  if (isLoading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>
          {product.name} - ${product.price}
        </div>
      ))}
    </div>
  );
}
```

## API Reference

### Hook Parameters

```typescript
interface UseProductsOptions {
  businessId?: string;           // Required: Business ID
  enabled?: boolean;             // Optional: Enable/disable the hook
  refetchInterval?: number;      // Optional: Refetch interval in ms (default: 60000)
  staleTime?: number;           // Optional: Stale time in ms (default: 600000)
  gcTime?: number;              // Optional: Garbage collection time (default: 1800000)
}
```

### Return Value

```typescript
interface UseProductsReturn {
  // Data
  products: Array<Product>;      // Active products only
  allProducts: Array<Product>;   // All products (including inactive)
  categories: Array<string>;     // Unique product categories
  
  // Loading states
  isLoading: boolean;            // Initial loading
  isFetching: boolean;          // Background fetching
  isError: boolean;             // Query error state
  
  // Error handling
  error: Error | null;          // Current error
  
  // Actions
  refetch: () => Promise<any>;  // Manual refetch
  createProduct: (data: CreateProductRequest) => Promise<Product>;
  updateProduct: (id: string, data: UpdateProductRequest) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  
  // Mutation loading states
  isCreating: boolean;          // Create operation loading
  isUpdating: boolean;          // Update operation loading
  isDeleting: boolean;          // Delete operation loading
}
```

### Data Types

```typescript
interface Product {
  id?: number;
  businessId: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  isActive: boolean;
  syncStatus: 'pending' | 'synced' | 'error';
  createdAt: string;
  updatedAt: string;
  version?: number;
  lastModifiedAt?: string;
}

interface CreateProductRequest {
  name: string;
  price: number;
  category?: string;
  description?: string;
}

interface UpdateProductRequest {
  name?: string;
  price?: number;
  category?: string;
  description?: string;
  isActive?: boolean;
}
```

## Usage Examples

### 1. Display Products with Loading States

```typescript
function ProductList({ businessId }: { businessId: string }) {
  const { 
    products, 
    isLoading, 
    isFetching, 
    error,
    categories 
  } = useProducts({ businessId });

  if (isLoading) {
    return <div className="flex items-center gap-2">
      <Spinner className="w-4 h-4" />
      Loading products...
    </div>;
  }

  if (error) {
    return <div className="text-red-500">
      Error loading products: {error.message}
    </div>;
  }

  return (
    <div>
      {isFetching && (
        <div className="text-sm text-gray-500">Updating...</div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      <div className="mt-4">
        <h3>Categories:</h3>
        <div className="flex gap-2 flex-wrap">
          {categories.map(category => (
            <Badge key={category} variant="secondary">
              {category}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 2. Create Product Form

```typescript
function CreateProductForm({ businessId }: { businessId: string }) {
  const { createProduct, isCreating } = useProducts({ businessId });
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    category: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createProduct(formData);
      setFormData({ name: '', price: 0, category: '', description: '' });
    } catch (error) {
      // Error is handled by the hook with toast notification
      console.error('Failed to create product:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <label>Price *</label>
        <input
          type="number"
          step="0.01"
          value={formData.price}
          onChange={e => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
          required
        />
      </div>
      
      <div>
        <label>Category</label>
        <input
          type="text"
          value={formData.category}
          onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
        />
      </div>
      
      <div>
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>
      
      <button 
        type="submit" 
        disabled={isCreating}
        className="btn btn-primary"
      >
        {isCreating ? 'Creating...' : 'Create Product'}
      </button>
    </form>
  );
}
```

### 3. Product Management with CRUD Operations

```typescript
function ProductManagement({ businessId }: { businessId: string }) {
  const { 
    products, 
    createProduct, 
    updateProduct, 
    deleteProduct,
    isCreating,
    isUpdating,
    isDeleting
  } = useProducts({ businessId });

  const handleCreate = async () => {
    await createProduct({
      name: 'New Product',
      price: 19.99,
      category: 'Electronics'
    });
  };

  const handleUpdate = async (productId: string) => {
    await updateProduct(productId, {
      price: 24.99,
      isActive: false
    });
  };

  const handleDelete = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(productId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button 
          onClick={handleCreate}
          disabled={isCreating}
          className="btn btn-primary"
        >
          {isCreating ? 'Creating...' : 'Add Product'}
        </button>
      </div>

      <div className="grid gap-4">
        {products.map(product => (
          <div key={product.id} className="border p-4 rounded">
            <h3>{product.name}</h3>
            <p>${product.price}</p>
            <p>Category: {product.category}</p>
            <p>Status: {product.isActive ? 'Active' : 'Inactive'}</p>
            
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleUpdate(product.id!.toString())}
                disabled={isUpdating}
                className="btn btn-secondary"
              >
                {isUpdating ? 'Updating...' : 'Edit'}
              </button>
              
              <button
                onClick={() => handleDelete(product.id!.toString())}
                disabled={isDeleting}
                className="btn btn-danger"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. Product Search and Filtering

```typescript
function ProductSearch({ businessId }: { businessId: string }) {
  const { products, categories } = useProducts({ businessId });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
```

## Backend Integration

The hook integrates with the following backend endpoints:

- `GET /api/products/:businessId` - Fetch products
- `POST /api/products/:businessId` - Create product
- `PATCH /api/products/:businessId/:productId` - Update product
- `DELETE /api/products/:businessId/:productId` - Delete product

### Backend Features

- ✅ **Authentication Required** - All endpoints require valid authentication
- ✅ **Business Isolation** - Users can only access their business products
- ✅ **Role-Based Permissions** - Sellers cannot create/update/delete products
- ✅ **Input Validation** - Comprehensive Zod validation
- ✅ **Security Logging** - All access attempts are logged
- ✅ **Soft Deletes** - Products are soft deleted (is_active = false)
- ✅ **Conflict Prevention** - Prevents duplicate product names
- ✅ **Error Handling** - Detailed error responses

## Offline Functionality

The hook provides seamless offline functionality:

1. **Local Storage** - Products are stored in IndexedDB
2. **Offline Operations** - All CRUD operations work offline
3. **Sync Queue** - Changes are queued for synchronization
4. **Conflict Resolution** - Local changes take priority over server changes
5. **Background Sync** - Automatic synchronization when online

## Error Handling

The hook provides comprehensive error handling:

- **Network Errors** - Graceful fallback to local data
- **Validation Errors** - User-friendly error messages
- **Permission Errors** - Clear feedback on insufficient permissions
- **Toast Notifications** - Automatic success/error notifications
- **Retry Logic** - Automatic retry for transient errors

## Performance Optimizations

- **Caching** - React Query provides intelligent caching
- **Background Updates** - Non-blocking data synchronization
- **Optimistic Updates** - Immediate UI feedback
- **Debounced Refetching** - Prevents excessive API calls
- **Garbage Collection** - Automatic cleanup of old data

## Best Practices

1. **Always provide businessId** - Required for proper data isolation
2. **Handle loading states** - Provide feedback during operations
3. **Use error boundaries** - Catch and handle errors gracefully
4. **Implement proper validation** - Validate data before submission
5. **Consider offline scenarios** - Design for offline-first experience
6. **Monitor sync status** - Track synchronization state when needed
7. **Use TypeScript** - Leverage full type safety

## Migration from Previous Version

If you're upgrading from the previous version:

```typescript
// Old usage
const { products } = useProducts(businessId);

// New usage
const { products } = useProducts({ businessId });
```

The new version provides additional features while maintaining backward compatibility for basic usage.

## Troubleshooting

### Common Issues

1. **Products not loading**
   - Check if `businessId` is provided
   - Verify authentication is valid
   - Check network connectivity

2. **Offline operations not working**
   - Ensure IndexedDB is available
   - Check browser compatibility
   - Verify database initialization

3. **Sync issues**
   - Check network connectivity
   - Verify server endpoints are accessible
   - Review sync queue status

4. **Permission errors**
   - Verify user role has required permissions
   - Check business context is properly set
   - Review authentication token

### Debug Mode

Enable debug logging by setting the environment variable:

```bash
DEBUG=useProducts
```

This will provide detailed logging of all operations and synchronization attempts.
