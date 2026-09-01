import React from 'react';
import { Calendar, Download, Eye } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import * as U from '../utils/format';
import * as Calc from '../utils/calc';

export function Navbar({ pageTitle }) {
  const { data, selectedMonth, setSelectedMonth, exportBackupJson } = useData();
  const { isReadOnly } = useAuth();

  // শুরুর মাস থেকে চলতি মাস পর্যন্ত (ডাটায় আরও পরের এন্ট্রি থাকলে সেটি পর্যন্ত)
  const monthsList = Calc.monthOptions(data);

  const currentRate = Calc.rateForMonth(data.settings, selectedMonth);

  return (
    <header className="navbar no-print">
      <div className="navbar-left">
        <h1 className="page-heading">{pageTitle}</h1>
        {isReadOnly && (
          <span className="pill warning">
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
            aria-label="হিসাব মাস নির্বাচন"
          >
            {monthsList.map((m) => (
              <option key={m} value={m}>
                {U.monthLabel(m)}
              </option>
            ))}
          </select>
        </div>

        <div className="navbar-chip">
          মাসিক চার্জ: <b>{U.bnTaka(currentRate)}</b>
        </div>

        {!isReadOnly && (
          <button
            onClick={exportBackupJson}
            className="btn btn-outline btn-sm"
            title="ডেটা ব্যাকআপ ডাউনলোড"
          >
            <Download size={15} />
            <span>ব্যাকআপ</span>
          </button>
        )}
      </div>
    </header>
  );
}
