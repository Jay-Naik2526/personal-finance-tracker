const mongoose = require('mongoose');

const RecurringSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true
    },
    category: {
        type: String,
        default: 'Orher'
    },
    billingDate: {
        type: Number, // Day of month (1-31)
        required: true
    },
    frequency: {
        type: String,
        default: 'Monthly'
    },
    lastPaid: {
        type: Date
    }
});

module.exports = mongoose.model('Recurring', RecurringSchema);
