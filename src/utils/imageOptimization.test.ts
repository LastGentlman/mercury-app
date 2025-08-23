/**
 * Image Optimization Tests
 * 
 * Note: These tests are for development verification only
 * They require a browser environment to run properly
 */

import { optimizeImage, DEFAULT_AVATAR_OPTIONS, formatFileSize } from './imageOptimization.ts'

/**
 * Test image optimization functionality
 * Run this in browser console to verify optimization is working
 */
export async function testImageOptimization() {
  console.log('🧪 Testing image optimization...')
  
  try {
    // Create a test image (1x1 pixel PNG)
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      // Create a gradient for a more realistic test
      const gradient = ctx.createLinearGradient(0, 0, 800, 600)
      gradient.addColorStop(0, '#ff0000')
      gradient.addColorStop(0.5, '#00ff00')
      gradient.addColorStop(1, '#0000ff')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 800, 600)
    }
    
    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png', 1.0)
    })
    
    // Create test file
    const testFile = new File([blob], 'test-image.png', { type: 'image/png' })
    
    console.log('📁 Original file:', {
      name: testFile.name,
      size: formatFileSize(testFile.size),
      type: testFile.type
    })
    
    // Test optimization
    const optimizedImage = await optimizeImage(testFile, DEFAULT_AVATAR_OPTIONS)
    
    console.log('✅ Optimization results:', {
      originalSize: formatFileSize(optimizedImage.originalSize),
      optimizedSize: formatFileSize(optimizedImage.optimizedSize),
      compressionRatio: `${optimizedImage.compressionRatio.toFixed(1)}%`,
      dimensions: `${optimizedImage.dimensions.width}x${optimizedImage.dimensions.height}px`,
      format: optimizedImage.file.type
    })
    
    return optimizedImage
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    throw error
  }
}

/**
 * Test different optimization options
 */
export async function testOptimizationOptions() {
  console.log('🧪 Testing different optimization options...')
  
  const testCases = [
    { name: 'Default (WebP)', options: DEFAULT_AVATAR_OPTIONS },
    { name: 'JPEG High Quality', options: { ...DEFAULT_AVATAR_OPTIONS, format: 'jpeg' as const, quality: 0.9 } },
    { name: 'PNG (Lossless)', options: { ...DEFAULT_AVATAR_OPTIONS, format: 'png' as const } },
    { name: 'Small Size', options: { ...DEFAULT_AVATAR_OPTIONS, maxWidth: 200, maxHeight: 200, quality: 0.6 } }
  ]
  
  for (const testCase of testCases) {
    try {
      // Create test image
      const canvas = document.createElement('canvas')
      canvas.width = 1024
      canvas.height = 768
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        ctx.fillStyle = '#ff6b6b'
        ctx.fillRect(0, 0, 1024, 768)
      }
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png', 1.0)
      })
      
      const testFile = new File([blob], 'test-large.png', { type: 'image/png' })
      
      console.log(`\n📊 Testing: ${testCase.name}`)
      const optimized = await optimizeImage(testFile, testCase.options)
      
      console.log(`✅ ${testCase.name}:`, {
        original: formatFileSize(optimized.originalSize),
        optimized: formatFileSize(optimized.optimizedSize),
        compression: `${optimized.compressionRatio.toFixed(1)}%`,
        dimensions: `${optimized.dimensions.width}x${optimized.dimensions.height}px`
      })
      
    } catch (error) {
      console.error(`❌ ${testCase.name} failed:`, error)
    }
  }
}

// Add to global scope for easy testing in browser console
if (typeof globalThis !== 'undefined') {
  (globalThis as Record<string, unknown>).testImageOptimization = testImageOptimization
  ;(globalThis as Record<string, unknown>).testOptimizationOptions = testOptimizationOptions
} 