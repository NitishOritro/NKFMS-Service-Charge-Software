import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
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

export function App() {
  const { isAuthenticated } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [reportState, setReportState] = useState({ type: 'monthly', selectiveIds: null });

  if (!isAuthenticated) {
    return (
      <>
        <LoginView />
        <ToastContainer />
      </>
    );
  }

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard': return 'সার্ভিস চার্জ ড্যাশবোর্ড';
      case 'collection': return 'মাসিক আদায় এন্ট্রি';
      case 'flat-entry': return 'একক ফ্ল্যাট এন্ট্রি (বিগত ২৫ মাস)';
      case 'summary': return 'মাসিক হিসাবায়ন সারসংক্ষেপ';
      case 'defaulters': return 'বকেয়া ফ্ল্যাটের তালিকা';
      case 'reports': return 'অফিসিয়াল প্রিন্ট ও PDF রিপোর্ট';
      case 'flats': return 'ফ্ল্যাট ও মালিকদের তথ্য';
      case 'collectors': return 'টাকা আদায়কারী ও স্বাক্ষরকারী';
      case 'settings': return 'সফটওয়্যার সেটিংস ও ব্যাকআপ';
      default: return 'ড্যাশবোর্ড';
    }
  };

  const handleOpenSelectivePrint = (flatIds) => {
    setReportState({ type: 'selective', selectiveIds: flatIds });
    setCurrentTab('reports');
  };

  return (
    <div className="app-container">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <div className="main-content">
        <Navbar pageTitle={getPageTitle()} />

        {currentTab === 'dashboard' && <DashboardView setCurrentTab={setCurrentTab} />}
        {currentTab === 'collection' && <MonthlyCollectionView />}
        {currentTab === 'flat-entry' && <SingleFlatEntryView onOpenLedger={() => setCurrentTab('reports')} />}
        {currentTab === 'summary' && <MonthlySummaryView onOpenPrint={() => setCurrentTab('reports')} />}
        {currentTab === 'defaulters' && <DefaultersView onOpenSelectivePrint={handleOpenSelectivePrint} />}
        {currentTab === 'reports' && (
          <ReportView
            defaultReport={reportState.type}
            selectiveFlatIds={reportState.selectiveIds}
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
