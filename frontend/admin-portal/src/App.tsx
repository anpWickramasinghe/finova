import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/dashboard';
import Transactions from './pages/transactions';
import Layout from './components/Layout';

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
          <Route element={<Layout />}>
            <Route
              path="/dashboard"
              element={
                // <PrivateRoute>
                <Dashboard />
                // </PrivateRoute>
              }
            />
            <Route
              path="/transactions-management"
              element={
                // <PrivateRoute>
                <Transactions />
                // </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
