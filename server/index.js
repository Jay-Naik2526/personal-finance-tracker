const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-tracker')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budgets');
const debtRoutes = require('./routes/debts');
const dashboardRoutes = require('./routes/dashboard');

app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => res.send('API Running'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/debts', require('./routes/debts'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/recurring', require('./routes/recurring'));
app.use('/api/savings', require('./routes/savings'));
app.use('/api/insights', require('./routes/insights'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
