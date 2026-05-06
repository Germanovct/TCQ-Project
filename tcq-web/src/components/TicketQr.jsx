import React from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function TicketQr({ orderId }) {
  const qrData = orderId
    ? `https://tu-dominio.com/validar-ticket/${orderId}`
    : "https://tu-dominio.com/validar-ticket/demo";

  const handleDownload = () => {
    const canvas = document.getElementById("qr-gen");
    if (!canvas) return;
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    let downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `ticket-${orderId || "demo"}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="container text-center text-white py-5">
      <h2>🎟️ ¡Compra exitosa!</h2>
      <p>Mostrá este ticket en la entrada del club</p>

      <div className="bg-dark p-4 rounded d-inline-block my-4">
        <QRCodeCanvas
          id="qr-gen"
          value={qrData}
          size={200}
          fgColor="#ffffff"
          bgColor="#0a0a0a"
        />
      </div>

      <p>
        <strong>ID de compra:</strong> {orderId || "demo"}
      </p>

      <div className="mt-3 d-flex gap-3 justify-content-center">
        <button className="btn btn-gradient" onClick={handleDownload}>
          Descargar QR
        </button>
        <button
          className="btn btn-outline-light"
          onClick={() => alert("El ticket será enviado a tu email")}
        >
          Enviar por Email
        </button>
      </div>
    </div>
  );
}
