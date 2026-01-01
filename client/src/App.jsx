import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import AddTransaction from './components/AddTransaction';
import BudgetList from './components/BudgetList';
import Subscriptions from './components/Subscriptions';
import SavingsJars from './components/SavingsJars';
import SplitBill from './components/SplitBill';
import Wishlist from './components/Wishlist';
import Analytics from './components/Analytics';
import DebtTracker from './components/DebtTracker';
import Reports from './components/Reports';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import PrivateRoute from './components/routing/PrivateRoute';
import { AuthProvider } from './context/AuthContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {!isAuthPage && <Navbar />}
      <main className={`flex-1 p-4 md:p-8 pb-32 md:pb-8 w-full ${!isAuthPage ? 'max-w-7xl mx-auto' : ''}`}>
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/add" element={<PrivateRoute><AddTransaction /></PrivateRoute>} />
            <Route path="/budgets" element={<PrivateRoute><BudgetList /></PrivateRoute>} />
            <Route path="/savings" element={<PrivateRoute><SavingsJars /></PrivateRoute>} />
            <Route path="/split" element={<PrivateRoute><SplitBill /></PrivateRoute>} />
            <Route path="/wishlist" element={<PrivateRoute><Wishlist /></PrivateRoute>} />
            <Route path="/subscriptions" element={<PrivateRoute><Subscriptions /></PrivateRoute>} />
            <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
            <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
            <Route path="/debts" element={<PrivateRoute><DebtTracker /></PrivateRoute>} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
