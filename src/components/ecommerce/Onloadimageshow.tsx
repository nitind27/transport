"use client"
import React, { useEffect, useState } from 'react';

const Onloadimageshow = () => {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    // Check if image was already shown in this session
    const shown = sessionStorage.getItem('onloadImageShown');
    if (!shown) {
      setOpen(true);
      sessionStorage.setItem('onloadImageShown', 'true');
    }
  }, []);

  const handleClose = () => setOpen(false);

  return (
    <>
      {open && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '20px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              position: 'relative',
            }}
          >
            <button
              onClick={handleClose}
              style={{
                position: 'absolute',
                top: -15,
                right: 10,
                background: 'transparent',
                border: 'none',
                fontSize: 32,
                cursor: 'pointer',
              }}
              aria-label="Close"
            >
              &times;
            </button>
            <img
              src="/images/dashboard/dashboard.png"
              alt="ok"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                objectFit: 'contain',
                maxHeight: '70vh',
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Onloadimageshow;
