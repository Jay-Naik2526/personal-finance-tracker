const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Recurring = require('../models/Recurring');

// GET all subscriptions
router.get('/', auth, async (req, res) => {
    try {
        const subs = await Recurring.find({ user: req.user.id }).sort({ billingDate: 1 });
        res.json(subs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST new subscription
router.post('/', auth, async (req, res) => {
    try {
        const newSub = new Recurring({
            ...req.body,
            user: req.user.id
        });
        const savedSub = await newSub.save();
        res.json(savedSub);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE subscription
router.delete('/:id', auth, async (req, res) => {
    try {
        const sub = await Recurring.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!sub) return res.status(404).json({ msg: 'Subscription not found' });
        res.json({ msg: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
