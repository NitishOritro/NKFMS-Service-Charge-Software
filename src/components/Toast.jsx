import React from 'react';
import { useData } from '../context/DataContext';
import { CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useData();

  if (!toasts.length) return null;

  return (
    <div className="toast-container no-print">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type || 'success'}`}>
          {t.type === 'error' && <AlertCircle size={18} />}
          {t.type === 'warning' && <AlertTriangle size={18} />}
          {(t.type === 'success' || !t.type) && <CheckCircle2 size={18} />}
          <span>{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: 'auto', display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
