
import React, { useEffect, useState } from 'react';
import { getHolidays, createHoliday, deleteHoliday } from '../../services/overtimeService';

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
        <div className="space-y-6">

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
        </div>
    );
};

export default Holidays;
