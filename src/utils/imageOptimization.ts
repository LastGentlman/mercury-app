/**
 * Image Optimization Utilities
 * 
 * Best practices for avatar image optimization:
 * - Resize to optimal dimensions (400x400px max)
 * - Maintain aspect ratio
 * - Compress with quality settings
 * - Support multiple formats
 * - Handle errors gracefully
 */

export interface ImageOptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
  maintainAspectRatio?: boolean
}

export interface OptimizedImage {
  file: File
  originalSize: number
  optimizedSize: number
  compressionRatio: number
  dimensions: {
    width: number
    height: number
  }
}

/**
 * Default optimization settings for avatars
 */
export const DEFAULT_AVATAR_OPTIONS: ImageOptimizationOptions = {
  maxWidth: 400,
  maxHeight: 400,
  quality: 0.8, // 80% quality for good balance
  format: 'webp', // Best compression
  maintainAspectRatio: true
}

/**
 * Optimize image for avatar upload
 */
export function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = DEFAULT_AVATAR_OPTIONS
): Promise<OptimizedImage> {
  return new Promise((resolve, reject) => {
    // Validate input
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Invalid file type. Only images are supported.'))
      return
    }

    const {
      maxWidth = 400,
      maxHeight = 400,
      quality = 0.8,
      format = 'webp',
      maintainAspectRatio = true
    } = options

    // Create canvas and context
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    // Create image element
    const img = new Image()
    const originalSize = file.size

    img.onload = () => {
      try {
        // Calculate new dimensions
        const { width, height } = calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight,
          maintainAspectRatio
        )

        // Set canvas dimensions
        canvas.width = width
        canvas.height = height

        // Apply image smoothing for better quality
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // Draw image with new dimensions
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to blob with specified format and quality
        const mimeType = getMimeType(format)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create optimized image'))
              return
            }

            // Create new file with optimized data
            const optimizedFile = new File([blob], getOptimizedFileName(file.name, format), {
              type: mimeType,
              lastModified: Date.now()
            })

            const optimizedSize = blob.size
            const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100

            resolve({
              file: optimizedFile,
              originalSize,
              optimizedSize,
              compressionRatio,
              dimensions: { width, height }
            })
          },
          mimeType,
          quality
        )
      } catch (error) {
        reject(new Error(`Image optimization failed: ${error}`))
      }
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    // Load image from file
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
  maintainAspectRatio: boolean
): { width: number; height: number } {
  if (!maintainAspectRatio) {
    return { width: maxWidth, height: maxHeight }
  }

  const aspectRatio = originalWidth / originalHeight
  let width = originalWidth
  let height = originalHeight

  // Scale down if image is larger than max dimensions
  if (width > maxWidth) {
    width = maxWidth
    height = width / aspectRatio
  }

  if (height > maxHeight) {
    height = maxHeight
    width = height * aspectRatio
  }

  return {
    width: Math.round(width),
    height: Math.round(height)
  }
}

/**
 * Get MIME type for specified format
 */
function getMimeType(format: string): string {
  switch (format) {
    case 'jpeg':
    case 'jpg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'webp':
      return 'image/webp'
    default:
      return 'image/webp'
  }
}

/**
 * Generate optimized filename
 */
function getOptimizedFileName(originalName: string, format: string): string {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
  return `${nameWithoutExt}_optimized.${format}`
}

/**
 * Validate if image optimization is supported
 */
export function isImageOptimizationSupported(): boolean {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  if (!ctx) return false

  // Test WebP support
  canvas.width = 1
  canvas.height = 1
  
  try {
    canvas.toBlob(() => {}, 'image/webp', 0.8)
    return true
  } catch {
    return false
  }
}

/**
 * Get recommended format based on browser support
 */
export function getRecommendedFormat(): 'webp' | 'jpeg' | 'png' {
  if (isImageOptimizationSupported()) {
    return 'webp'
  }
  return 'jpeg'
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
} 