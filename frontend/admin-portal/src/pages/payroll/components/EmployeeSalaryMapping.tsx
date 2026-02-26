import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

interface User { id: string; name: string; email: string; }
interface SalaryComponent { id: string; name: string; calculationType: string; }

export default function EmployeeSalaryMapping({ employees }: { employees: User[] }) {
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [mappings, setMappings] = useState<any[]>([]);
    const [availableComponents, setAvailableComponents] = useState<SalaryComponent[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Form states for overriding defaults
    const [newCompId, setNewCompId] = useState('');
    const [newOverrideValue, setNewOverrideValue] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const loadPlatformComponents = async () => {
        try {
            const res = await axios.get(`${API_URL}/payroll/components`, { headers: getAuthHeader() });
            setAvailableComponents(res.data.filter((c: any) => c.isActive));
        } catch { /* skip */ }
    };

    const loadUserMappings = useCallback(async (userId: string) => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_URL}/payroll/mappings/${userId}`, { headers: getAuthHeader() });
            setMappings(res.data);
        } catch {
            toast.error('Failed to load user salary structure');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadPlatformComponents(); }, []);
    useEffect(() => {
        if (selectedUser) loadUserMappings(selectedUser);
        else setMappings([]);
    }, [selectedUser, loadUserMappings]);

    const handleAssign = async () => {
        if (!selectedUser || !newCompId) return;
        setIsSaving(true);
        try {
            await axios.post(`${API_URL}/payroll/mappings/${selectedUser}`, {
                componentId: newCompId,
                amount: newOverrideValue || null, // send null to use platform default
            }, { headers: getAuthHeader() });
            toast.success('Salary component mapped to employee');
            loadUserMappings(selectedUser);
            setNewCompId('');
            setNewOverrideValue('');
        } catch {
            toast.error('Failed to assign component');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemove = async (mappingId: string) => {
        try {
            await axios.delete(`${API_URL}/payroll/mappings/entry/${mappingId}`, { headers: getAuthHeader() });
            toast.success('Mapping removed');
            loadUserMappings(selectedUser);
        } catch {
            toast.error('Failed to remove mapping');
        }
    };

    return (
        <div className="bg-surface rounded-xl border border-border p-5">
            <h3 className="text-lg font-semibold text-text-primary mb-1">Employee Salary Overrides</h3>
            <p className="text-sm text-text-secondary mb-6">Assign specific allowances or deductions directly to employees.</p>

            <div className="max-w-md mb-6 space-y-2">
                <label className="text-sm font-medium text-text-primary">Select Employee</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger><SelectValue placeholder="Search employee..." /></SelectTrigger>
                    <SelectContent>
                        {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name} ({e.email})</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {selectedUser && (
                <div className="animate-fade-in border rounded-lg border-border p-4 bg-background/50">
                    <h4 className="font-medium mb-3 text-text-primary">Configured Components</h4>

                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin my-4 mx-auto text-text-secondary" /> : (
                        <div className="space-y-3 mb-6">
                            {mappings.map(map => (
                                <div key={map.id} className="flex items-center justify-between p-3 bg-surface border border-border rounded-md">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">{map.componentName}</span>
                                        <span className="text-xs text-text-secondary">
                                            {map.amount ? `Custom Override: ${map.calculationType === 'Fixed' ? '$' : ''}${map.amount}${map.calculationType === 'PercentageOfBase' ? '%' : ''}`
                                                : `Using Default: ${map.calculationType === 'Fixed' ? '$' : ''}${map.defaultAmount}${map.calculationType === 'PercentageOfBase' ? '%' : ''}`}
                                        </span>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemove(map.id)}>
                                        <X className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                            {mappings.length === 0 && <p className="text-sm text-text-secondary text-center py-4">No specific components mapped to this employee.</p>}
                        </div>
                    )}

                    <div className="border-t border-border pt-4">
                        <h4 className="text-sm font-medium mb-3">Add / Override Component</h4>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Select value={newCompId} onValueChange={setNewCompId}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Choose component..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableComponents.filter(c => !mappings.find(m => m.componentId === c.id)).map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Input
                                placeholder="Custom amount (optional)..."
                                type="number"
                                className="w-full sm:w-48"
                                value={newOverrideValue}
                                onChange={e => setNewOverrideValue(e.target.value)}
                            />

                            <Button onClick={handleAssign} disabled={isSaving || !newCompId}>
                                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />} Assign
                            </Button>
                        </div>
                        <p className="text-xs text-text-secondary mt-2">Leave amount blank to use the generic platform default value.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
