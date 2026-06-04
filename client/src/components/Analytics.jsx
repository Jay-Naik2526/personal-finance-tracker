import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title);

const COLORS = ['#6366F1', '#16A34A', '#DC2626', '#D97706', '#8B5CF6', '#0891B2', '#EC4899'];
const fmt = (n) => (n || 0).toLocaleString('en-IN');

const Analytics = () => {
    const [stats, setStats] = useState(null);
    useEffect(() => { axios.get('/api/dashboard/stats').then(r => setStats(r.data)).catch(console.error); }, []);

    if (!stats) return <div className="flex items-center justify-center h-64"><span className="w-7 h-7 border-2 border-border border-t-ink rounded-full animate-spin" /></div>;

    const cf = { family: 'Plus Jakarta Sans', size: 10 };
    const tc = '#9CA3AF', gc = '#F3F4F6';

    const doughnutData = { labels: stats.categorySpending.map(s => s._id), datasets: [{ data: stats.categorySpending.map(s => s.total), backgroundColor: COLORS, borderColor: '#fff', borderWidth: 3 }] };
    const lineData     = { labels: stats.dailySpending.map(s => s._id),    datasets: [{ label: 'Daily Spend', data: stats.dailySpending.map(s => s.total), borderColor: '#6366F1', backgroundColor: 'rgba(99,102,241,0.07)', fill: true, tension: 0.45, borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#6366F1', pointBorderColor: '#fff', pointBorderWidth: 2 }] };
    const barData      = { labels: stats.categorySpending.map(s => s._id), datasets: [{ label: 'Amount', data: stats.categorySpending.map(s => s.total), backgroundColor: COLORS, borderRadius: 8, borderSkipped: false }] };

    const scaleOpts = { x: { grid: { display: false }, ticks: { color: tc, font: cf }, border: { color: gc } }, y: { grid: { color: gc }, ticks: { color: tc, font: cf, callback: v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}` }, border: { color: gc } } };
    const tooltipOpts = { callbacks: { label: c => ` ₹${fmt(c.raw)}` } };

    const budgetUsage = stats.totalBudgetLimit ? Math.round((stats.monthlySpending / stats.totalBudgetLimit) * 100) : 0;

    const METRICS = [
        { label: 'Monthly Expenses', value: `₹${fmt(stats.monthlySpending)}`,                     tint: '#FEF2F2', color: '#DC2626' },
        { label: 'Total Assets',      value: `₹${fmt(stats.cashBalance + stats.onlineBalance)}`,  tint: '#F0FDF4', color: '#16A34A' },
        { label: 'Budget Usage',      value: `${budgetUsage}%`,                                    tint: budgetUsage > 80 ? '#FEF2F2' : '#FFFBEB', color: budgetUsage > 80 ? '#DC2626' : '#D97706' },
        { label: 'Daily Safe Limit',  value: `₹${Math.round(stats.dailySafeToSpend || 0).toLocaleString('en-IN')}`, tint: '#EFF6FF', color: '#2563EB' },
    ];

    return (
        <div className="space-y-5 animate-fade-in-up">
            <div className="pt-2">
                <h1 className="page-title">Analytics</h1>
                <p className="text-sub text-sm mt-1">Deep dive into your spending patterns.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {METRICS.map(({ label, value, tint, color }) => (
                    <div key={label} className="card p-5" style={{ background: tint }}>
                        <div className="label mb-2">{label}</div>
                        <div className="num text-2xl" style={{ color }}>{value}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="card p-5">
                    <div className="label mb-4">Category Distribution</div>
                    <div className="h-56 flex items-center justify-center">
                        {stats.categorySpending.length > 0 ? <Doughnut data={doughnutData} options={{ responsive: true, cutout: '68%', plugins: { legend: { position: 'right', labels: { color: tc, font: cf, boxWidth: 9, padding: 12 } }, tooltip: tooltipOpts } }} /> : <span className="text-sub text-sm">No expense data yet</span>}
                    </div>
                </div>
                <div className="card p-5">
                    <div className="label mb-4">Daily Spend Trend</div>
                    <div className="h-56">
                        {stats.dailySpending.length > 0 ? <Line data={lineData} options={{ responsive: true, plugins: { legend: { display: false }, tooltip: tooltipOpts }, scales: scaleOpts }} /> : <div className="flex items-center justify-center h-full text-sub text-sm">No data</div>}
                    </div>
                </div>
            </div>

            <div className="card p-5">
                <div className="label mb-4">Spending by Category</div>
                <div className="h-64">
                    {stats.categorySpending.length > 0 ? <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false }, tooltip: tooltipOpts }, scales: scaleOpts }} /> : <div className="flex items-center justify-center h-full text-sub text-sm">No data</div>}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
