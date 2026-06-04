const mongoose = require('mongoose');

const DebtSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    person: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        enum: ['owed_to', 'owed_by'], // owed_to = I owe them, owed_by = They owe me
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'settled'],
        default: 'pending',
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Debt', DebtSchema);
