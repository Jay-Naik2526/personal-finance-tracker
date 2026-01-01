import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import WalletCard from './WalletCard';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [refresh, setRefresh] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('/api/dashboard/stats');
                setStats(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchStats();
    }, [refresh]);

    const toggleRefresh = () => setRefresh(!refresh);

    if (!stats) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    const pieData = {
        labels: stats.categorySpending.map(s => s._id),
        datasets: [
            {
                data: stats.categorySpending.map(s => s.total),
                backgroundColor: ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899'],
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
            },
        ],
    };

    const lineData = {
        labels: stats.dailySpending.map(s => s._id),
        datasets: [
            {
                label: 'Daily Spending',
                data: stats.dailySpending.map(s => s.total),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.5)',
                tension: 0.4,
                borderWidth: 3,
                pointBackgroundColor: '#fff',
            },
        ],
    };

    const commonOptions = {
        responsive: true,
        plugins: {
            legend: { labels: { color: '#94a3b8', font: { family: 'Outfit', size: 12 } } },
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
        }
    };

    // Pie needs no scales
    const pieOptions = {
        responsive: true,
        cutout: '70%',
        plugins: { legend: { position: 'right', labels: { color: '#94a3b8', boxWidth: 10 } } }
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <header className="mb-8">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Overview</h2>
                <p className="text-muted">Welcome back! Here's your financial summary.</p>
            </header>

            {/* Smart Advisor & Wallets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Advisor takes 2 cols on md, full on mobile if needed, or 1 col? Let's make it full width row commonly or side by side. 
                    Let's put Wallets on top, then Advisor? Or Advisor then Wallets?
                    Let's switch: Advisor is a wide banner, Wallets below?
                    Or: Advisor (col-span-1), Wallets (col-span-2)
                 */}
                <div className="md:col-span-3">
                    <SmartAdvisor />
                </div>

                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <WalletCard type="Cash" balance={stats.cashBalance} onUpdate={toggleRefresh} />
                    <WalletCard type="Online" balance={stats.onlineBalance} onUpdate={toggleRefresh} />
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp size={48} />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-2">Monthly Spend</h3>
                        <div className="text-3xl font-bold text-white">₹{stats.monthlySpending.toLocaleString()}</div>
                    </div>
                    <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 w-[60%]"></div>
                    </div>
                </div>

                <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertCircle size={48} />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-2">Daily Safe-Limit</h3>
                        <div className={`text-3xl font-bold ${stats.dailySafeToSpend < 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            ₹{Math.round(stats.dailySafeToSpend).toLocaleString()}
                        </div>
                    </div>
                    <p className="text-xs text-muted mt-2">Based on remaining budget</p>
                </div>

                <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingDown size={48} />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-2">Total Budget</h3>
                        <div className="text-3xl font-bold text-white">
                            ₹{stats.totalBudgetLimit.toLocaleString()}
                        </div>
                    </div>
                    <p className="text-xs text-muted mt-2">Allocated for {new Date().toLocaleString('default', { month: 'long' })}</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Spending Breakdown</h3>
                    <div className="h-64 flex justify-center relative">
                        {stats.categorySpending.length > 0 ? (
                            <>
                                <Pie data={pieData} options={pieOptions} />
                                {/* Center Text absolute */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-sm text-muted font-medium">Categories</span>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center text-muted">No expenses yet</div>
                        )}
                    </div>
                </div>
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Daily Trend</h3>
                    <div className="h-64">
                        {stats.dailySpending.length > 0 ? (
                            <Line options={commonOptions} data={lineData} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted">No data available</div>
                        )}
                    </div>
                </div>
            </div>


            {/* Recent Transactions */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Recent Activity</h3>
                <RecentTransactions limit={5} onUpdate={toggleRefresh} />
            </div>
        </div >
    );
};

const RecentTransactions = ({ limit, onUpdate }) => {
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        const fetchTx = async () => {
            try {
                const res = await axios.get('/api/transactions');
                const filtered = res.data.filter(t => t.category !== 'Balance Adjustment');
                setTransactions(filtered.slice(0, limit));
            } catch (err) { console.error(err); }
        };
        fetchTx();
    }, [limit, onUpdate]); // Re-fetch when dashboard refreshes

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this transaction?')) return;
        try {
            await axios.delete(`/api/transactions/${id}`);
            if (onUpdate) onUpdate();
        } catch (err) { alert('Failed to delete'); }
    };

    if (transactions.length === 0) return <div className="text-muted text-sm">No recent activity.</div>;

    return (
        <div className="space-y-4">
            {transactions.map(t => (
                <div key={t._id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {t.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                        </div>
                        <div>
                            <div className="font-medium text-white">{t.description || t.category}</div>
                            <div className="text-xs text-muted">
                                {new Date(t.date).toLocaleDateString()} • <span className="text-white/50">{t.source}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className={`font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                            {t.type === 'expense' ? '-' : '+'}₹{t.amount.toLocaleString()}
                        </span>
                        <button
                            onClick={() => handleDelete(t._id)}
                            className="p-2 text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete"
                        >
                            <AlertCircle size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Smart Advisor Component
const SmartAdvisor = () => {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const res = await axios.get('/api/insights');
                setInsights(res.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchInsights();
    }, []);

    if (loading) return null;
    if (insights.length === 0) return null;

    return (
        <div className="glass-card p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-amber-400">💡</span> Smart Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight, index) => (
                    <div key={index} className={`p-4 rounded-xl border flex items-start gap-4 ${insight.type === 'danger' ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' :
                        insight.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' :
                            insight.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' :
                                'bg-blue-500/10 border-blue-500/20 text-blue-200'
                        }`}>
                        <div className="mt-1">
                            {insight.type === 'danger' && <AlertCircle size={20} />}
                            {insight.type === 'warning' && <AlertCircle size={20} />}
                            {insight.type === 'success' && <TrendingUp size={20} />}
                            {insight.type === 'info' && <TrendingDown size={20} />}
                            {insight.type === 'neutral' && <TrendingUp size={20} />}
                        </div>
                        <div>
                            <h4 className="font-bold text-sm mb-1">{insight.title}</h4>
                            <p className="text-xs opacity-90 leading-relaxed">{insight.message}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
