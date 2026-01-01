import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pie, Line } from 'react-chartjs-2';

const Analytics = () => {
    const [stats, setStats] = useState(null);

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
    }, []);

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
                backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899'],
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

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Outfit', size: 12 } } },
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
        }
    };

    const pieOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'right', labels: { color: '#94a3b8', font: { family: 'Outfit', size: 12 } } },
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <header>
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">Deep Dive</h2>
                <p className="text-muted">Analyze your financial habits over time.</p>
            </header>

            {/* Summary Cards */}
            <div className="glass-card p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="text-xs text-muted uppercase tracking-wider mb-1">Total Expenses</div>
                        <div className="text-2xl font-bold text-rose-400">₹{stats.monthlySpending.toLocaleString()}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="text-xs text-muted uppercase tracking-wider mb-1">Total Assets</div>
                        <div className="text-2xl font-bold text-emerald-400">
                            ₹{(stats.cashBalance + stats.onlineBalance).toLocaleString()}
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="text-xs text-muted uppercase tracking-wider mb-1">Transactions</div>
                        <div className="text-2xl font-bold text-primary">
                            {/* Just for UI, don't have count from API yet, using placeholder or deriving? 
                                Actually let's assume crudely sum of budgets spent / avg? No.
                                Just hide if no data.
                             */}
                            --
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="text-xs text-muted uppercase tracking-wider mb-1">Budget Usage</div>
                        <div className="text-2xl font-bold text-amber-400">
                            {Math.round((stats.monthlySpending / stats.totalBudgetLimit) * 100) || 0}%
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Category Distribution</h3>
                    <div className="h-64 flex justify-center">
                        {stats.categorySpending.length > 0 ? (
                            <Pie data={pieData} options={pieOptions} />
                        ) : (
                            <div className="flex items-center text-muted">No data</div>
                        )}
                    </div>
                </div>

                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Spending Timeline</h3>
                    <div className="h-64 w-full">
                        {stats.dailySpending.length > 0 ? (
                            <Line data={lineData} options={options} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted">No data</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
