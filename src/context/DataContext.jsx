import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_DATA } from '../data/initialData';
import * as U from '../utils/format';

const DataContext = createContext();
const STORAGE_KEY = 'nkfms_database_v2';

export function DataProvider({ children }) {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.flats) && Array.isArray(parsed.payments)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved database:', e);
    }
    return INITIAL_DATA;
  });

  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [toasts, setToasts] = useState([]);

  // Auto-save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [data]);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Payment CRUD
  const getPayment = (flatId, month) => {
    return data.payments.find((p) => p.flatId === flatId && p.month === month) || null;
  };

  const setPayment = (flatId, month, paymentObj) => {
    setData((prev) => {
      const existingIdx = prev.payments.findIndex((p) => p.flatId === flatId && p.month === month);
      const updatedPayments = [...prev.payments];
      
      const newRecord = {
        id: existingIdx >= 0 ? prev.payments[existingIdx].id : `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        flatId,
        month,
        amount: Number(paymentObj.amount) || 0,
        collectorId: paymentObj.collectorId || '',
        receivedOn: paymentObj.receivedOn || U.monthEndIso(month),
        note: paymentObj.note || ''
      };

      if (existingIdx >= 0) {
        updatedPayments[existingIdx] = newRecord;
      } else {
        updatedPayments.push(newRecord);
      }

      return { ...prev, payments: updatedPayments };
    });
  };

  const deletePayment = (flatId, month) => {
    setData((prev) => ({
      ...prev,
      payments: prev.payments.filter((p) => !(p.flatId === flatId && p.month === month))
    }));
    addToast('এন্ট্রি মুছে ফেলা হয়েছে।', 'warning');
  };

  const bulkSetPayments = (newPaymentsList) => {
    setData((prev) => {
      const map = new Map(prev.payments.map((p) => [`${p.flatId}_${p.month}`, p]));
      newPaymentsList.forEach((np) => {
        const key = `${np.flatId}_${np.month}`;
        const existing = map.get(key);
        map.set(key, {
          id: existing ? existing.id : `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          flatId: np.flatId,
          month: np.month,
          amount: Number(np.amount) || 0,
          collectorId: np.collectorId || (existing ? existing.collectorId : ''),
          receivedOn: np.receivedOn || U.monthEndIso(np.month),
          note: np.note || ''
        });
      });
      return { ...prev, payments: Array.from(map.values()) };
    });
    addToast('সকল এন্ট্রি সফলভাবে সংরক্ষিত হয়েছে।', 'success');
  };

  // Flat CRUD
  const updateFlat = (flatId, flatData) => {
    setData((prev) => ({
      ...prev,
      flats: prev.flats.map((f) => (f.id === flatId ? { ...f, ...flatData } : f))
    }));
    addToast('ফ্ল্যাটের তথ্য হালনাগাদ করা হয়েছে।', 'success');
  };

  const addFlat = (flatData) => {
    const newFlat = {
      id: `f-${Date.now().toString(36)}`,
      serial: Number(flatData.serial) || (data.flats.length + 1),
      flatNo: flatData.flatNo || '',
      ownerName: flatData.ownerName || '',
      openingDue: Number(flatData.openingDue) || 0,
      phone: flatData.phone || '',
      note: flatData.note || '',
      active: flatData.active !== false
    };
    setData((prev) => ({
      ...prev,
      flats: [...prev.flats, newFlat]
    }));
    addToast('নতুন ফ্ল্যাট যুক্ত করা হয়েছে।', 'success');
  };

  // Settings & Collectors & Signatories
  const updateSettings = (newSettings) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
    addToast('সেটিংস সংরক্ষণ করা হয়েছে।', 'success');
  };

  const updateCollectors = (collectors) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, collectors }
    }));
    addToast('আদায়কারী তালিকা সংরক্ষিত হয়েছে।', 'success');
  };

  const updateSignatories = (signatories) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, signatories }
    }));
    addToast('স্বাক্ষরকারী তালিকা সংরক্ষিত হয়েছে।', 'success');
  };

  // Backup & Restore
  const exportBackupJson = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    a.href = url;
    a.download = `nkfms-backup-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('ব্যাকআপ JSON ফাইল ডাউনলোড হয়েছে।', 'success');
  };

  const importBackupJson = (jsonObj) => {
    if (jsonObj && Array.isArray(jsonObj.flats) && Array.isArray(jsonObj.payments)) {
      setData(jsonObj);
      addToast('ব্যাকআপ ফাইল থেকে সকল ডেটা সফলভাবে লোড করা হয়েছে।', 'success');
      return true;
    }
    addToast('ভুল ফাইল ফরম্যাট। সঠিক JSON ব্যাকআপ ফাইল নির্বাচন করুন।', 'error');
    return false;
  };

  const resetToDefault = () => {
    setData(INITIAL_DATA);
    addToast('ডিফল্ট ডেটাবেজ রিসেট করা হয়েছে।', 'warning');
  };

  return (
    <DataContext.Provider
      value={{
        data,
        selectedMonth,
        setSelectedMonth,
        getPayment,
        setPayment,
        deletePayment,
        bulkSetPayments,
        updateFlat,
        addFlat,
        updateSettings,
        updateCollectors,
        updateSignatories,
        exportBackupJson,
        importBackupJson,
        resetToDefault,
        toasts,
        addToast,
        removeToast
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
