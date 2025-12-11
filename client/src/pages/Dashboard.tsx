import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
    const auth = useContext(AuthContext);

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-4">Welcome, {auth?.user?.email}</p>
            <p className="mt-2">Role: {auth?.user?.role}</p>
            <button
                onClick={auth?.logout}
                className="px-4 py-2 mt-4 text-white bg-red-500 rounded hover:bg-red-700"
            >
                Logout
            </button>
        </div>
    );
};

export default Dashboard;
