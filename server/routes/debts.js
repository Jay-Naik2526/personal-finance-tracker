const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Debt = require('../models/Debt');

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

module.exports = router;
