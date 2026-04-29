import asyncio
from app.services.afip_service import afip_service

async def main():
    if not afip_service.initialized:
        print("AFIP Service not initialized.")
        return
    print("Testing AFIP connection...")
    try:
        # Check dummy server status
        status = afip_service.afip.ElectronicBilling.getServerStatus()
        print(f"AFIP Server Status: {status}")
    except Exception as e:
        print(f"Error testing AFIP: {e}")

if __name__ == "__main__":
    asyncio.run(main())
