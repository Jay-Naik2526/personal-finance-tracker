const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Debt = require('../models/Debt');
const Transaction = require('../models/Transaction');

// GET all debts
router.get('/', auth, async (req, res) => {
    try {
        const debts = await Debt.find({ user: req.user.id }).sort({ status: 1, date: -1 }); // Pending first
        res.json(debts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST new debt
router.post('/', auth, async (req, res) => {
    const debt = new Debt({
        user: req.user.id,
        person: req.body.person,
        amount: req.body.amount,
        type: req.body.type,
        status: req.body.status || 'pending',
    });

    try {
        const newDebt = await debt.save();
        res.status(201).json(newDebt);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PATCH update status (settle)
router.patch('/:id', auth, async (req, res) => {
    try {
        const debt = await Debt.findOne({ _id: req.params.id, user: req.user.id });
        if (!debt) return res.status(404).json({ msg: 'Debt not found' });

        if (req.body.status) {
            debt.status = req.body.status;
        }
        const updatedDebt = await debt.save();

        // Log a transaction automatically if requested on settlement
        if (req.body.status === 'settled' && req.body.recordTransaction) {
            const transaction = new Transaction({
                user: req.user.id,
                amount: debt.amount,
                type: debt.type === 'owed_by' ? 'income' : 'expense',
                category: 'Debt Settlement',
                source: req.body.paymentSource || 'Online',
                description: debt.type === 'owed_by' 
                    ? `Settled: ${debt.person} paid you` 
                    : `Settled: You paid ${debt.person}`,
                date: new Date()
            });
            await transaction.save();
        }

        res.json(updatedDebt);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE debt
router.delete('/:id', auth, async (req, res) => {
    try {
        // Find and delete ensuring user owns it
        const debt = await Debt.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!debt) return res.status(404).json({ msg: 'Debt not found' });

        res.json({ message: 'Debt deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// BATCH CREATE debts (Split the Bill)
router.post('/batch', auth, async (req, res) => {
    try {
        const { debts } = req.body; // Array of debt objects
        if (!debts || !Array.isArray(debts)) {
            return res.status(400).json({ message: 'Invalid data format' });
        }

        const newDebts = debts.map(debt => ({
            ...debt,
            user: req.user.id
        }));

        await Debt.insertMany(newDebts);
        res.status(201).json({ message: 'Debts created successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// POST simplify/consolidate duplicate debts
router.post('/simplify', auth, async (req, res) => {
    try {
        // 1. Fetch all pending debts for this user
        const pendingDebts = await Debt.find({ user: req.user.id, status: 'pending' });
        
        // 2. Group by person and compute net amount (positive means owed_by user, negative means owed_to user)
        const netBalances = {};
        pendingDebts.forEach(d => {
            const amt = d.amount;
            const multiplier = d.type === 'owed_by' ? 1 : -1;
            if (!netBalances[d.person]) {
                netBalances[d.person] = 0;
            }
            netBalances[d.person] += amt * multiplier;
        });

        const peopleToSimplify = Object.keys(netBalances);
        
        if (peopleToSimplify.length > 0) {
            // Delete all current pending debts for these people
            await Debt.deleteMany({
                user: req.user.id,
                status: 'pending',
                person: { $in: peopleToSimplify }
            });

            // Prepare new consolidated debts
            const consolidatedDebts = [];
            Object.entries(netBalances).forEach(([person, net]) => {
                const roundedNet = Math.round(net * 100) / 100;
                if (roundedNet > 0.01) {
                    consolidatedDebts.push({
                        user: req.user.id,
                        person,
                        amount: roundedNet,
                        type: 'owed_by',
                        status: 'pending'
                    });
                } else if (roundedNet < -0.01) {
                    consolidatedDebts.push({
                        user: req.user.id,
                        person,
                        amount: -roundedNet,
                        type: 'owed_to',
                        status: 'pending'
                    });
                }
            });

            if (consolidatedDebts.length > 0) {
                await Debt.insertMany(consolidatedDebts);
            }
        }

        // Return updated list of all debts
        const debts = await Debt.find({ user: req.user.id }).sort({ status: 1, date: -1 });
        res.json(debts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
