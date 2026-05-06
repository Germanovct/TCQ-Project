import React from "react";

export default function Checkout({ cartItems = [], onPurchase }) {
  return (
    <div className="container bg-dark text-white p-4 rounded shadow">
      <h2 className="mb-4">🛒 Checkout</h2>

      {cartItems.length > 0 ? (
        <>
          <ul className="list-group mb-4">
            {cartItems.map((item, index) => (
              <li
                key={index}
                className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white"
              >
                {item.name}
                <span>${item.price}</span>
              </li>
            ))}
          </ul>

          <button
            className="btn btn-gradient w-100"
            onClick={onPurchase}
          >
            Finalizar Compra
          </button>
        </>
      ) : (
        <p>No hay productos en el carrito.</p>
      )}
    </div>
  );
}
