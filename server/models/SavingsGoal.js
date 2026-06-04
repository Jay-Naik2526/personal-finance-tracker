const mongoose = require('mongoose');

const SavingsGoalSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    targetAmount: {
        type: Number,
        required: true
    },
    currentAmount: {
        type: Number,
        default: 0
    },
    emoji: {
        type: String,
        default: '💰'
    },
    color: {
        type: String, // Hex or Tailwind code
        default: 'from-blue-500 to-cyan-500'
    }
});

module.exports = mongoose.model('SavingsGoal', SavingsGoalSchema);
