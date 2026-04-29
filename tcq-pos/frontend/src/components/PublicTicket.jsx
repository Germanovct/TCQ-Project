import { useEffect, useState } from 'react';
import api from '../services/api';

export default function PublicTicket({ transactionId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getReceipt(transactionId)
      .then(setData)
      .catch(() => setError('No se encontró el ticket o ya no está disponible.'));
  }, [transactionId]);

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui' }}>
        <h2>❌ Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui' }}>
        <p>Cargando ticket...</p>
      </div>
    );
  }

  const { method, total, items, date, afip } = data;
  
  let methodLabel = method;
  if (method === 'CASH') methodLabel = 'Efectivo';
  if (method === 'MP_QR') methodLabel = 'Mercado Pago';
  if (method === 'TCQ_BALANCE') methodLabel = 'Saldo TCQ';

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', background: '#fff', minHeight: '100vh', padding: '1rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚡</div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>TICKET DIGITAL TCQ</h1>
        <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          {new Date(date).toLocaleString('es-AR')}
        </div>
      </div>

      <div style={{ borderTop: '2px dashed #ccc', borderBottom: '2px dashed #ccc', padding: '1rem 0', marginBottom: '1.5rem' }}>
        {items?.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>{item.qty}x {item.name}</span>
            <span style={{ fontWeight: 600 }}>${item.subtotal.toLocaleString('es-AR')}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>
        <span>TOTAL</span>
        <span>${total.toLocaleString('es-AR')}</span>
      </div>

      <div style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Método de pago: <strong>{methodLabel}</strong>
      </div>

      {afip && (
        <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', textAlign: 'center', fontSize: '0.85rem', color: '#333' }}>
          <div style={{ fontWeight: 800, marginBottom: '0.5rem' }}>COMPROBANTE AFIP VÁLIDO</div>
          <div>Factura B Nro: 0001-{String(afip.nro_comprobante).padStart(8, '0')}</div>
          <div>CAE: {afip.cae}</div>
          <div>Vto CAE: {afip.vto_cae}</div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '3rem', color: '#888', fontSize: '0.8rem' }}>
        ¡Gracias por tu compra!<br />
        TCQ Club
      </div>
    </div>
  );
}
