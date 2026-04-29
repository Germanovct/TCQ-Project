import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';

export default function TicketModal({ data, onClose }) {
  const ticketRef = useRef(null);
  const [loadingAFIP, setLoadingAFIP] = useState(false);
  const [fiscalData, setFiscalData] = useState(data.fiscal || null);

  if (!data) return null;

  const { items, total, method, table_ref, transaction_id, date } = data;
  const methodLabel = method === 'CASH' ? 'Efectivo' : method === 'TCQ_BALANCE' ? 'Saldo TCQ' : 'Mercado Pago';
  const now = date || new Date().toLocaleString('es-AR');
  const handleGenerateAFIP = async () => {
    if (!transaction_id) return;
    setLoadingAFIP(true);
    try {
      const result = await api.generateFiscalTicket(transaction_id);
      setFiscalData(result);
    } catch (e) {
      alert(e.detail || 'Error conectando con AFIP');
    } finally {
      setLoadingAFIP(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal ticket-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div ref={ticketRef} className="ticket-content">
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-primary-light)' }}>TCQ Club</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{now}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mesa: {table_ref === 'barra' ? 'BARRA' : `#${table_ref}`}</div>
          </div>
          <div style={{ borderTop: '1px dashed var(--border-default)', margin: '0.5rem 0' }} />
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.9rem' }}>
              <span>{item.quantity}x {item.product_name}</span>
              <span style={{ fontWeight: 600 }}>${item.subtotal.toLocaleString('es-AR')}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px dashed var(--border-default)', margin: '0.5rem 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.2rem' }}>
            <span>TOTAL</span>
            <span style={{ color: 'var(--brand-accent)' }}>${total.toLocaleString('es-AR')}</span>
          </div>
          <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Pago: {methodLabel} · ID: {transaction_id?.slice(0, 8)}
          </div>
          {fiscalData && (
            <div style={{ marginTop: '0.5rem', padding: '0.5rem', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
              <div style={{ fontWeight: 800 }}>COMPROBANTE AFIP VÁLIDO</div>
              <div>Factura B Nro: 0001-{String(fiscalData.nro_comprobante).padStart(8, '0')}</div>
              <div>CAE: {fiscalData.cae}</div>
              <div>Vto CAE: {fiscalData.vto_cae}</div>
            </div>
          )}

          {transaction_id && !fiscalData?.qr_url && (
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Escanea para ver tu ticket digital
              </div>
              <div style={{ background: '#fff', padding: '0.5rem', display: 'inline-block', borderRadius: '8px' }}>
                <QRCodeSVG value={`https://tcq-pos.netlify.app/ticket/${transaction_id}`} size={140} />
              </div>
            </div>
          )}

          {fiscalData?.qr_url && (
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                QR Fiscal AFIP
              </div>
              <div style={{ background: '#fff', padding: '0.5rem', display: 'inline-block', borderRadius: '8px' }}>
                <QRCodeSVG value={fiscalData.qr_url} size={140} />
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Escanea para verificar el comprobante
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cerrar</button>
        </div>
        {!fiscalData && (
          <button 
            className="btn btn-outline" 
            style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
            onClick={handleGenerateAFIP}
            disabled={loadingAFIP}
          >
            {loadingAFIP ? '⏳ Contactando AFIP...' : '🏛️ Generar Ticket Fiscal (ARCA)'}
          </button>
        )}
      </div>
    </div>
  );
}
