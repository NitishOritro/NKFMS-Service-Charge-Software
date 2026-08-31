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
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export function Sidebar({ currentTab, setCurrentTab }) {
  const { user, logout } = useAuth();
  const { data } = useData();

  const navItems = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'collection', label: 'মাসিক আদায় এন্ট্রি', icon: CalendarCheck },
    { id: 'flat-entry', label: 'একক ফ্ল্যাট এন্ট্রি (২৫ মাস)', icon: Layers, highlight: true },
    { id: 'summary', label: 'মাসিক হিসাব সারসংক্ষেপ', icon: FileSpreadsheet },
    { id: 'defaulters', label: 'বকেয়া তালিকা', icon: AlertTriangle },
    { id: 'reports', label: 'প্রিন্ট ও PDF রিপোর্ট', icon: Printer },
    { id: 'flats', label: 'ফ্ল্যাট ব্যবস্থাপনা', icon: Building2 },
    { id: 'collectors', label: 'আদায়কারী ও স্বাক্ষরকারী', icon: Users },
    { id: 'settings', label: 'সেটিংস ও ব্যাকআপ', icon: Settings }
  ];

  return (
    <aside className="sidebar no-print">
      <div className="sidebar-header">
        <img src="/logo.jpg" alt="NKFMS Logo" className="sidebar-logo" />
        <div>
          <div className="sidebar-title">{data.settings.societyName || 'নীলকণ্ঠ ফ্ল্যাট সমিতি'}</div>
          <div className="sidebar-sub">সার্ভিস চার্জ সফটওয়্যার v2.0</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''} ${item.highlight && !isActive ? 'highlight-tab' : ''}`}
              onClick={() => setCurrentTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user?.name ? user.name.charAt(0) : 'U'}</div>
          <div>
            <div className="user-name">{user?.name || 'ব্যবহারকারী'}</div>
            <div className="user-role">অ্যাডমিন প্যানেল</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="btn-icon"
          title="লগআউট"
          style={{ color: '#ef4444' }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
