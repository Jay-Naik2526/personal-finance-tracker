const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

// GET all budgets
router.get('/', auth, async (req, res) => {
    try {
        const budgets = await Budget.find({ user: req.user.id });
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const budgetsWithSpent = await Promise.all(budgets.map(async (budget) => {
            const spent = await Transaction.aggregate([
                {
                    $match: {
                        user: new mongoose.Types.ObjectId(req.user.id),
                        category: budget.category,
                        type: 'expense',
                        date: {
                            $gte: new Date(currentYear, currentMonth, 1),
                            $lt: new Date(currentYear, currentMonth + 1, 1)
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' }
                    }
                }
            ]);
            return { ...budget.toObject(), spent: spent[0] ? spent[0].total : 0 };
        }));

        res.json(budgetsWithSpent);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST/UPDATE budget
router.post('/', auth, async (req, res) => {
    const { category, limit } = req.body;
    try {
        let budget = await Budget.findOne({ category, user: req.user.id });
        if (budget) {
            budget.limit = limit;
            await budget.save();
        } else {
            budget = new Budget({ category, limit, user: req.user.id });
            await budget.save();
        }
        res.json(budget);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
