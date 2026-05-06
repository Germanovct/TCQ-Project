# TCQ-POS — Constitución del Proyecto

## Stack
- **Backend**: FastAPI (Python) → deployado en Render
- **Frontend**: React (Vite) → deployado en Netlify
- **Base de datos**: SQLite
- **Pagos**: Mercado Pago — QR Dinámico Interoperativo (NO Checkout Pro)
- **Realtime**: WebSocket

## Reglas críticas — NUNCA violar

1. **WebSocket**: Siempre `wss://` en producción. NUNCA `ws://` en contexto HTTPS.
2. **Mercado Pago**: Siempre usar el endpoint QR Dinámico Interoperativo. NUNCA Checkout Pro.
3. **`mercadopago_service.py`**: No deployar a Render sin confirmar que las variables de entorno están configuradas en el portal de MP primero.
4. **Variables de entorno**: Nunca hardcodear keys ni tokens. Siempre desde `.env` local o variables de Render/Netlify.

## Estructura del Ecosistema (Monorepo)

```
TCQ-Project/
├── backend/            # API Centralizada (FastAPI) para todo el ecosistema
├── tcq-pos/            # POS para barmans (React PWA)
├── tcq-client/         # Billetera Cashless para usuarios (React PWA)
├── tcq-djs/            # Portal para consumo de DJs invitados (React PWA)
├── tcq-web/            # Página Web Principal del club (React/Vite)
└── CLAUDE.md           # Reglas maestras del proyecto
```

## Fase 2: Ticketera Propia (Roadmap)

El ecosistema TCQ eliminará dependencias de terceros (ej. Venti) integrando su propia venta de tickets. La arquitectura definida es la siguiente:

1. **Pasarela Web (Checkout Pro):** A diferencia del POS físico (donde está prohibido), la venta online de tickets en `tcq-web` **SÍ** utilizará *Mercado Pago Checkout Pro* para cobrar con tarjeta/dinero en cuenta de forma asincrónica.
2. **Generación de Ticket:** Al recibir el Webhook de pago aprobado, el backend genera un `Ticket` con un QR encriptado (UUID) y lo asocia al usuario.
3. **Billetera Centralizada:** El usuario visualiza su entrada y su QR directamente en `tcq-client` (Wallet), junto a su saldo para la barra.
4. **Validación en Puerta:** La app `tcq-pos` tendrá un modo "Recepción" para que el portero escanee los tickets, verifique la validez en el backend y prevenga duplicados.

## Entornos

| Variable | Dónde se configura |
|---|---|
| `MP_ACCESS_TOKEN` | Render (backend) |
| `MP_PUBLIC_KEY` | Netlify (frontend) |
| `WEBSOCKET_URL` | Netlify env vars — debe ser `wss://` |
| `DATABASE_URL` | Render |

## Contexto del negocio

- Sistema POS para bar/boliche (Antigravity)
- Flujo principal: mesa → pedido → QR de pago → confirmación por WebSocket → cierre
- El QR debe ser compatible con múltiples wallets (no solo MP)
- Aesthetic del frontend: nightclub premium, dark theme

## Cómo correr el proyecto localmente

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Al revisar código, siempre verificar

- [ ] WebSocket usa `wss://` en variables de entorno de producción
- [ ] Endpoints de MP apuntan al QR Dinámico (no Checkout Pro)
- [ ] No hay tokens hardcodeados
- [ ] Los errores de pago se loguean con suficiente contexto para debuggear
- [ ] Las rutas de FastAPI tienen manejo de errores explícito

## Al revisar errores de Mercado Pago

- Primero verificar que el `access_token` esté activo en el portal de MP
- Confirmar que el endpoint usado es `/instore/orders/qr/seller/collectors/{user_id}/pos/{external_pos_id}/qrs`
- Revisar que el `external_reference` sea único por transacción
- Verificar que el webhook de confirmación esté configurado y use `wss://`

## Tests

- Los tests del backend están en `backend/tests/`
- Correr con: `pytest backend/tests/ -v`
- Antes de cualquier cambio en rutas de pago, correr los tests primero
