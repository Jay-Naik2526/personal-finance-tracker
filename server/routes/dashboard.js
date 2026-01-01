const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

router.get('/stats', auth, async (req, res) => {
    try {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 1);
        const userId = new mongoose.Types.ObjectId(req.user.id);

        // 1. Total Balance & Wallet breakdown
        const walletStats = await Transaction.aggregate([
            { $match: { user: userId } },
            {
                $group: {
                    _id: "$source",
                    totalIncome: {
                        $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] }
                    },
                    totalExpense: {
                        $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] }
                    }
                }
            }
        ]);

        let cashBalance = 0;
        let onlineBalance = 0;

        walletStats.forEach(stat => {
            const balance = stat.totalIncome - stat.totalExpense;
            if (stat._id === 'Cash') cashBalance = balance;
            if (stat._id === 'Online') onlineBalance = balance;
        });

        const totalBalance = cashBalance + onlineBalance;

        // 2. Monthly Spending
        const monthlySpendingAgg = await Transaction.aggregate([
            {
                $match: {
                    user: userId,
                    type: 'expense',
                    date: { $gte: startOfMonth, $lt: endOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);
        const monthlySpending = monthlySpendingAgg[0] ? monthlySpendingAgg[0].total : 0;

        // 3. Category Spending (Pie Chart)
        const categorySpending = await Transaction.aggregate([
            {
                $match: {
                    user: userId,
                    type: 'expense',
                    date: { $gte: startOfMonth, $lt: endOfMonth }
                }
            },
            {
                $group: {
                    _id: "$category",
                    total: { $sum: "$amount" }
                }
            }
        ]);

        // 4. Daily Spending Trend (Line Graph)
        const dailySpending = await Transaction.aggregate([
            {
                $match: {
                    user: userId,
                    type: 'expense',
                    date: { $gte: startOfMonth, $lt: endOfMonth }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    total: { $sum: "$amount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 5. Daily Safe-to-Spend
        // Sum of all budget limits for user
        const allBudgets = await Budget.find({ user: req.user.id });
        const totalBudgetLimit = allBudgets.reduce((acc, curr) => acc + curr.limit, 0);

        // Remaining budget for month
        const remainingBudget = Math.max(0, totalBudgetLimit - monthlySpending);

        // Days remaining in month
        const today = new Date();
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
        const daysRemaining = Math.max(1, lastDayOfMonth.getDate() - today.getDate() + 1); // +1 to include today

        const dailySafeToSpend = remainingBudget / daysRemaining;

        res.json({
            totalBalance,
            cashBalance,
            onlineBalance,
            monthlySpending,
            categorySpending,
            dailySpending,
            totalBudgetLimit,
            dailySafeToSpend
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
