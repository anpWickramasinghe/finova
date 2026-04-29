import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/dashboard';
import Transactions from './pages/transactions';
import TransactionReporting from './pages/transactions/reporting';
import Layout from './components/Layout';

import React, { useContext } from 'react';
import Attendance from './pages/attendance';
import LeaveManagementPage from './pages/leaves';
import UserManagement from './pages/user-management';
import Chat from './pages/chat';
import FinancialReports from './pages/financial-reports';

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
            <Route path="/transactions-management/reports" element={<TransactionReporting />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/leaves" element={<LeaveManagementPage />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/support-chat" element={<Chat />} />
            <Route path="/financial-reports" element={<FinancialReports />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
