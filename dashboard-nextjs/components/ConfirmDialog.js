'use client';

export default function ConfirmDialog({ open, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 px-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-ink mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-blueprint-100 text-ink/70 hover:bg-blueprint-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm rounded-lg bg-blueprint-500 text-white hover:bg-blueprint-700 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
