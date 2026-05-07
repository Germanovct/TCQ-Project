# TCQ-Project — Estado del Proyecto & Roadmap

## Stack Tecnológico
- **Backend**: FastAPI (Python) → Render (Production)
- **Frontend Web**: React (Vite) → Netlify
- **Frontend Wallet (PWA)**: React (Vite) → Netlify (client.tcqlub.com)
- **Base de datos**: PostgreSQL (Render)
- **Imágenes**: Cloudinary (Almacenamiento permanente de Flyers)
- **Pagos**: 
  - **POS**: QR Dinámico Interoperativo.
  - **Web Tickets**: Mercado Pago Checkout Pro.

## Reglas Críticas
1. **Cloudinary**: Todos los flyers de eventos deben subirse mediante el endpoint `/events/upload-flyer` que ahora usa Cloudinary. NUNCA usar almacenamiento local en Render.
2. **CORS**: Mantener la política de CORS actualizada para permitir `tcqlub.com` y sus subdominios.
3. **Tickets**: La asociación entre tickets y usuarios se hace mediante el `email`.

## Avances Recientes (Hoy)
- [x] **Integración Cloudinary**: Configurada y funcional para evitar pérdida de imágenes en redeploys.
- [x] **Flujo de Tickets Gratuitos**: Implementado modal de éxito con QR visible y opción de impresión en la landing web.
- [x] **Sistema de Validación (Portería)**: Implementado modo "Portero" en el POS con escaneo QR y validación en tiempo real.
- [x] **Email Real (SMTP)**: Integración con SMTP para envío automático de tickets con diseño premium.
- [x] **Wallet - Mis Entradas**: Refinada la vista de tickets en la wallet del cliente con nombres de eventos y estados.
- [x] **Corrección de Error 500**: Resueltos problemas de nombres de atributos (`event.name`) y sintaxis en modelos.
- [x] **Resiliencia de DB**: Implementado sistema de migración automática de columnas para producción.

## Pendientes (Roadmap Próximos Pasos)

### 1. Admin Dashboard 📊
- Sección de estadísticas de venta de tickets por evento en tiempo real.
- Panel de control para gestionar stock de entradas desde el POS.

### 2. Mejoras de UI/UX
- Notificaciones Push para cuando se acredita un pago de ticket (Web Push).
- Modo Offline para el POS en caso de micro-cortes de internet.

## Variables de Entorno Requeridas (Render)
- `DATABASE_URL`: Postgres connection string.
- `CLOUDINARY_URL`: `cloudinary://<api_key>:<api_secret>@<cloud_name>`
- `MP_ACCESS_TOKEN`: Token de producción de Mercado Pago.
- `ADMIN_PIN`: Pin maestro para acciones de borrado.
- `SMTP_USER`: Usuario SMTP (ej. gmail).
- `SMTP_PASSWORD`: Contraseña de aplicación SMTP.

---
*Última actualización: 07 de Mayo, 2026 - Portería, SMTP y Wallet Refinement completados.*
