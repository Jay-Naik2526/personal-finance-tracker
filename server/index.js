const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Datab// Database Connection (Cached for Serverless)
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const io = {
            bufferCommands: false, // Disable Mongoose buffering
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        cached.promise = mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-tracker', io).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
        console.log('MongoDB Connected (Cached)');
    } catch (e) {
        cached.promise = null;
        console.error('MongoDB Connection Error:', e);
        throw e;
    }

    return cached.conn;
};

// Connect
connectDB();

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
