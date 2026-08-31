import React from 'react';
import * as U from '../utils/format';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 15, 25, 50, 'all']
}) {
  if (totalItems <= 0) return null;

  const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalItems / pageSize);

  const startItem = pageSize === 'all' ? 1 : (currentPage - 1) * pageSize + 1;
  const endItem = pageSize === 'all' ? totalItems : Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      className="pagination-container no-print"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        background: '#fafafa',
        borderTop: '1px solid var(--border)',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '15px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b' }}>
        <span>
          মোট <b>{U.bnDigits(totalItems)}</b> টির মধ্যে <b>{U.bnDigits(startItem)}</b> - <b>{U.bnDigits(endItem)}</b> নম্বর দেখাচ্ছে
        </span>

        {onPageSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
            <span>প্রতি পৃষ্ঠায়:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                onPageSizeChange(val);
              }}
              style={{
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #cbd5e1',
                background: '#fff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'all' ? 'সকল' : U.bnDigits(opt)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {pageSize !== 'all' && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="btn btn-icon"
            style={{ padding: '4px', opacity: currentPage === 1 ? 0.4 : 1 }}
            title="প্রথম পৃষ্ঠা"
          >
            <ChevronsLeft size={16} />
          </button>

          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn btn-icon"
            style={{ padding: '4px', opacity: currentPage === 1 ? 0.4 : 1 }}
            title="পূর্ববর্তী পৃষ্ঠা"
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            if (
              p === 1 ||
              p === totalPages ||
              (p >= currentPage - 1 && p <= currentPage + 1)
            ) {
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`btn btn-sm ${currentPage === p ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    minWidth: '30px',
                    padding: '3px 8px',
                    fontWeight: currentPage === p ? 700 : 500
                  }}
                >
                  {U.bnDigits(p)}
                </button>
              );
            } else if (p === currentPage - 2 || p === currentPage + 2) {
              return <span key={p} style={{ padding: '0 3px', color: '#94a3b8' }}>...</span>;
            }
            return null;
          })}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn btn-icon"
            style={{ padding: '4px', opacity: currentPage === totalPages ? 0.4 : 1 }}
            title="পরবর্তী পৃষ্ঠা"
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="btn btn-icon"
            style={{ padding: '4px', opacity: currentPage === totalPages ? 0.4 : 1 }}
            title="শেষ পৃষ্ঠা"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
