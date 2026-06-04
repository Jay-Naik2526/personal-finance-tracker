import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Chart as ChartJS, ArcElement, Tooltip, Legend,
    CategoryScale, LinearScale, PointElement, LineElement, Title
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import WalletCard from './WalletCard';
import {
    TrendingUp, TrendingDown, AlertTriangle, Trash2,
    CheckCircle, Info, Wallet, Zap, Target, ArrowUpRight
} from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const CHART_COLORS = ['#6366F1', '#16A34A', '#DC2626', '#D97706', '#8B5CF6', '#0891B2', '#EC4899'];
const fmt = (n) => Math.round(n || 0).toLocaleString('en-IN');

/* ── Tinted stat card (iOS 18 widget style) ──── */
const StatCard = ({ label, value, tintBg, valueColor, icon: Icon, iconBg, iconColor, sub }) => (
    <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: tintBg }}>
        <div className="flex items-start justify-between">
            <div className={`icon-box ${iconBg} ${iconColor}`}>
                <Icon size={16} />
            </div>
            {sub && <span className="text-[11px] font-medium text-sub">{sub}</span>}
        </div>
        <div>
            <div className="label mb-1">{label}</div>
            <div className="num text-[1.85rem] leading-none" style={{ color: valueColor }}>
                <span className="text-base font-semibold mr-0.5 opacity-60">₹</span>{fmt(value)}
            </div>
        </div>
    </div>
);

/* ── Dashboard ──────────────────────────────────── */
const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [tick, setTick] = useState(0);
    const refresh = () => setTick(t => t + 1);

    useEffect(() => {
        axios.get('/api/dashboard/stats').then(r => setStats(r.data)).catch(console.error);
    }, [tick]);

    if (!stats) {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="w-7 h-7 border-2 border-border border-t-ink rounded-full animate-spin" />
            </div>
        );
    }

    const doughnutData = {
        labels: stats.categorySpending?.map(s => s._id) || [],
        datasets: [{
            data: stats.categorySpending?.map(s => s.total) || [],
            backgroundColor: CHART_COLORS,
            borderColor: '#FFFFFF',
            borderWidth: 3,
        }],
    };

    const lineData = {
        labels: stats.dailySpending?.map(s => s._id) || [],
        datasets: [{
            label: 'Daily Spend',
            data: stats.dailySpending?.map(s => s.total) || [],
            borderColor: '#6366F1',
            backgroundColor: 'rgba(99,102,241,0.07)',
            fill: true, tension: 0.45, borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#6366F1',
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2,
        }],
    };

    const chartFont = { family: 'Plus Jakarta Sans', size: 10 };
    const tickColor = '#9CA3AF';
    const gridColor = '#F3F4F6';

    const doughnutOpts = {
        responsive: true, cutout: '70%',
        plugins: {
            legend: { position: 'right', labels: { color: tickColor, font: chartFont, boxWidth: 9, padding: 12 } },
            tooltip: { callbacks: { label: c => ` ₹${fmt(c.raw)}` } },
        },
    };

    const lineOpts = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: c => ` ₹${fmt(c.raw)}` } },
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: tickColor, font: chartFont }, border: { color: gridColor } },
            y: {
                grid: { color: gridColor },
                ticks: { color: tickColor, font: chartFont, callback: v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}` },
                border: { color: gridColor },
            },
        },
    };

    const budgetPct = stats.totalBudgetLimit
        ? Math.min(100, Math.round((stats.monthlySpending / stats.totalBudgetLimit) * 100))
        : 0;

    return (
        <div className="space-y-5 animate-fade-in-up">

            {/* Page header */}
            <div className="flex items-center justify-between pt-2">
                <div>
                    <h1 className="page-title">Overview</h1>
                    <p className="text-sub text-sm mt-0.5">
                        {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-sub text-xs px-3 py-1.5 rounded-full bg-surface border border-border">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Live
                </div>
            </div>

            {/* Smart Insights */}
            <SmartAdvisor />

            {/* ── BENTO GRID ────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

                {/* iOS-style tinted stat cards */}
                <StatCard
                    label="Monthly Spend"
                    value={stats.monthlySpending}
                    tintBg="#FEF2F2"
                    valueColor="#DC2626"
                    icon={TrendingDown}
                    iconBg="bg-red-100"
                    iconColor="text-red-500"
                    sub={`${budgetPct}% of budget`}
                />
                <StatCard
                    label="Daily Safe Limit"
                    value={stats.dailySafeToSpend}
                    tintBg={(stats.dailySafeToSpend || 0) < 100 ? '#FEF2F2' : '#F0FDF4'}
                    valueColor={(stats.dailySafeToSpend || 0) < 100 ? '#DC2626' : '#16A34A'}
                    icon={Zap}
                    iconBg={(stats.dailySafeToSpend || 0) < 100 ? 'bg-red-100' : 'bg-green-100'}
                    iconColor={(stats.dailySafeToSpend || 0) < 100 ? 'text-red-500' : 'text-green-600'}
                    sub="Remaining budget"
                />
                <StatCard
                    label="Total Budget"
                    value={stats.totalBudgetLimit}
                    tintBg="#EFF6FF"
                    valueColor="#2563EB"
                    icon={Wallet}
                    iconBg="bg-blue-100"
                    iconColor="text-blue-600"
                    sub={new Date().toLocaleString('default', { month: 'short' })}
                />
                <StatCard
                    label="Net Worth"
                    value={stats.cashBalance + stats.onlineBalance}
                    tintBg="#FAF5FF"
                    valueColor="#7C3AED"
                    icon={Target}
                    iconBg="bg-purple-100"
                    iconColor="text-purple-600"
                    sub="Cash + Online"
                />

                {/* Spending breakdown — tall 2×2 bento card */}
                <div className="card p-5 col-span-2 row-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="label">Spending Breakdown</div>
                        </div>
                    </div>
                    <div className="h-52 flex items-center justify-center">
                        {stats.categorySpending?.length > 0 ? (
                            <Doughnut data={doughnutData} options={doughnutOpts} />
                        ) : (
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-2xl bg-raised flex items-center justify-center mx-auto mb-3 text-2xl">📊</div>
                                <div className="text-sub text-sm font-medium">No expenses yet</div>
                                <div className="text-dim text-xs mt-1">Add a transaction to see breakdown</div>
                            </div>
                        )}
                    </div>
                    {stats.categorySpending?.length > 0 && (
                        <div className="mt-4 space-y-2 border-t border-border pt-4">
                            {stats.categorySpending.slice(0, 4).map((s, i) => (
                                <div key={s._id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i] }} />
                                        <span className="text-sub text-xs font-medium">{s._id}</span>
                                    </div>
                                    <span className="text-ink text-xs font-semibold num">₹{fmt(s.total)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Cash wallet */}
                <div className="col-span-1">
                    <WalletCard type="Cash" balance={stats.cashBalance} onUpdate={refresh} />
                </div>

                {/* Online wallet */}
                <div className="col-span-1">
                    <WalletCard type="Online" balance={stats.onlineBalance} onUpdate={refresh} />
                </div>

                {/* Daily trend — wide card */}
                <div className="card p-5 col-span-2">
                    <div className="label mb-4">Daily Trend</div>
                    <div className="h-44">
                        {stats.dailySpending?.length > 0 ? (
                            <Line data={lineData} options={lineOpts} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-sub text-sm">
                                No spending data yet
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent transactions — full width */}
                <div className="card col-span-2 lg:col-span-4 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                        <div className="label">Recent Activity</div>
                        <ArrowUpRight size={14} className="text-dim" />
                    </div>
                    <RecentTransactions limit={6} onUpdate={refresh} />
                </div>
            </div>
        </div>
    );
};


/* ── Recent Transactions ────────────────────── */
const RecentTransactions = ({ limit, onUpdate }) => {
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        axios.get('/api/transactions')
            .then(r => setTransactions(r.data.filter(t => t.category !== 'Balance Adjustment').slice(0, limit)))
            .catch(console.error);
    }, [limit, onUpdate]);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this transaction?')) return;
        try { await axios.delete(`/api/transactions/${id}`); if (onUpdate) onUpdate(); }
        catch { alert('Failed to delete'); }
    };

    if (transactions.length === 0) {
        return (
            <div className="px-5 py-8 text-center text-sub text-sm">
                No recent activity. Add your first transaction to get started.
            </div>
        );
    }

    return (
        <div>
            {transactions.map((t, i) => (
                <div
                    key={t._id}
                    className={`flex items-center justify-between px-5 py-3.5 group hover:bg-raised/60 transition-colors ${
                        i !== transactions.length - 1 ? 'border-b border-border/70' : ''
                    }`}
                >
                    <div className="flex items-center gap-3.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            t.type === 'income' ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                            {t.type === 'income'
                                ? <TrendingUp size={15} className="text-green-600" />
                                : <TrendingDown size={15} className="text-red-500" />
                            }
                        </div>
                        <div className="min-w-0">
                            <div className="text-ink text-sm font-semibold truncate">{t.description || t.category}</div>
                            <div className="text-dim text-xs mt-0.5 flex items-center gap-1.5">
                                <span>{new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                <span>·</span>
                                <span>{t.source}</span>
                                <span>·</span>
                                <span>{t.category}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`num text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-ink'}`}>
                            {t.type === 'expense' ? '−' : '+'}₹{t.amount.toLocaleString('en-IN')}
                        </span>
                        <button
                            onClick={() => handleDelete(t._id)}
                            className="w-7 h-7 rounded-lg text-dim hover:text-neg hover:bg-red-50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};


/* ── Smart Insights ─────────────────────────── */
const INSIGHT_STYLES = {
    danger:  { border: 'border-red-200',    bg: 'bg-red-50',    text: 'text-red-600',    icon: AlertTriangle },
    warning: { border: 'border-amber-200',  bg: 'bg-amber-50',  text: 'text-amber-600',  icon: AlertTriangle },
    success: { border: 'border-green-200',  bg: 'bg-green-50',  text: 'text-green-700',  icon: CheckCircle },
    info:    { border: 'border-blue-200',   bg: 'bg-blue-50',   text: 'text-blue-600',   icon: Info },
    neutral: { border: 'border-border',     bg: 'bg-raised',    text: 'text-sub',        icon: Info },
};

const SmartAdvisor = () => {
    const [insights, setInsights] = useState([]);
    const [open, setOpen] = useState(true);

    useEffect(() => {
        axios.get('/api/insights').then(r => setInsights(r.data)).catch(console.error);
    }, []);

    if (insights.length === 0) return null;

    return (
        <div className="card overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-raised/50 transition-colors"
            >
                <div className="label">Smart Insights</div>
                <span className="text-dim text-xs font-medium">{open ? 'Hide' : `${insights.length} insights`}</span>
            </button>
            {open && (
                <div className="px-5 pb-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {insights.map((insight, i) => {
                        const style = INSIGHT_STYLES[insight.type] || INSIGHT_STYLES.neutral;
                        const Icon = style.icon;
                        return (
                            <div key={i} className={`flex items-start gap-3 p-3.5 rounded-xl border ${style.bg} ${style.border}`}>
                                <Icon size={14} className={`${style.text} flex-shrink-0 mt-0.5`} />
                                <div>
                                    <div className={`text-xs font-semibold mb-0.5 ${style.text}`}>{insight.title}</div>
                                    <div className="text-sub text-xs leading-relaxed">{insight.message}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
