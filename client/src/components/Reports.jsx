import React, { useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Calendar, Download, Zap } from 'lucide-react';

const Reports = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);

    const generatePDF = async (period) => {
        setLoading(true);
        try {
            let start = startDate, end = endDate;
            const today = new Date();
            if (period === 'daily')   { start = end = today.toISOString().split('T')[0]; }
            else if (period === 'monthly') { start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]; end = today.toISOString().split('T')[0]; }
            if (!start || !end) { alert('Please select a date range.'); setLoading(false); return; }

            const res = await axios.get('/api/transactions');
            const filtered = res.data.filter(t => { const d = t.date.split('T')[0]; return d >= start && d <= end && t.category !== 'Balance Adjustment'; });

            const doc = new jsPDF();
            doc.setFillColor(15, 15, 15);
            doc.rect(0, 0, 210, 36, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20); doc.setFont('helvetica', 'bold');
            doc.text('MoneyMap — Finance Report', 14, 22);
            doc.setFontSize(9); doc.setFont('helvetica', 'normal');
            doc.text(`Period: ${start}  →  ${end}`, 14, 30);

            const totalSpent  = filtered.reduce((s, t) => s + (t.type === 'expense' ? t.amount : 0), 0);
            const totalIncome = filtered.reduce((s, t) => s + (t.type === 'income'  ? t.amount : 0), 0);

            doc.setTextColor(30, 30, 30);
            doc.setFontSize(11); doc.setFont('helvetica', 'bold');
            doc.text(`Total Spent:  Rs. ${totalSpent.toLocaleString('en-IN')}`,  14, 48);
            doc.text(`Total Income: Rs. ${totalIncome.toLocaleString('en-IN')}`, 110, 48);

            autoTable(doc, {
                head: [['Date', 'Description', 'Category', 'Source', 'Amount (Rs)']],
                body: filtered.map(t => [
                    new Date(t.date).toLocaleDateString('en-IN'),
                    t.description || t.merchant || '—',
                    t.category, t.source,
                    `${t.type === 'expense' ? '−' : '+'}${t.amount.toLocaleString('en-IN')}`,
                ]),
                startY: 56, theme: 'grid',
                headStyles: { fillColor: [15, 15, 15], fontSize: 9 },
                bodyStyles: { fontSize: 9 },
                alternateRowStyles: { fillColor: [247, 243, 236] },
            });

            doc.save(`MoneyMap_Report_${start}_to_${end}.pdf`);
        } catch (err) { console.error(err); alert('Error generating report'); }
        finally { setLoading(false); }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-5 animate-fade-in-up">

            <div className="pt-2 pb-1 border-b border-rule">
                <div className="data-label mb-1">Export Data</div>
                <h1 className="page-title">Reports</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="panel p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap size={13} className="text-ink" />
                        <div className="data-label">Quick Export</div>
                    </div>
                    <div className="space-y-2">
                        {[
                            { label: "Today's Report", period: 'daily',   desc: 'All transactions from today' },
                            { label: 'Monthly Report',  period: 'monthly', desc: 'This month so far' },
                        ].map(({ label, period, desc }) => (
                            <button key={period} onClick={() => generatePDF(period)} disabled={loading}
                                className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-rule hover:border-ink/20 hover:bg-parchment transition-all group">
                                <div className="text-left">
                                    <div className="text-ink text-sm font-semibold">{label}</div>
                                    <div className="text-sub text-xs mt-0.5">{desc}</div>
                                </div>
                                <Download size={14} className="text-dim group-hover:text-ink transition-colors" />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="panel p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar size={13} className="text-warn" />
                        <div className="data-label">Custom Date Range</div>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="data-label block mb-2">From</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="field-input w-full" />
                        </div>
                        <div>
                            <label className="data-label block mb-2">To</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="field-input w-full" />
                        </div>
                        <button onClick={() => generatePDF('custom')} disabled={loading || !startDate || !endDate}
                            className="w-full flex items-center justify-center gap-2 bg-ink hover:bg-neutral-700 disabled:opacity-40 text-white font-semibold py-3 rounded-lg transition-all text-sm mt-1">
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Generating…
                                </span>
                            ) : (
                                <><Download size={14} /> Download PDF</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="panel p-4 flex items-start gap-3">
                <FileText size={14} className="text-sub mt-0.5 flex-shrink-0" />
                <p className="text-sub text-xs leading-relaxed">
                    Reports include all transactions in the selected date range, excluding balance adjustments. The PDF is formatted with a dark header, summary totals, and a complete transaction table.
                </p>
            </div>
        </div>
    );
};

export default Reports;
