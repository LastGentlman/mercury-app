# Flujo de Recuperación de Cuentas

## Resumen

Este documento describe el flujo completo de recuperación de cuentas para usuarios que han tenido sus cuentas eliminadas. El sistema permite tanto la recuperación de cuentas existentes como la creación de nuevas cuentas.

## Características Principales

### 1. Período de Recuperación
- **Duración**: 30 días después de la eliminación de la cuenta
- **Ventana de oportunidad**: Los usuarios pueden solicitar recuperación durante este período
- **Expiración**: Después de 30 días, solo se permite crear una nueva cuenta

### 2. Opciones Disponibles
- **Recuperación de cuenta**: Restaurar la cuenta eliminada con todos sus datos
- **Nueva cuenta**: Crear una cuenta completamente nueva
- **Solicitud manual**: Contactar soporte para casos especiales

## Flujo de Usuario

### Escenario 1: Usuario intenta acceder a cuenta eliminada

1. **Detección**: El sistema detecta que la cuenta está eliminada
2. **Validación**: Verifica si está dentro del período de recuperación (30 días)
3. **Redirección**: 
   - Si puede recuperar → `/account-recovery?deleted=true`
   - Si no puede recuperar → `/auth?message=account-deleted&recovery=unavailable`

### Escenario 2: Usuario accede directamente a recuperación

1. **Verificación**: El usuario ingresa su email
2. **Estado**: El sistema verifica si hay solicitudes pendientes
3. **Opciones**: Muestra opciones disponibles según el estado

## Componentes del Sistema

### Frontend

#### 1. Página de Recuperación (`/account-recovery`)
- **Verificación inicial**: Comprobar estado de recuperación
- **Solicitud de recuperación**: Formulario para solicitar recuperación
- **Estado de solicitud**: Ver estado de solicitudes existentes
- **Nueva cuenta**: Opción para crear cuenta nueva

#### 2. Integración con Autenticación
- **Detección automática**: Detecta cuentas eliminadas durante login
- **Mensajes informativos**: Muestra mensajes apropiados
- **Enlace de recuperación**: Botón para acceder a recuperación

### Backend

#### 1. Endpoints de Recuperación
```
POST /api/auth/account-recovery
GET  /api/auth/account-recovery/status
POST /api/auth/account-recovery/new-account
GET  /api/auth/account-recovery/requests (Admin)
PUT  /api/auth/account-recovery/requests/:id (Admin)
```

#### 2. Base de Datos
- **Tabla**: `account_recovery_requests`
- **RLS**: Políticas de seguridad para acceso
- **Índices**: Optimización para consultas frecuentes

## Estados de Recuperación

### 1. Pendiente (`pending`)
- Solicitud enviada por el usuario
- Esperando revisión del administrador
- Usuario puede verificar estado

### 2. Aprobado (`approved`)
- Administrador aprobó la recuperación
- Cuenta será restaurada
- Usuario será notificado

### 3. Rechazado (`rejected`)
- Administrador rechazó la solicitud
- Usuario puede crear nueva cuenta
- Razón del rechazo disponible

## Validaciones y Seguridad

### 1. Validaciones de Entrada
- **Email**: Formato válido y existencia en logs de eliminación
- **Período**: Solo dentro de 30 días de eliminación
- **Duplicados**: No permitir múltiples solicitudes pendientes

### 2. Seguridad
- **RLS**: Row Level Security en todas las tablas
- **Autenticación**: Endpoints protegidos para administradores
- **Validación**: Verificación de permisos en cada operación

## Proceso Administrativo

### 1. Revisión de Solicitudes
- **Panel de administración**: Ver todas las solicitudes
- **Información del usuario**: Datos de la cuenta eliminada
- **Decisión**: Aprobar o rechazar con notas

### 2. Restauración de Cuenta
- **Proceso automático**: Al aprobar solicitud
- **Datos restaurados**: Perfil, negocios, productos, clientes
- **Notificación**: Email al usuario sobre restauración

## Casos de Uso

### 1. Recuperación Exitosa
```
Usuario elimina cuenta → Arrepentimiento → Solicita recuperación → 
Admin aprueba → Cuenta restaurada → Usuario notificado
```

### 2. Período Expirado
```
Usuario elimina cuenta → Espera 35 días → Intenta recuperar → 
Sistema rechaza → Opción de nueva cuenta
```

### 3. Nueva Cuenta
```
Usuario con cuenta eliminada → Crea nueva cuenta → 
Sistema marca como "recovery account" → Proceso normal
```

## Configuración

### 1. Variables de Entorno
```env
# Período de recuperación en días
ACCOUNT_RECOVERY_PERIOD_DAYS=30

# Email de notificaciones
ADMIN_EMAIL=soporte@pedidolist.com
```

### 2. Migración de Base de Datos
```bash
# Ejecutar migración
./scripts/run-account-recovery-migration.sh
```

## Monitoreo y Logs

### 1. Eventos Registrados
- Solicitudes de recuperación
- Decisiones administrativas
- Restauraciones exitosas
- Errores en el proceso

### 2. Métricas Importantes
- Tasa de recuperación exitosa
- Tiempo promedio de procesamiento
- Razones de rechazo más comunes

## Mejoras Futuras

### 1. Automatización
- **IA para revisión**: Automatizar decisiones simples
- **Restauración automática**: Para casos obvios
- **Notificaciones proactivas**: Recordatorios de recuperación

### 2. Experiencia de Usuario
- **Chat en vivo**: Soporte directo durante proceso
- **Estado en tiempo real**: Actualizaciones automáticas
- **Proceso guiado**: Tutorial paso a paso

### 3. Seguridad
- **Verificación adicional**: 2FA para recuperación
- **Auditoría completa**: Logs detallados de cambios
- **Backup automático**: Antes de restauraciones

## Troubleshooting

### Problemas Comunes

1. **Error 500 en validación OAuth**
   - **Causa**: Problemas con tabla `account_deletion_logs`
   - **Solución**: Verificar permisos RLS y estructura de tabla

2. **Solicitud no encontrada**
   - **Causa**: Email no coincide con logs de eliminación
   - **Solución**: Verificar que el email sea exacto

3. **Período expirado**
   - **Causa**: Más de 30 días desde eliminación
   - **Solución**: Ofrecer creación de nueva cuenta

### Logs de Debug
```javascript
// Habilitar logs detallados
console.log('🔍 Account recovery debug:', {
  email: userEmail,
  deletionDate: deletionDate,
  daysSinceDeletion: daysSinceDeletion,
  canRecover: canRecover
})
```

## Conclusión

El flujo de recuperación de cuentas proporciona una solución completa para usuarios que han eliminado sus cuentas, ofreciendo tanto la opción de recuperación como la creación de nuevas cuentas. El sistema está diseñado para ser seguro, eficiente y fácil de usar tanto para usuarios como para administradores.
