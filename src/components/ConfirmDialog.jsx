import React, { useEffect, useRef } from "react";

const ConfirmDialog = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}) => {
  const dialogRef = useRef(null);
  const lastActiveElement = useRef(null);

  useEffect(() => {
    if (open) {
      lastActiveElement.current = document.activeElement;
      // Focus the first button in the dialog
      const firstButton = dialogRef.current?.querySelector("button");
      firstButton?.focus();
      // Trap focus
      const handleKeyDown = (e) => {
        if (e.key === "Tab") {
          const focusable = dialogRef.current.querySelectorAll("button");
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        } else if (e.key === "Escape") {
          onCancel();
        }
      };
      dialogRef.current?.addEventListener("keydown", handleKeyDown);
      return () => {
        dialogRef.current?.removeEventListener("keydown", handleKeyDown);
        lastActiveElement.current?.focus();
      };
    }
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-desc"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded shadow-lg p-6 w-full max-w-sm outline-none"
      >
        <h2 id="dialog-title" className="text-lg font-bold mb-2">
          {title}
        </h2>
        <p id="dialog-desc" className="mb-4 text-gray-700">
          {message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 focus:outline-none focus:ring"
            aria-label={cancelLabel}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring"
            aria-label={confirmLabel}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
