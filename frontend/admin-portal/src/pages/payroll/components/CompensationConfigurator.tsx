/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

interface SalaryComponent {
    id: string;
    name: string;
    type: 'Earning' | 'Deduction' | 'Statutory';
    calculationType: 'Fixed' | 'PercentageOfBase';
    defaultAmount: string;
    isActive: boolean;
}

export default function CompensationConfigurator() {
    const [components, setComponents] = useState<SalaryComponent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [openAdd, setOpenAdd] = useState(false);
    const [editing, setEditing] = useState<SalaryComponent | null>(null);

    const [form, setForm] = useState({
        name: '',
        type: 'Earning',
        calculationType: 'Fixed',
        defaultAmount: '',
        isActive: true
    });

    const fetchComponents = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_URL}/payroll/components`, { headers: getAuthHeader() });
            setComponents(res.data);
        } catch {
            toast.error('Failed to load salary components');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchComponents(); }, [fetchComponents]);

    const handleSave = async () => {
        if (!form.name || !form.type || !form.calculationType) {
            toast.error('Please fill required fields');
            return;
        }

        setIsSaving(true);
        try {
            if (editing) {
                await axios.put(`${API_URL}/payroll/components/${editing.id}`, form, { headers: getAuthHeader() });
                toast.success('Updated successfully');
            } else {
                await axios.post(`${API_URL}/payroll/components`, form, { headers: getAuthHeader() });
                toast.success('Added successfully');
            }
            setOpenAdd(false);
            setEditing(null);
            fetchComponents();
        } catch {
            toast.error('Failed to save component');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Deactivate this component?')) return;
        try {
            await axios.delete(`${API_URL}/payroll/components/${id}`, { headers: getAuthHeader() });
            toast.success('Component removed');
            fetchComponents();
        } catch {
            toast.error('Failed to remove component');
        }
    };

    const openEdit = (comp: SalaryComponent) => {
        setEditing(comp);
        setForm({
            name: comp.name,
            type: comp.type,
            calculationType: comp.calculationType,
            defaultAmount: comp.defaultAmount,
            isActive: comp.isActive
        });
        setOpenAdd(true);
    };

    return (
        <div className="bg-surface rounded-xl border border-border p-5">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-text-primary">Compensation Configurator</h3>
                    <p className="text-sm text-text-secondary">Define earnings, allowances, and statutory deductions for the company.</p>
                </div>
                <Button onClick={() => { setEditing(null); setForm({ name: '', type: 'Earning', calculationType: 'Fixed', defaultAmount: '', isActive: true }); setOpenAdd(true); }}>
                    <Plus className="h-4 w-4 mr-2" /> Add Component
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-text-secondary" /></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-fulltext-sm text-left align-middle border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-background/50">
                                <th className="p-3 font-medium text-text-secondary">Name</th>
                                <th className="p-3 font-medium text-text-secondary">Type</th>
                                <th className="p-3 font-medium text-text-secondary">Calculated As</th>
                                <th className="p-3 font-medium text-text-secondary">Default Value</th>
                                <th className="p-3 font-medium text-text-secondary">Status</th>
                                <th className="p-3 font-medium text-text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {components.map(comp => (
                                <tr key={comp.id} className="hover:bg-background transition-colors">
                                    <td className="p-3 font-medium text-text-primary">{comp.name}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${comp.type === 'Earning' ? 'bg-green-100 text-green-700' :
                                                comp.type === 'Deduction' ? 'bg-red-100 text-red-700' :
                                                    'bg-purple-100 text-purple-700'
                                            }`}>
                                            {comp.type}
                                        </span>
                                    </td>
                                    <td className="p-3 text-text-secondary">
                                        {comp.calculationType === 'Fixed' ? 'Fixed Amount' : '% of Base Salary'}
                                    </td>
                                    <td className="p-3 text-text-primary">
                                        {comp.calculationType === 'Fixed' ? `$${comp.defaultAmount}` : `${comp.defaultAmount}%`}
                                    </td>
                                    <td className="p-3">
                                        {comp.isActive ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                                    </td>
                                    <td className="p-3 text-right">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(comp)}>
                                            <Edit2 className="h-4 w-4 text-text-secondary hover:text-primary transition-colors" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(comp.id)}>
                                            <Trash2 className="h-4 w-4 text-red-400 hover:text-red-500 transition-colors" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {components.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-text-secondary">No salary components defined yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit' : 'Add'} Component</DialogTitle>
                        <DialogDescription>Define a new line item format for payslips.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-1.5">
                            <Label>Component Name</Label>
                            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Housing Allowance" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Type</Label>
                            <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Earning">Earning (Addition)</SelectItem>
                                    <SelectItem value="Deduction">Deduction (Subtraction)</SelectItem>
                                    <SelectItem value="Statutory">Statutory Deduction (Tax/EPF)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Calculation Format</Label>
                            <Select value={form.calculationType} onValueChange={(v: any) => setForm({ ...form, calculationType: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Fixed">Fixed Amount ($)</SelectItem>
                                    <SelectItem value="PercentageOfBase">Percentage (%) of Base Salary</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Default Value</Label>
                            <Input type="number" step="0.01" value={form.defaultAmount} onChange={e => setForm({ ...form, defaultAmount: e.target.value })} placeholder={form.calculationType === 'Fixed' ? '0.00' : '5.0'} />
                            <p className="text-xs text-text-secondary pt-1">This will be applied to all employees by default unless overridden.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenAdd(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null} Save Data
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
