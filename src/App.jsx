import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { LedgerEntryView } from './views/LedgerEntryView';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/Toast';

import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { MonthlyCollectionView } from './views/MonthlyCollectionView';
import { SingleFlatEntryView } from './views/SingleFlatEntryView';
import { MonthlySummaryView } from './views/MonthlySummaryView';
import { DefaultersView } from './views/DefaultersView';
import { ReportView } from './views/ReportView';
import { FlatManagementView } from './views/FlatManagementView';
import { CollectorSignatoryView } from './views/CollectorSignatoryView';
import { SettingsBackupView } from './views/SettingsBackupView';
import { ServiceChargeEntryFormView } from './views/ServiceChargeEntryFormView';

// ---------------------------------------------------------------------------
//  পেজের নাম — ঠিকানার হ্যাশ ও ব্রাউজার ট্যাবের শিরোনাম, দুটোরই উৎস
// ---------------------------------------------------------------------------
const PAGE_TITLES = {
  dashboard: 'সার্ভিস চার্জ ড্যাশবোর্ড',
  collection: 'মাসিক আদায় এন্ট্রি',
  'charge-form': 'সার্ভিস চার্জ এন্ট্রি ফর্ম',
  'flat-entry': 'একক ফ্ল্যাট এন্ট্রি (বিগত ২৫ মাস)',
  summary: 'মাসিক হিসাবায়ন সারসংক্ষেপ',
  ledger: 'আয়-ব্যয় হিসাব',
  defaulters: 'বকেয়া ফ্ল্যাটের তালিকা',
  reports: 'অফিসিয়াল প্রিন্ট ও PDF রিপোর্ট',
  flats: 'ফ্ল্যাট ও মালিকদের তথ্য',
  collectors: 'টাকা আদায়কারী ও স্বাক্ষরকারী',
  settings: 'সফটওয়্যার সেটিংস ও ব্যাকআপ'
};

const SITE_NAME = 'নীলকণ্ঠ ফ্ল্যাট মালিক সমিতি';
const DEFAULT_TAB = 'dashboard';

// কেবল অ্যাডমিন লগইনে খোলা পেজ। ভিউ মোডে মেনু থেকে লুকানো তো থাকেই,
// কেউ ঠিকানায় সরাসরি #/flat-entry লিখলেও যেন ঢুকতে না পারে।
const ADMIN_ONLY_TABS = ['flat-entry', 'ledger'];

/** ঠিকানার হ্যাশ (#/reports) থেকে পেজের নাম — অচেনা হলে ড্যাশবোর্ড */
function tabFromHash() {
  if (typeof window === 'undefined') return DEFAULT_TAB;
  let raw = window.location.hash || '';
  if (raw.charAt(0) === '#') raw = raw.slice(1);
  if (raw.charAt(0) === '/') raw = raw.slice(1);
  return Object.prototype.hasOwnProperty.call(PAGE_TITLES, raw) ? raw : DEFAULT_TAB;
}

export function App() {
  const { isAuthenticated, isReadOnly } = useAuth();

  // পেজের নামটি ঠিকানাতেই রাখা হয় (#/reports)। এতে —
  //   • রিফ্রেশ করলে একই পেজেই থাকা যায়, ড্যাশবোর্ডে ফিরে যেতে হয় না
  //   • ব্রাউজারের back / forward বোতাম কাজ করে
  //   • নির্দিষ্ট পেজের লিংক বুকমার্ক বা শেয়ার করা যায়
  const [currentTab, setCurrentTabState] = useState(tabFromHash);
  const [reportState, setReportState] = useState({ type: 'monthly', selectiveIds: null });
  // ছোট পর্দায় সাইডবার ড্রয়ার হয়ে যায়; বড় পর্দায় এই অবস্থার কোনো প্রভাব নেই
  const [navOpen, setNavOpen] = useState(false);

  const setCurrentTab = useCallback((tab) => {
    const next = Object.prototype.hasOwnProperty.call(PAGE_TITLES, tab) ? tab : DEFAULT_TAB;
    setCurrentTabState(next);
    if (window.location.hash !== '#/' + next) window.location.hash = '#/' + next;
  }, []);

  // back / forward বোতাম বা হাতে লেখা ঠিকানা
  useEffect(() => {
    const onHashChange = () => setCurrentTabState(tabFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // প্রথমবার হ্যাশ না থাকলে বসিয়ে দেওয়া — history-তে বাড়তি ধাপ যোগ না করে
  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#/' + DEFAULT_TAB);
    }
  }, []);

  // ভিউ মোডে অ্যাডমিন-পেজে ঢোকার চেষ্টা হলে ড্যাশবোর্ডে ফিরিয়ে দেওয়া
  useEffect(() => {
    if (isReadOnly && ADMIN_ONLY_TABS.includes(currentTab)) {
      setCurrentTab(DEFAULT_TAB);
    }
  }, [isReadOnly, currentTab, setCurrentTab]);

  // ব্রাউজার ট্যাবের নাম — কোন পেজে আছি তা ট্যাব দেখেই বোঝা যায়
  useEffect(() => {
    document.title = isAuthenticated
      ? `${PAGE_TITLES[currentTab] || 'ড্যাশবোর্ড'} — ${SITE_NAME}`
      : `লগইন — ${SITE_NAME}`;
  }, [currentTab, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <>
        <LoginView />
        <ToastContainer />
      </>
    );
  }

  const getPageTitle = () => PAGE_TITLES[currentTab] || 'ড্যাশবোর্ড';

  const handleOpenSelectivePrint = (flatIds) => {
    setReportState({ type: 'selective', selectiveIds: flatIds });
    setCurrentTab('reports');
  };

  return (
    <div className="app-container">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      <div className="main-content">
        <Navbar pageTitle={getPageTitle()} onOpenNav={() => setNavOpen(true)} />

        {currentTab === 'dashboard' && <DashboardView setCurrentTab={setCurrentTab} />}
        {currentTab === 'collection' && <MonthlyCollectionView />}
        {currentTab === 'charge-form' && <ServiceChargeEntryFormView />}
        {currentTab === 'flat-entry' && !isReadOnly && (
          <SingleFlatEntryView onOpenLedger={() => setCurrentTab('reports')} />
        )}
        {currentTab === 'summary' && (
          <MonthlySummaryView
            onOpenPrint={() => {
              setReportState({ type: 'monthly', selectiveIds: null });
              setCurrentTab('reports');
            }}
          />
        )}
        {currentTab === 'ledger' && !isReadOnly && (
          <LedgerEntryView
            onOpenPrint={() => {
              // আয়-ব্যয়ের রিপোর্টটাই খুলবে, আর ছাপার ঘরও নিজে থেকে আসবে
              setReportState({ type: 'cashbook', selectiveIds: null, autoPrint: true });
              setCurrentTab('reports');
            }}
          />
        )}
        {currentTab === 'defaulters' && <DefaultersView onOpenSelectivePrint={handleOpenSelectivePrint} />}
        {currentTab === 'reports' && (
          <ReportView
            defaultReport={reportState.type}
            selectiveFlatIds={reportState.selectiveIds}
            autoPrint={reportState.autoPrint}
            onAutoPrintDone={() => setReportState((p) => ({ ...p, autoPrint: false }))}
          />
        )}
        {currentTab === 'flats' && <FlatManagementView />}
        {currentTab === 'collectors' && <CollectorSignatoryView />}
        {currentTab === 'settings' && <SettingsBackupView />}
      </div>

      <ToastContainer />
    </div>
  );
}

export default App;
