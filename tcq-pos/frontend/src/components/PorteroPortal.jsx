import { useState, useEffect, useRef } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import api from '../services/api';

export default function PorteroPortal({ onClose, toast }) {
    const [lastResult, setLastResult] = useState(null); // { success: bool, message: string, ticket: object }
    const [scanning, setScanning] = useState(true);
    const [manualCode, setManualCode] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Audio feedback refs
    const audioSuccess = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));
    const audioError = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2873/2873-preview.mp3'));

    const handleScan = async (data) => {
        if (!data || !scanning || loading) return;
        const code = data[0]?.rawValue || data;
        if (!code) return;
        
        await validateCode(code);
    };

    const validateCode = async (code) => {
        setLoading(true);
        setScanning(false);
        try {
            const response = await api.validateTicket(code);
            setLastResult(response);
            
            if (response.success) {
                audioSuccess.current.play().catch(() => {});
                toast(response.message, 'success');
            } else {
                audioError.current.play().catch(() => {});
                toast(response.message, 'error');
            }
        } catch (error) {
            console.error("Validation error:", error);
            const msg = error.detail || "Error de conexión con el servidor";
            setLastResult({ success: false, message: msg });
            audioError.current.play().catch(() => {});
            toast(msg, 'error');
        } finally {
            setLoading(false);
            // Re-enable scanning after 3 seconds to avoid multiple scans
            setTimeout(() => {
                setScanning(true);
                setLastResult(null);
            }, 3500);
        }
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualCode.trim()) {
            validateCode(manualCode.trim());
            setManualCode('');
        }
    };

    return (
        <div className="modal-overlay portero-portal" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h2 className="modal-title">🚪 Portería — Validar Tickets</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                </div>

                <div className="portero-scanner-container" style={{ position: 'relative', flex: 1, minHeight: '300px', background: '#000', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
                    {scanning && !loading && (
                        <Scanner
                            onScan={handleScan}
                            onError={(error) => console.log(error?.message)}
                            constraints={{ facingMode: 'environment' }}
                        />
                    )}
                    
                    {loading && (
                        <div className="scanner-overlay loading">
                            <div className="spinner"></div>
                            <p>Validando...</p>
                        </div>
                    )}

                    {lastResult && (
                        <div className={`scanner-overlay result ${lastResult.success ? 'success' : 'error'}`}>
                            <div className="result-icon">{lastResult.success ? '✅' : '❌'}</div>
                            <div className="result-message">{lastResult.message}</div>
                            {lastResult.ticket && (
                                <div className="result-details">
                                    <p><strong>{lastResult.ticket.purchaser_first_name} {lastResult.ticket.purchaser_last_name}</strong></p>
                                    <p style={{fontSize: '0.8rem'}}>{lastResult.ticket.purchaser_email}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="portero-manual-input">
                    <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                            type="text" 
                            className="input" 
                            placeholder="Ingresar código manual..." 
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            disabled={loading}
                        />
                        <button type="submit" className="btn btn-primary" disabled={loading || !manualCode.trim()}>
                            Validar
                        </button>
                    </form>
                </div>

                <div className="portero-footer" style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Apunta la cámara al código QR del cliente.<br/>
                    El sistema marcará el ticket como usado automáticamente.
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .scanner-overlay {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                    text-align: center;
                    padding: 2rem;
                    animation: fadeIn 0.3s ease;
                }
                .scanner-overlay.loading { background: rgba(0,0,0,0.7); color: white; }
                .scanner-overlay.result.success { background: #06d6a0; color: #000; }
                .scanner-overlay.result.error { background: #ef476f; color: #fff; }
                
                .result-icon { font-size: 5rem; margin-bottom: 1rem; }
                .result-message { font-size: 1.5rem; font-weight: 800; line-height: 1.2; }
                .result-details { margin-top: 1rem; padding: 1rem; background: rgba(255,255,255,0.2); borderRadius: 8px; }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .spinner {
                    width: 50px;
                    height: 50px;
                    border: 5px solid rgba(255,255,255,0.1);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 1rem;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}} />
        </div>
    );
}
