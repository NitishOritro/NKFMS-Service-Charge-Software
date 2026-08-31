import React from 'react';
import { useData } from '../context/DataContext';
import * as Calc from '../utils/calc';
import * as U from '../utils/format';
import {
  TrendingUp,
  AlertOctagon,
  CheckCircle2,
  Wallet,
  ArrowRight,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  Printer
} from 'lucide-react';

export function DashboardView({ setCurrentTab }) {
  const { data, selectedMonth } = useData();

  const { rows, totals } = Calc.summary(data, selectedMonth);
  const collectorData = Calc.collectorBreakdown(data, selectedMonth);

  const getCollectorName = (colId) => {
    const c = (data.settings.collectors || []).find((x) => x.id === colId);
    return c ? (c.bn || c.en) : 'নির্ধারিত নয়';
  };

  const percentage = totals.flatCount ? Math.round((totals.paidThisMonth / totals.flatCount) * 100) : 0;

  return (
    <div className="page-body">
      {/* Top Banner Alert */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          color: '#ffffff',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>
            {data.settings.societyName} — ড্যাশবোর্ড
          </h2>
          <p style={{ fontSize: '13.5px', color: '#e0f2fe', marginTop: '3px' }}>
            বর্তমান নির্বাচিত হিসাব মাস: <b>{U.monthLabel(selectedMonth)}</b> &nbsp;|&nbsp; মোট ফ্ল্যাট: <b>{U.bnDigits(totals.flatCount)} টি</b>
          </p>
        </div>

        <button
          onClick={() => setCurrentTab('flat-entry')}
          className="btn btn-success"
          style={{ padding: '10px 18px', fontSize: '14px', fontWeight: 700 }}
        >
          <Layers size={18} />
          <span>একক ফ্ল্যাট এন্ট্রি (২৫ মাস)</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-label">{U.monthLabel(selectedMonth)} মাসে মোট জমা</div>
          <div className="metric-value" style={{ color: 'var(--primary)' }}>{U.bnTaka(totals.monthCollected)}</div>
          <div className="metric-sub">{U.bnDigits(totals.paidThisMonth)} টি ফ্ল্যাট এ মাসে পরিশোধ করেছে</div>
        </div>

        <div className="metric-card danger">
          <div className="metric-label">{U.monthLabel(selectedMonth)} পর্যন্ত মোট বকেয়া</div>
          <div className="metric-value" style={{ color: 'var(--danger)' }}>{U.bnTaka(totals.totalDue)}</div>
          <div className="metric-sub">{U.bnDigits(totals.defaulters)} টি ফ্ল্যাটে বকেয়া পাওনা রয়েছে</div>
        </div>

        <div className="metric-card success">
          <div className="metric-label">পরিশোধের অগ্রগতি হার</div>
          <div className="metric-value" style={{ color: 'var(--success)' }}>%{U.bnDigits(percentage)}</div>
          <div className="metric-sub">মোট {U.bnDigits(totals.flatCount)} টির মধ্যে {U.bnDigits(totals.paidThisMonth)} টি জমা</div>
        </div>

        <div className="metric-card warning">
          <div className="metric-label">মোট অগ্রীম জমা</div>
          <div className="metric-value" style={{ color: 'var(--warning-dark)' }}>{U.bnTaka(totals.totalAdvance)}</div>
          <div className="metric-sub">ভবিষ্যৎ মাসসমূহের জন্য জমা</div>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: '#334155' }}>
        দ্রুত কার্যক্রম (Quick Actions)
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div
          onClick={() => setCurrentTab('flat-entry')}
          className="card"
          style={{
            padding: '20px',
            cursor: 'pointer',
            border: '2px solid #bae6fd',
            background: '#f0f9ff',
            marginBottom: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ background: '#0284c7', color: '#fff', padding: '10px', borderRadius: 'var(--radius-md)' }}>
              <Layers size={22} />
            </div>
            <ArrowRight size={18} color="#0284c7" />
          </div>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0369a1' }}>একক ফ্ল্যাট এন্ট্রি</h4>
          <p style={{ fontSize: '12.5px', color: '#475569', marginTop: '4px' }}>
            একটি ফ্ল্যাটের বিগত ২৫ মাসের (আগস্ট ২০২৪ হতে আগস্ট ২০২৬) সব এন্ট্রি একসাথে দিন।
          </p>
        </div>

        <div
          onClick={() => setCurrentTab('collection')}
          className="card"
          style={{ padding: '20px', cursor: 'pointer', marginBottom: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ background: '#10b981', color: '#fff', padding: '10px', borderRadius: 'var(--radius-md)' }}>
              <CheckCircle2 size={22} />
            </div>
            <ArrowRight size={18} color="#10b981" />
          </div>
          <h4 style={{ fontSize: '16px', fontWeight: 700 }}>মাসিক আদায় এন্ট্রি</h4>
          <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px' }}>
            {U.monthLabel(selectedMonth)} মাসের ২৭টি ফ্ল্যাটের আদায় ও রসিদ তৈরি করুন।
          </p>
        </div>

        <div
          onClick={() => setCurrentTab('defaulters')}
          className="card"
          style={{ padding: '20px', cursor: 'pointer', marginBottom: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ background: '#ef4444', color: '#fff', padding: '10px', borderRadius: 'var(--radius-md)' }}>
              <AlertTriangle size={22} />
            </div>
            <ArrowRight size={18} color="#ef4444" />
          </div>
          <h4 style={{ fontSize: '16px', fontWeight: 700 }}>বকেয়া তালিকা</h4>
          <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px' }}>
            সকল ফ্ল্যাটের মোট বকেয়া ও কত মাসের সমতুল্য বকেয়া রয়েছে তা দেখুন।
          </p>
        </div>

        <div
          onClick={() => setCurrentTab('reports')}
          className="card"
          style={{ padding: '20px', cursor: 'pointer', marginBottom: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ background: '#8b5cf6', color: '#fff', padding: '10px', borderRadius: 'var(--radius-md)' }}>
              <Printer size={22} />
            </div>
            <ArrowRight size={18} color="#8b5cf6" />
          </div>
          <h4 style={{ fontSize: '16px', fontWeight: 700 }}>প্রিন্ট ও PDF রিপোর্ট</h4>
          <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px' }}>
            মাঝখানে জলছাপ ও ৩-কলাম হেডারসহ অফিসিয়াল A4 সারসংক্ষেপ প্রিন্ট করুন।
          </p>
        </div>
      </div>

      {/* Collector Breakdown Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Wallet size={18} color="var(--primary)" />
            <span>{U.monthLabel(selectedMonth)} — আদায়কারীভিত্তিক আদায়ের হিসাব</span>
          </div>
        </div>
        <div className="card-body flush">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style="width: 50px">ক্রম</th>
                  <th>আদায়কারীর নাম</th>
                  <th style={{ textAlign: 'center' }}>জমাকৃত ফ্ল্যাট সংখ্যা</th>
                  <th style={{ textAlign: 'right' }}>মোট আদায়কৃত টাকা</th>
                </tr>
              </thead>
              <tbody>
                {collectorData.length > 0 ? (
                  collectorData.map((c, idx) => (
                    <tr key={c.collectorId || idx}>
                      <td>{U.bnDigits(idx + 1)}</td>
                      <td><b>{getCollectorName(c.collectorId)}</b></td>
                      <td style={{ textAlign: 'center' }}>{U.bnDigits(c.count)} টি</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary-dark)' }}>
                        {U.bnTaka(c.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                      এই মাসে কোনো আদায়ের রেকর্ড এন্ট্রি করা হয়নি।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
