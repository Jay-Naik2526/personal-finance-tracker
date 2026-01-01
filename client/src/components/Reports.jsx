import React, { useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Calendar, Download } from 'lucide-react';

const Reports = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);

    const generatePDF = async (period) => {
        setLoading(true);
        try {
            // Determine dates based on period
            let start = startDate;
            let end = endDate;
            const today = new Date();

            if (period === 'daily') {
                start = today.toISOString().split('T')[0];
                end = today.toISOString().split('T')[0];
            } else if (period === 'monthly') {
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                start = firstDay.toISOString().split('T')[0];
                end = today.toISOString().split('T')[0];
            }

            if (!start || !end) {
                alert('Please select a date range or one of the presets.');
                setLoading(false);
                return;
            }

            // Fetch Data
            // We need a route to get filtered transactions. Utilizing existing or fetching all and filtering?
            // Let's assume fetching all and filtering client side for now to avoid backend changes if possible.
            // Actually, backend filtering is better but we have a simple GET /. Let's use that.
            const res = await axios.get('/api/transactions');
            const allTransactions = res.data;

            const filtered = allTransactions.filter(t => {
                const d = t.date.split('T')[0];
                return d >= start && d <= end && t.category !== 'Balance Adjustment';
            });

            // Generate PDF
            const doc = new jsPDF();

            // Header
            doc.setFillColor(5, 5, 17); // Background-ish
            doc.rect(0, 0, 210, 297, 'F'); // Dark background? No, PDF standard white is better for printing.

            // Standard White Report
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, 210, 297, 'F');

            // Gradient Header emulation
            doc.setFillColor(99, 102, 241); // Indigo
            doc.rect(0, 0, 210, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("Expense Report", 14, 25);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Period: ${start} to ${end}`, 14, 32);

            // Summary
            const total = filtered.reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : 0), 0);
            const income = filtered.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : 0), 0);

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.text(`Total Spent: Rs. ${total.toLocaleString()}`, 14, 50);
            doc.text(`Total Income: Rs. ${income.toLocaleString()}`, 100, 50);

            // Table
            const tableColumn = ["Date", "Description", "Category", "Source", "Amount (Rs)"];
            const tableRows = [];

            filtered.forEach(t => {
                const tData = [
                    new Date(t.date).toLocaleDateString(),
                    t.description || t.merchant || '-',
                    t.category,
                    t.source,
                    (t.type === 'expense' ? '-' : '+') + t.amount.toLocaleString()
                ];
                tableRows.push(tData);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 60,
                theme: 'grid',
                headStyles: { fillColor: [99, 102, 241] },
                alternateRowStyles: { fillColor: [245, 247, 250] }
            });

            doc.save(`Finance_Report_${start}_${end}.pdf`);

        } catch (err) {
            console.error(err);
            alert('Error generating report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
            <header>
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">Reports</h2>
                <p className="text-muted">Export your financial data in professional PDF formats.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Quick Export */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <FileText size={20} className="text-primary" /> Quick Export
                    </h3>
                    <div className="space-y-4">
                        <button
                            onClick={() => generatePDF('daily')}
                            disabled={loading}
                            className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between px-6 transition-all group"
                        >
                            <span className="text-white font-medium">Daily Report (Today)</span>
                            <Download size={18} className="text-muted group-hover:text-primary transition-colors" />
                        </button>
                        <button
                            onClick={() => generatePDF('monthly')}
                            disabled={loading}
                            className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between px-6 transition-all group"
                        >
                            <span className="text-white font-medium">Monthly Report (This Month)</span>
                            <Download size={18} className="text-muted group-hover:text-primary transition-colors" />
                        </button>
                    </div>
                </div>

                {/* Custom Range */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Calendar size={20} className="text-accent" /> Custom Range
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-muted mb-2 pl-1">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="glass-input w-full text-white/80"
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-muted mb-2 pl-1">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="glass-input w-full text-white/80"
                            />
                        </div>
                        <button
                            onClick={() => generatePDF('custom')}
                            disabled={loading}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-accent to-rose-600/80 hover:from-accent/90 hover:to-rose-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-accent/20 mt-4 transition-all"
                        >
                            {loading ? 'Generating...' : 'Download Custom PDF'}
                            <Download size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
