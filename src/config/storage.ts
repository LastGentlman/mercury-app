/**
 * Storage Configuration
 * Centralized configuration for Supabase storage buckets and settings
 */

export const STORAGE_CONFIG = {
  // Bucket names
  BUCKETS: {
    USER_AVATARS: 'user_avatars',
    // Add other buckets here as needed
    // PRODUCT_IMAGES: 'product_images',
    // BUSINESS_LOGOS: 'business_logos',
  },
  
  // File size limits (in bytes)
  FILE_LIMITS: {
    AVATAR: 5 * 1024 * 1024, // 5MB
    IMAGE: 10 * 1024 * 1024, // 10MB
    DOCUMENT: 25 * 1024 * 1024, // 25MB
  },
  
  // Allowed MIME types
  ALLOWED_TYPES: {
    AVATAR: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif'
    ],
    IMAGE: [
      'image/jpeg',
      'image/jpg',
      'image/png', 
      'image/webp',
      'image/gif',
      'image/svg+xml'
    ],
    DOCUMENT: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
  },
  
  // Storage paths
  PATHS: {
    AVATARS: 'avatars',
    PRODUCTS: 'products',
    BUSINESS: 'business',
    TEMP: 'temp'
  }
} as const

/**
 * Storage utility functions
 */
export const StorageUtils = {
  /**
   * Generate a unique file path for uploads
   */
  generateFilePath: (bucket: string, fileName: string, userId?: string): string => {
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const extension = fileName.split('.').pop()
    
    if (userId) {
      return `${bucket}/${userId}/${timestamp}-${randomId}.${extension}`
    }
    
    return `${bucket}/${timestamp}-${randomId}.${extension}`
  },
  
  /**
   * Validate file size
   */
  validateFileSize: (fileSize: number, maxSize: number): boolean => {
    return fileSize <= maxSize
  },
  
  /**
   * Validate file type
   */
  validateFileType: (mimeType: string, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(mimeType)
  },
  
  /**
   * Get bucket name by type
   */
  getBucketName: (type: keyof typeof STORAGE_CONFIG.BUCKETS): string => {
    return STORAGE_CONFIG.BUCKETS[type]
  },
  
  /**
   * Get file size limit by type
   */
  getFileSizeLimit: (type: keyof typeof STORAGE_CONFIG.FILE_LIMITS): number => {
    return STORAGE_CONFIG.FILE_LIMITS[type]
  },
  
  /**
   * Get allowed MIME types by category
   */
  getAllowedTypes: (category: keyof typeof STORAGE_CONFIG.ALLOWED_TYPES): readonly string[] => {
    return STORAGE_CONFIG.ALLOWED_TYPES[category]
  }
}

export default STORAGE_CONFIG 