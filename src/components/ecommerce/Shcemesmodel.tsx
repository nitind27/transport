import React, { useEffect } from "react";
import ReactDOM from "react-dom";

const modalRoot = typeof window !== "undefined" ? document.body : null;

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  maxHeight?: string;
}

const Shcemesmodel: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  width = "500px",
  maxHeight = "70vh"
}) => {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open || !modalRoot) return null;

  return ReactDOM.createPortal(
    <div
      className="modal-backdrop"
      tabIndex={-1}
      onClick={onClose}
      style={{
        position: "fixed",
        zIndex: 1300,
        left: 0,
        top: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <div
        className="modal-card"
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          width,
          maxWidth: "95vw",
          maxHeight,
          display: "flex",
          flexDirection: "column"
        }}
      >
        {title && (
          <div
            style={{
              padding: "18px 24px 0 24px",
              fontWeight: 700,
              fontSize: "1.2rem",
              borderBottom: "1px solid #eee"
            }}
          >
            {title}
          </div>
        )}
        <div
          style={{
            padding: 24,
            overflowY: "auto",
            flex: 1,
            minHeight: "80px"
          }}
        >
          {children}
        </div>
        {footer && (
          <div
            style={{
              borderTop: "1px solid #eee",
              padding: "12px 24px",
              background: "#fafbfc",
              textAlign: "right"
            }}
          >
            {footer}
          </div>
        )}
        <button
          aria-label="Close"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 8,
            right: 12,
            background: "none",
            border: "none",
            fontSize: 22,
            cursor: "pointer",
            color: "#888"
          }}
        >
          ×
        </button>
      </div>
    </div>,
    modalRoot
  );
};

export default Shcemesmodel;
