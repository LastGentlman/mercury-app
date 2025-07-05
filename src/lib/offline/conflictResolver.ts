import type { Order, Product } from '../../types'

export interface ConflictInfo {
  localVersion: Order | Product
  serverVersion: Order | Product
  entityType: 'order' | 'product'
  entityId: string
}

export interface ConflictResolution {
  winner: 'local' | 'server' | 'manual'
  resolvedData?: Order | Product
  conflictInfo?: ConflictInfo
}

export class ConflictResolver {
  /**
   * Resuelve conflictos usando "last write wins"
   * Compara los timestamps de última modificación
   */
  static resolveLastWriteWins(
    localData: Order | Product,
    serverData: Order | Product,
    entityType: 'order' | 'product'
  ): ConflictResolution {
    const localTimestamp = localData.lastModifiedAt || localData.updatedAt
    const serverTimestamp = serverData.lastModifiedAt || serverData.updatedAt

    // Convertir a timestamps numéricos para comparación
    const localTime = new Date(localTimestamp).getTime()
    const serverTime = new Date(serverTimestamp).getTime()

    console.log(`🔍 Resolviendo conflicto ${entityType}:`, {
      localTime: new Date(localTime).toISOString(),
      serverTime: new Date(serverTime).toISOString(),
      difference: Math.abs(localTime - serverTime) / 1000 + 's'
    })

    // Si la diferencia es menor a 1 segundo, considerar como conflicto real
    const timeDifference = Math.abs(localTime - serverTime)
    const isRealConflict = timeDifference > 1000 // 1 segundo

    if (!isRealConflict) {
      console.log('✅ No hay conflicto real, timestamps muy cercanos')
      return {
        winner: 'local',
        resolvedData: localData
      }
    }

    // Last write wins: el más reciente gana
    if (localTime > serverTime) {
      console.log('🏆 Local wins (más reciente)')
      return {
        winner: 'local',
        resolvedData: {
          ...localData,
          version: (localData.version || 0) + 1,
          lastModifiedAt: new Date().toISOString()
        }
      }
    } else {
      console.log('🏆 Server wins (más reciente)')
      return {
        winner: 'server',
        resolvedData: {
          ...serverData,
          version: (serverData.version || 0) + 1,
          lastModifiedAt: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Resuelve conflictos con estrategia personalizada
   * Permite lógica específica por tipo de entidad
   */
  static resolveWithStrategy(
    localData: Order | Product,
    serverData: Order | Product,
    entityType: 'order' | 'product',
    strategy: 'last-write-wins' | 'server-wins' | 'local-wins' | 'manual'
  ): ConflictResolution {
    switch (strategy) {
      case 'last-write-wins':
        return this.resolveLastWriteWins(localData, serverData, entityType)
      
      case 'server-wins':
        console.log('🏆 Server wins (estrategia forzada)')
        return {
          winner: 'server',
          resolvedData: {
            ...serverData,
            version: (serverData.version || 0) + 1,
            lastModifiedAt: new Date().toISOString()
          }
        }
      
      case 'local-wins':
        console.log('🏆 Local wins (estrategia forzada)')
        return {
          winner: 'local',
          resolvedData: {
            ...localData,
            version: (localData.version || 0) + 1,
            lastModifiedAt: new Date().toISOString()
          }
        }
      
      case 'manual':
        console.log('🤝 Conflicto requiere resolución manual')
        return {
          winner: 'manual',
          conflictInfo: {
            localVersion: localData,
            serverVersion: serverData,
            entityType,
            entityId: localData.id?.toString() || serverData.id?.toString() || ''
          }
        }
      
      default:
        return this.resolveLastWriteWins(localData, serverData, entityType)
    }
  }

  /**
   * Detecta si hay un conflicto real comparando versiones y timestamps
   */
  static detectConflict(
    localData: Order | Product,
    serverData: Order | Product
  ): boolean {
    // Si las versiones son diferentes, hay conflicto
    if (localData.version !== serverData.version) {
      return true
    }

    // Si los timestamps de modificación son muy diferentes, hay conflicto
    const localTime = new Date(localData.lastModifiedAt || localData.updatedAt).getTime()
    const serverTime = new Date(serverData.lastModifiedAt || serverData.updatedAt).getTime()
    const timeDifference = Math.abs(localTime - serverTime)

    return timeDifference > 1000 // Más de 1 segundo de diferencia
  }

  /**
   * Fusiona datos de manera inteligente (para casos complejos)
   */
  static mergeData(
    localData: Order | Product,
    serverData: Order | Product,
    entityType: 'order' | 'product'
  ): Order | Product {
    if (entityType === 'order') {
      return this.mergeOrderData(localData as Order, serverData as Order)
    } else {
      return this.mergeProductData(localData as Product, serverData as Product)
    }
  }

  private static mergeOrderData(localOrder: Order, serverOrder: Order): Order {
    // Estrategia de fusión para pedidos
    // Mantener el estado más reciente, pero preservar datos importantes
    const localTime = new Date(localOrder.lastModifiedAt || localOrder.updatedAt).getTime()
    const serverTime = new Date(serverOrder.lastModifiedAt || serverOrder.updatedAt).getTime()

    const baseOrder = localTime > serverTime ? localOrder : serverOrder
    const otherOrder = localTime > serverTime ? serverOrder : localOrder

    return {
      ...baseOrder,
      // Preservar notas de ambas versiones si son diferentes
      notes: this.mergeNotes(baseOrder.notes, otherOrder.notes),
      // Mantener el estado más reciente
      status: baseOrder.status,
      // Actualizar versiones
      version: Math.max(baseOrder.version || 0, serverOrder.version || 0) + 1,
      lastModifiedAt: new Date().toISOString(),
      syncStatus: 'synced' as const
    }
  }

  private static mergeProductData(localProduct: Product, serverProduct: Product): Product {
    // Estrategia de fusión para productos
    const localTime = new Date(localProduct.lastModifiedAt || localProduct.updatedAt).getTime()
    const serverTime = new Date(serverProduct.lastModifiedAt || serverProduct.updatedAt).getTime()

    const baseProduct = localTime > serverTime ? localProduct : serverProduct
    const otherProduct = localTime > serverTime ? serverProduct : localProduct

    return {
      ...baseProduct,
      // Preservar descripción más completa
      description: this.mergeDescriptions(baseProduct.description, otherProduct.description),
      // Mantener el precio más reciente
      price: baseProduct.price,
      // Actualizar versiones
      version: Math.max(baseProduct.version || 0, serverProduct.version || 0) + 1,
      lastModifiedAt: new Date().toISOString(),
      syncStatus: 'synced' as const
    }
  }

  private static mergeNotes(localNotes?: string, serverNotes?: string): string | undefined {
    if (!localNotes && !serverNotes) return undefined
    if (!localNotes) return serverNotes
    if (!serverNotes) return localNotes
    if (localNotes === serverNotes) return localNotes

    // Combinar notas diferentes
    return `${localNotes}\n---\n${serverNotes}`
  }

  private static mergeDescriptions(localDesc?: string, serverDesc?: string): string | undefined {
    if (!localDesc && !serverDesc) return undefined
    if (!localDesc) return serverDesc
    if (!serverDesc) return localDesc
    if (localDesc === serverDesc) return localDesc

    // Usar la descripción más larga (asumiendo que es más completa)
    return localDesc.length > serverDesc.length ? localDesc : serverDesc
  }
} 