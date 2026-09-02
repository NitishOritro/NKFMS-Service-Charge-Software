import React from 'react';
import { Download, Eye, Menu } from 'lucide-react';
import { MonthSelector } from './MonthSelector';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import * as U from '../utils/format';
import * as Calc from '../utils/calc';

/**
 * showMonthPicker=false দিলে নেভবারে মাসের ঘরটি আসে না — রিপোর্ট পাতায়
 * ঘরটি টুলবারে থাকে, দুই জায়গায় দুটি ঘর থাকলে বিভ্রান্তি হতো।
 */
export function Navbar({ pageTitle, onOpenNav, showMonthPicker = true }) {
  const { data, selectedMonth, monthLock, exportBackupJson } = useData();
  const { isReadOnly } = useAuth();

  // লক থাকলে সেই মাসের হারই দেখানো হয়
  const shownMonth = monthLock ? monthLock.month : selectedMonth;
  const currentRate = Calc.rateForMonth(data.settings, shownMonth);

  return (
    <header className="navbar no-print">
      <div className="navbar-left">
        {/* শুধু ছোট পর্দায় দেখা যায় (CSS এ ডিফল্ট display:none) */}
        <button
          type="button"
          className="nav-toggle"
          onClick={onOpenNav}
          aria-label="মেনু খুলুন"
        >
          <Menu size={20} />
        </button>
        <h1 className="page-heading">{pageTitle}</h1>
        {isReadOnly && (
          <span className="pill warning">
            <Eye size={14} /> ভিউ মুড (View Only)
          </span>
        )}
      </div>

      <div className="navbar-right">
        {showMonthPicker && <MonthSelector />}

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
