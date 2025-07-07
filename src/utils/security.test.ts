import { describe, expect, it } from 'vitest'
import { containsScript, sanitizeHTML, sanitizeText, sanitizeURL } from '@/lib/security'

describe('Security Functions', () => {
  describe('sanitizeText', () => {
    it('should block JavaScript URLs', () => {
      const maliciousInputs = [
        'javascript:alert("XSS")',
        'javascript:document.location="http://evil.com"',
        'data:text/html,<script>alert("XSS")</script>',
        'vbscript:MsgBox "XSS"'
      ]

      maliciousInputs.forEach(input => {
        const result = sanitizeText(input)
        expect(result).toBe('[CONTENIDO BLOQUEADO]')
      })
    })

    it('should block dangerous scripts completely', () => {
      const dangerousInput = '<script>alert("XSS")</script>'
      const result = sanitizeText(dangerousInput)
      
      expect(result).toBe('[CONTENIDO BLOQUEADO]')
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert')
    })

    it('should preserve safe content', () => {
      const safeInput = 'Hello World'
      const result = sanitizeText(safeInput)
      expect(result).toBe(safeInput)
    })
  })

  describe('containsScript', () => {
    it('should detect script tags', () => {
      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        '<script src="http://evil.com/script.js"></script>',
        '<img src="x" onerror="alert(\'XSS\')">',
        '<div onmouseover="alert(\'XSS\')">Hover me</div>'
      ]

      maliciousInputs.forEach(input => {
        expect(containsScript(input)).toBe(true)
      })
    })

    it('should detect JavaScript URLs', () => {
      const maliciousInputs = [
        'javascript:alert("XSS")',
        'javascript:document.location="http://evil.com"',
        'data:text/html,<script>alert("XSS")</script>',
        'vbscript:MsgBox "XSS"'
      ]

      maliciousInputs.forEach(input => {
        expect(containsScript(input)).toBe(true)
      })
    })

    it('should not detect safe content', () => {
      const safeInputs = [
        'Hello World',
        '<p>This is safe HTML</p>',
        '<strong>Bold text</strong>',
        '<a href="https://example.com">Safe link</a>'
      ]

      safeInputs.forEach(input => {
        expect(containsScript(input)).toBe(false)
      })
    })
  })

  describe('sanitizeURL', () => {
    it('should block dangerous protocols', () => {
      const maliciousURLs = [
        'javascript:alert("XSS")',
        'data:text/html,<script>alert("XSS")</script>',
        'vbscript:MsgBox "XSS"',
        'file:///etc/passwd'
      ]

      maliciousURLs.forEach(url => {
        const result = sanitizeURL(url)
        expect(result).toBe('')
      })
    })

    it('should allow safe protocols', () => {
      const safeURLs = [
        'https://example.com',
        'http://example.com',
        'mailto:user@example.com',
        'tel:+1234567890'
      ]

      safeURLs.forEach(url => {
        const result = sanitizeURL(url)
        expect(result).toBe(url)
      })
    })
  })

  describe('sanitizeHTML', () => {
    it('should remove script tags', () => {
      const maliciousInput = '<p>Hello <script>alert("XSS")</script> World</p>'
      const result = sanitizeHTML(maliciousInput)
      
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('</script>')
      expect(result).toContain('Hello')
      expect(result).toContain('World')
    })

    it('should remove event handlers', () => {
      const maliciousInput = '<img src="x" onerror="alert(\'XSS\')" alt="test">'
      const result = sanitizeHTML(maliciousInput)
      
      expect(result).not.toContain('onerror')
      expect(result).toContain('alt="test"')
    })

    it('should preserve safe HTML', () => {
      const safeInput = '<p>Hello <strong>World</strong></p>'
      const result = sanitizeHTML(safeInput)
      
      expect(result).toContain('<p>')
      expect(result).toContain('<strong>')
      expect(result).toContain('</strong>')
      expect(result).toContain('</p>')
    })
  })
}) 