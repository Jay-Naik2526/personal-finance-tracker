const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const SavingsGoal = require('../models/SavingsGoal');
const Transaction = require('../models/Transaction');

// GET all jars
router.get('/', auth, async (req, res) => {
    try {
        const jars = await SavingsGoal.find({ user: req.user.id });
        res.json(jars);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST new jar
router.post('/', auth, async (req, res) => {
    try {
        const newJar = new SavingsGoal({ ...req.body, user: req.user.id });
        const savedJar = await newJar.save();
        res.json(savedJar);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT add/remove money from jar
// When we add money to a jar, we should probably record it as a 'transfer' or 'expense' in transactions?
// For now, let's keep it simple: It just updates the jar. 
// Ideally, "saving" means moving from Cash/Online -> Jar.
// OPTIONAL: Create a corresponding transaction to deduct from Wallet.
router.patch('/:id/add', auth, async (req, res) => {
    const { amount, source } = req.body; // Positive to add, negative to withdraw, source = 'Cash'/'Online'

    // Validate source if provided
    const validSources = ['Cash', 'Online'];
    const walletSource = validSources.includes(source) ? source : 'Online';

    try {
        const jar = await SavingsGoal.findOne({ _id: req.params.id, user: req.user.id });
        if (!jar) return res.status(404).json({ msg: 'Jar not found' });

        const numAmount = Number(amount);
        jar.currentAmount += numAmount;
        await jar.save();

        // Create corresponding transaction
        // If adding to jar (positive) -> Expense from Wallet
        // If withdrawing from jar (negative) -> Income to Wallet
        const transaction = new Transaction({
            user: req.user.id,
            amount: Math.abs(numAmount),
            type: numAmount > 0 ? 'expense' : 'income',
            category: 'Savings',
            source: walletSource,
            description: numAmount > 0 ? `Saved to ${jar.name}` : `Withdrew from ${jar.name}`,
            date: new Date()
        });
        await transaction.save();

        res.json(jar);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE jar
router.delete('/:id', auth, async (req, res) => {
    try {
        await SavingsGoal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        res.json({ msg: 'Jar smashed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
