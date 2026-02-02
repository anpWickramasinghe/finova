
import React, { useEffect, useState } from 'react';
import { getOvertimeSettings, updateOvertimeSettings } from '../../services/overtimeService';
import Holidays from './Holidays';
import { cn } from "@/lib/utils";

const OvertimeSettings = () => {
    const [activeTab, setActiveTab] = useState('general');

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Overtime Settings</h1>

            {/* Tabs */}
            <div className="flex space-x-1 border-b">
                <button
                    onClick={() => setActiveTab('general')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'general'
                            ? "border-indigo-600 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    )}
                >
                    General Configuration
                </button>
                <button
                    onClick={() => setActiveTab('holidays')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'holidays'
                            ? "border-indigo-600 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    )}
                >
                    Holidays
                </button>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === 'general' && <GeneralSettings />}
                {activeTab === 'holidays' && <Holidays />}
            </div>
        </div >
    );
};

const GeneralSettings = () => {
    const [settings, setSettings] = useState({
        minOvertimeMinutes: 30,
        weekdayMultiplier: 1.25,
        weekendMultiplier: 2.0,
        holidayMultiplier: 2.0
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await getOvertimeSettings();
            if (data && data.minOvertimeMinutes) {
                setSettings({
                    minOvertimeMinutes: Number(data.minOvertimeMinutes),
                    weekdayMultiplier: Number(data.weekdayMultiplier),
                    weekendMultiplier: Number(data.weekendMultiplier),
                    holidayMultiplier: Number(data.holidayMultiplier)
                });
            }
        } catch (error) {
            console.error('Failed to fetch settings', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings({ ...settings, [e.target.name]: Number(e.target.value) });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            await updateOvertimeSettings(settings);
            setMessage('Settings updated successfully!');
        } catch (error) {
            setMessage('Failed to update settings.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-lg">
            <h2 className="text-lg font-semibold mb-4">Thresholds & Rates</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Minimum Overtime Threshold (Minutes)</label>
                    <input
                        type="number"
                        name="minOvertimeMinutes"
                        value={settings.minOvertimeMinutes}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    />
                    <p className="text-xs text-gray-500 mt-1">Overtime less than this amount will be ignored.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Weekday Multiplier</label>
                    <input
                        type="number"
                        step="0.01"
                        name="weekdayMultiplier"
                        value={settings.weekdayMultiplier}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Weekend Multiplier</label>
                    <input
                        type="number"
                        step="0.01"
                        name="weekendMultiplier"
                        value={settings.weekendMultiplier}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Holiday Multiplier</label>
                    <input
                        type="number"
                        step="0.01"
                        name="holidayMultiplier"
                        value={settings.holidayMultiplier}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
            {message && <p className={`mt-4 text-center text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
        </div>
    );
};

export default OvertimeSettings;
