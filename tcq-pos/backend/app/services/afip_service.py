from afip import Afip
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

class AfipService:
    def __init__(self):
        self.afip = None
        self.initialized = False
        
        try:
            if settings.AFIP_CUIT > 0 and settings.AFIP_ACCESS_TOKEN:
                self.afip = Afip({
                    "CUIT": settings.AFIP_CUIT,
                    "cert": settings.AFIP_CERT_PATH,
                    "key": settings.AFIP_KEY_PATH,
                    "production": settings.AFIP_PRODUCTION,
                    "access_token": settings.AFIP_ACCESS_TOKEN
                })
                self.initialized = True
                logger.info(f"✅ AFIP Service initialized for CUIT {settings.AFIP_CUIT} (Prod: {settings.AFIP_PRODUCTION})")
            else:
                logger.warning("⚠️ AFIP_CUIT is not set. AFIP service disabled.")
        except Exception as e:
            logger.error(f"❌ Failed to initialize AFIP service: {e}")

    async def generate_ticket(self, amount: float, method: str, ref_id: str):
        if not self.initialized:
            return {"error": "Servicio AFIP no configurado", "cae": None, "vto_cae": None}

        try:
            # Factura B para consumidor final (CbteTipo = 6, DocTipo = 99 para Consumidor Final)
            # Para simplificar, asumimos Factura B a consumidor final sin documentar para montos menores.
            # Según ARCA, Factura B = 6. 
            
            # Obtener el último número de comprobante
            last_voucher = self.afip.ElectronicBilling.getLastVoucher(1, 6) # Punto de venta 1, Tipo 6 (Factura B)
            next_voucher = last_voucher + 1

            # Configurar datos de la factura
            data = {
                'CantReg': 1,  # Cantidad de comprobantes a registrar
                'PtoVta': 1,  # Punto de venta
                'CbteTipo': 6,  # 6 = Factura B
                'Concepto': 1,  # 1 = Productos, 2 = Servicios
                'DocTipo': 99, # 99 = Consumidor Final
                'DocNro': 0,
                'CbteDesde': next_voucher,
                'CbteHasta': next_voucher,
                'CbteFch': int(self.afip.ElectronicBilling.formatDate()), 
                'ImpTotal': amount, # Importe total
                'ImpTotConc': 0, # Importe neto no gravado
                'ImpNeto': round(amount / 1.21, 2), # Importe neto gravado (asumiendo 21% IVA)
                'ImpOpEx': 0, # Importe exento al IVA
                'ImpIVA': amount - round(amount / 1.21, 2), # Importe IVA
                'ImpTrib': 0, # Importe otros tributos
                'MonId': 'PES', # Moneda
                'MonCotiz': 1, # Cotización moneda
                'Iva': [
                    {
                        'Id': 5, # 5 = 21%
                        'BaseImp': round(amount / 1.21, 2),
                        'Importe': amount - round(amount / 1.21, 2)
                    }
                ],
            }

            # Crear factura
            res = self.afip.ElectronicBilling.createVoucher(data)

            return {
                "success": True,
                "cae": res['CAE'],
                "vto_cae": res['CAEFchVto'],
                "nro_comprobante": next_voucher,
                "pto_vta": 1
            }

        except Exception as e:
            logger.error(f"❌ AFIP Billing Error: {e}")
            return {"error": str(e), "success": False}

afip_service = AfipService()
