import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  FileSpreadsheet,
  Layers,
  AlertTriangle,
  Building2,
  Users,
  Settings,
  Printer,
  ClipboardList,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { LOGO_BASE64 } from '../assets/logoData';

// মেনু তিনটি যৌক্তিক ভাগে সাজানো — এতে নেভিগেশন দ্রুত ও পেশাদার দেখায়।
const NAV_GROUPS = [
  {
    label: 'আদায় ও এন্ট্রি',
    items: [
      { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
      { id: 'collection', label: 'মাসিক আদায় এন্ট্রি', icon: CalendarCheck },
      // adminOnly — ভিউ মোডে এই পেজটি মেনুতে দেখা যাবে না
      { id: 'flat-entry', label: 'একক ফ্ল্যাট এন্ট্রি (২৫ মাস)', icon: Layers, highlight: true, adminOnly: true },
      { id: 'charge-form', label: 'সার্ভিস চার্জ এন্ট্রি ফর্ম', icon: ClipboardList }
    ]
  },
  {
    label: 'হিসাব ও প্রতিবেদন',
    items: [
      { id: 'summary', label: 'মাসিক হিসাব সারসংক্ষেপ', icon: FileSpreadsheet },
      { id: 'defaulters', label: 'বকেয়া তালিকা', icon: AlertTriangle },
      { id: 'reports', label: 'প্রিন্ট ও PDF রিপোর্ট', icon: Printer }
    ]
  },
  {
    label: 'ব্যবস্থাপনা',
    items: [
      { id: 'flats', label: 'ফ্ল্যাট ব্যবস্থাপনা', icon: Building2 },
      { id: 'collectors', label: 'আদায়কারী ও স্বাক্ষরকারী', icon: Users },
      { id: 'settings', label: 'সেটিংস ও ব্যাকআপ', icon: Settings }
    ]
  }
];

export function Sidebar({ currentTab, setCurrentTab, open = false, onClose }) {
  const { user, logout, isReadOnly } = useAuth();
  const { data } = useData();

  return (
    <>
      {/* মোবাইলে মেনু খুললে পেছনের অংশে ট্যাপ করলেই বন্ধ হবে */}
      <div
        className={`sidebar-backdrop no-print ${open ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
    <aside className={`sidebar no-print ${open ? 'open' : ''}`}>
      <div className="sidebar-header">
        <img src={LOGO_BASE64} alt="NKFMS Logo" className="sidebar-logo" />
        <div style={{ minWidth: 0 }}>
          <div className="sidebar-title">{data.settings.societyName || 'নীলকণ্ঠ ফ্ল্যাট সমিতি'}</div>
          <div className="sidebar-sub">সার্ভিস চার্জ সফটওয়্যার v২.০</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group) => (
          <React.Fragment key={group.label}>
            <div className="nav-group-label">{group.label}</div>
            {group.items
              .filter((item) => !(item.adminOnly && isReadOnly))
              .map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  className={`nav-item ${isActive ? 'active' : ''} ${item.highlight && !isActive ? 'highlight-tab' : ''}`}
                  onClick={() => {
                    setCurrentTab(item.id);
                    // মোবাইলে পাতা বেছে নেওয়ার সাথে সাথেই মেনু সরে যাবে
                    if (onClose) onClose();
                  }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div
            className="user-avatar"
            style={{ background: user?.role === 'viewer' ? 'var(--success)' : 'var(--primary)' }}
          >
            {user?.role === 'viewer' ? '👁' : (user?.name ? user.name.charAt(0) : 'U')}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="user-name">{user?.name || 'ব্যবহারকারী'}</div>
            <div className="user-role">
              {user?.role === 'viewer' ? 'ভিউ মুড (প্রদর্শন মাত্র)' : 'অ্যাডমিন প্যানেল'}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="btn-icon"
          title="লগআউট"
          aria-label="লগআউট"
          style={{ color: '#fca5a5' }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
    </>
  );
}
