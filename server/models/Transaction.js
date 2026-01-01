const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true,
    },
    category: {
        type: String, // e.g., 'Canteen', 'Subscriptions', 'Social', 'Academics'
        required: true,
    },
    source: {
        type: String,
        enum: ['Cash', 'Online'],
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    description: {
        type: String, // Merchant or details
        default: '',
    },
});

module.exports = mongoose.model('Transaction', TransactionSchema);
