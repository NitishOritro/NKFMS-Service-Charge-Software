import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import * as Calc from '../utils/calc';
import * as U from '../utils/format';
import { AlertTriangle, Printer, CheckSquare, Square } from 'lucide-react';
import { Pagination } from '../components/Pagination';

export function DefaultersView({ onOpenSelectivePrint }) {
  const { data, selectedMonth } = useData();
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState('all');

  const statuses = Calc.allStatuses(data, selectedMonth);
  const defaulters = statuses.filter((s) => s.due > 0);

  const paginatedStatuses = pageSize === 'all' ? statuses : statuses.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSelectAll = () => {
    if (selectedIds.length === defaulters.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(defaulters.map((s) => s.flat.id));
    }
  };

  const toggleFlat = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handlePrintSelected = () => {
    if (!selectedIds.length) {
      alert('অন্তত একটি ফ্ল্যাট নির্বাচন করুন।');
      return;
    }
    onOpenSelectivePrint(selectedIds);
  };

  return (
    <div className="page-body">
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
          overflow: 'visible'
        }}
      >
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--danger-dark)' }}>
            বকেয়া ফ্ল্যাটের তালিকা ও বিবরণী ({U.monthLabel(selectedMonth)} পর্যন্ত)
          </h2>
          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            মোট বকেয়াকৃত ফ্ল্যাট: <b>{U.bnDigits(defaulters.length)} টি</b> &nbsp;|&nbsp; 
            নির্বাচিত: <b>{U.bnDigits(selectedIds.length)} টি</b>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={toggleSelectAll} className="btn btn-outline btn-sm">
            {selectedIds.length === defaulters.length ? <CheckSquare size={15} /> : <Square size={15} />}
            <span>{selectedIds.length === defaulters.length ? 'সব আনসিলেক্ট' : 'সকল বকেয়া সিলেক্ট'}</span>
          </button>

          <button
            onClick={handlePrintSelected}
            disabled={!selectedIds.length}
            className="btn btn-primary btn-sm"
          >
            <Printer size={15} />
            <span>নির্বাচিতদের বকেয়া রিপোর্ট প্রিন্ট</span>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-body flush">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>বাছাই</th>
                  <th style={{ width: '50px', textAlign: 'center' }}>ক্রম</th>
                  <th style={{ width: '70px', textAlign: 'center' }}>ফ্ল্যাট</th>
                  <th>মালিকের নাম</th>
                  <th style={{ width: '120px' }}>মোবাইল</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>ধার্য চার্জ</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>মোট জমা</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>বর্তমান বকেয়া</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>সমতুল্য মাস</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>অবস্থা</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStatuses.map((s, idx) => {
                  const isDefaulter = s.due > 0;
                  const isSelected = selectedIds.includes(s.flat.id);
                  const eqMonths = s.monthRate > 0 ? Math.round(s.due / s.monthRate) : 0;

                  return (
                    <tr
                      key={s.flat.id}
                      style={{
                        backgroundColor: isSelected ? '#fef3c7' : isDefaulter ? '#fff' : '#f8fafc',
                        opacity: isDefaulter ? 1 : 0.65
                      }}
                    >
                      <td style={{ textAlign: 'center' }}>
                        {isDefaulter ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleFlat(s.flat.id)}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                        ) : null}
                      </td>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>{U.bnDigits(s.flat.serial)}</td>
                      <td style={{ textAlign: 'center' }}><b>{s.flat.flatNo}</b></td>
                      <td><b>{s.flat.ownerName}</b></td>
                      <td style={{ color: '#64748b', fontSize: '11px' }}>{s.flat.phone || '—'}</td>
                      <td style={{ textAlign: 'right' }}>{U.bnNumber(s.charged)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--success-dark)' }}>{U.bnNumber(s.paid)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: s.due > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {s.due > 0 ? U.bnTaka(s.due) : '০'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {s.due > 0 ? `${U.bnDigits(eqMonths)} মাস` : '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {s.due > 0 ? (
                          <span className="pill due">বকেয়া</span>
                        ) : s.advance > 0 ? (
                          <span className="pill warning">অগ্রীম {U.bnNumber(s.advance)}</span>
                        ) : (
                          <span className="pill ok">পরিশোধিত</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f1f5f9', fontWeight: 700 }}>
                  <td colSpan="7" style={{ textAlign: 'right' }}>সর্বমোট বকেয়া পাওনা:</td>
                  <td style={{ textAlign: 'right', color: 'var(--danger)', fontSize: '13.5px' }}>
                    {U.bnTaka(statuses.reduce((acc, s) => acc + s.due, 0))}
                  </td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalItems={statuses.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            pageSizeOptions={[10, 15, 25, 'all']}
          />
        </div>
      </div>
    </div>
  );
}
