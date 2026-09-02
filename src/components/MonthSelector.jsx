import React from 'react';
import { Calendar, Lock } from 'lucide-react';
import { useData } from '../context/DataContext';
import * as U from '../utils/format';
import * as Calc from '../utils/calc';

/**
 * হিসাবের মাস বেছে নেওয়ার ঘর।
 *
 * নেভবারে ও রিপোর্টের টুলবারে — দুই জায়গাতেই একই কম্পোনেন্ট বসে, তাই
 * আচরণ সবসময় এক থাকে। কোনো পাতায় মাস বদলানো অর্থহীন হলে (যেমন
 * ফ্ল্যাটভিত্তিক লেজার) কনটেক্সটের monthLock বসে যায় — তখন ঘরটি ধূসর ও
 * নিষ্ক্রিয় হয়ে তালার আইকন দেখায়।
 */
export function MonthSelector({ id = 'month-select' }) {
  const { data, selectedMonth, setSelectedMonth, monthLock } = useData();

  const monthsList = Calc.monthOptions(data);
  const shownMonth = monthLock ? monthLock.month : selectedMonth;
  // লক করা মাসটি তালিকায় না থাকলে যোগ করে নেওয়া হয়, নইলে ঘরটি খালি দেখাত
  const options = monthsList.includes(shownMonth) ? monthsList : [shownMonth, ...monthsList];

  return (
    <div
      className={`month-selector${monthLock ? ' is-locked' : ''}`}
      title={monthLock ? monthLock.reason : undefined}
    >
      {monthLock
        ? <Lock size={15} color="var(--primary-dark)" />
        : <Calendar size={16} color="var(--primary-dark)" />}
      <select
        id={id}
        value={shownMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        disabled={Boolean(monthLock)}
        aria-label="হিসাব মাস নির্বাচন"
      >
        {options.map((m) => (
          <option key={m} value={m}>
            {U.monthLabel(m)}
          </option>
        ))}
      </select>
    </div>
  );
}
