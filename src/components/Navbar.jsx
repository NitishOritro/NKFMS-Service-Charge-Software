import React from 'react';
import { Calendar, Download, Eye } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import * as U from '../utils/format';
import * as Calc from '../utils/calc';

export function Navbar({ pageTitle }) {
  const { data, selectedMonth, setSelectedMonth, exportBackupJson } = useData();
  const { isReadOnly } = useAuth();

  // Generate available months list from 2024-08 to 2026-08
  const start = data.settings.startMonth || '2024-08';
  const startIdx = U.monthIndex(start);
  const endIdx = U.monthIndex('2026-08');

  const monthsList = [];
  for (let i = startIdx; i <= endIdx; i += 1) {
    monthsList.push(U.indexToMonth(i));
  }

  const currentRate = Calc.rateForMonth(data.settings, selectedMonth);

  return (
    <header className="navbar no-print">
      <div className="navbar-left">
        <h1 className="page-heading">{pageTitle}</h1>
        {isReadOnly && (
          <span
            className="pill warning"
            style={{ fontSize: '13px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <Eye size={14} /> ভিউ মুড (View Only)
          </span>
        )}
      </div>

      <div className="navbar-right">
        <div className="month-selector">
          <Calendar size={16} color="var(--primary-dark)" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {monthsList.map((m) => (
              <option key={m} value={m}>
                {U.monthLabel(m)}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            background: '#f1f5f9',
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: 600,
            color: '#475569'
          }}
        >
          মাসিক চার্জ: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{U.bnTaka(currentRate)}</span>
        </div>

        <button
          onClick={exportBackupJson}
          className="btn btn-outline btn-sm"
          title="ডেটা ব্যাকআপ ডাউনলোড"
        >
          <Download size={15} />
          <span>ব্যাকআপ</span>
        </button>
      </div>
    </header>
  );
}
