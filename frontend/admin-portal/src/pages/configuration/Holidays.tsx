/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from 'react';
import { getHolidays, createHoliday, deleteHoliday, syncHolidays } from '../../services/overtimeService';

interface Holiday {
    id: string;
    date: string;
    name: string;
    description: string;
}

const Holidays = () => {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [newHoliday, setNewHoliday] = useState({ date: '', name: '', description: '' });
    const [loading, setLoading] = useState(false);

    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [syncParams, setSyncParams] = useState({ year: new Date().getFullYear(), country: 'LK', apiKey: '' });
    const [syncLoading, setSyncLoading] = useState(false);

    useEffect(() => {
        fetchHolidays();
    }, []);

    const fetchHolidays = async () => {
        try {
            const data = await getHolidays();
            setHolidays(data);
        } catch (error) {
            console.error('Failed to fetch holidays', error);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createHoliday(newHoliday);
            setNewHoliday({ date: '', name: '', description: '' });
            fetchHolidays();
        } catch (error) {
            console.error('Failed to create holiday', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async (e: React.FormEvent) => {
        e.preventDefault();
        setSyncLoading(true);
        try {
            const res = await syncHolidays(syncParams);
            alert(res.message);
            setIsSyncModalOpen(false);
            fetchHolidays();
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Sync failed');
        } finally {
            setSyncLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this holiday?')) return;
        try {
            await deleteHoliday(id);
            fetchHolidays();
        } catch (error) {
            console.error('Failed to delete holiday', error);
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-end">
                <button
                    onClick={() => setIsSyncModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sync with Calendarific
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form */}
                <div className="bg-white p-6 rounded-lg shadow-md h-fit">
                    <h2 className="text-lg font-semibold mb-4">Add New Holiday</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date</label>
                            <input
                                type="date"
                                required
                                value={newHoliday.date}
                                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Independence Day"
                                value={newHoliday.name}
                                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                value={newHoliday.description}
                                onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add Holiday'}
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-4">Upcoming Holidays</h2>
                    <div className="overflow-auto max-h-96">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {holidays.map((holiday) => (
                                    <tr key={holiday.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(holiday.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{holiday.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDelete(holiday.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {holidays.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">No holidays found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Sync Modal */}
            {isSyncModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Sync Holidays</h3>
                            <button onClick={() => setIsSyncModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSync} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Year</label>
                                <input
                                    type="number"
                                    required
                                    value={syncParams.year}
                                    onChange={(e) => setSyncParams({ ...syncParams, year: Number(e.target.value) })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Country Code (ISO-3166)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. US, LK, GB"
                                    value={syncParams.country}
                                    onChange={(e) => setSyncParams({ ...syncParams, country: e.target.value.toUpperCase() })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    <a href="https://calendarific.com/supported-countries" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                        View supported countries
                                    </a>
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">API Key (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="Leave empty if configured on server"
                                    value={syncParams.apiKey}
                                    onChange={(e) => setSyncParams({ ...syncParams, apiKey: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                />
                            </div>
                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsSyncModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={syncLoading}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {syncLoading ? 'Syncing...' : 'Sync Now'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>

    );
};

export default Holidays;
