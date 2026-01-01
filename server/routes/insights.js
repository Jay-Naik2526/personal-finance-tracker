const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

// GET generated insights
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const insights = [];
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // 1. Fetch Data
        const monthlyTransactions = await Transaction.find({
            user: userId,
            date: { $gte: startOfMonth },
            type: 'expense'
        });
        const allBudgets = await Budget.find({ user: userId });

        // Calculate totals
        const totalSpent = monthlyTransactions.reduce((acc, t) => acc + t.amount, 0);
        const totalBudget = allBudgets.reduce((acc, b) => acc + b.limit, 0);

        // --- RULE ENGINE ---

        // Rule 1: Budget Health
        if (totalBudget > 0) {
            const percentageUsed = (totalSpent / totalBudget) * 100;
            if (percentageUsed > 90) {
                insights.push({
                    type: 'danger',
                    icon: 'AlertTriangle',
                    title: 'Critical Budget Alert',
                    message: `You've used ${Math.round(percentageUsed)}% of your monthly budget. Slow down!`
                });
            } else if (percentageUsed > 75) {
                insights.push({
                    type: 'warning',
                    icon: 'AlertCircle',
                    title: 'Approaching Limit',
                    message: `You've spent ${Math.round(percentageUsed)}% of your budget. Keep an eye on expenses.`
                });
            } else if (percentageUsed < 30 && today.getDate() > 20) {
                insights.push({
                    type: 'success',
                    icon: 'ThumbsUp',
                    title: 'Great Savings!',
                    message: `It's late in the month and you've only spent ${Math.round(percentageUsed)}%. You're doing great!`
                });
            }
        }

        // Rule 2: Category Spikes
        const categoryTotals = {};
        monthlyTransactions.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

        for (const [cat, amount] of Object.entries(categoryTotals)) {
            // Find corresponding budget
            const budget = allBudgets.find(b => b.category === cat);
            if (budget && amount > budget.limit) {
                insights.push({
                    type: 'danger',
                    icon: 'TrendingUp',
                    title: `Overspent on ${cat}`,
                    message: `You've exceeded your ${cat} limit by ₹${amount - budget.limit}.`
                });
            }
        }

        // Rule 3: High Value Transactions
        const highValueTx = monthlyTransactions.find(t => t.amount > 5000);
        if (highValueTx) {
            insights.push({
                type: 'info',
                icon: 'Info',
                title: 'Big Purchase Detected',
                message: `You spent ₹${highValueTx.amount} on ${highValueTx.category} recently. Was this planned?`
            });
        }

        // Fallback if no specific insights
        if (insights.length === 0) {
            insights.push({
                type: 'neutral',
                icon: 'Sparkles',
                title: 'Financial Health',
                message: "Your spending looks stable right now. Keep tracking!"
            });
        }

        res.json(insights);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
