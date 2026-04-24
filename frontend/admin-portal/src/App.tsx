import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/dashboard';
import Transactions from './pages/transactions';
import TransactionReporting from './pages/transactions/reporting';
import UserManagement from './pages/user-management';
import BranchManagement from './pages/branch-management';
import Layout from './components/Layout';
import Payroll from './pages/payroll';
import SupportChat from './pages/chat';
import Configuration from './pages/configuration/Configuration';
import FinancialReports from './pages/reports/FinancialReports';
import PayrollReports from './pages/reports/PayrollReports';
import HrReports from './pages/reports/HrReports';
import React, { useContext } from 'react';

const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
  const auth = useContext(AuthContext);
  if (auth?.loading) return <div>Loading...</div>;
  return auth?.user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions-management" element={<Transactions />} />
            <Route path="/transactions-management/reporting" element={<TransactionReporting />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/branch-management" element={<BranchManagement />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/support-chat" element={<SupportChat />} />
            <Route path="/configuration" element={<Configuration />} />
            <Route path="/financial-reports" element={<FinancialReports />} />
            <Route path="/payroll-reports" element={<PayrollReports />} />
            <Route path="/hr-reports" element={<HrReports />} />
          
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
