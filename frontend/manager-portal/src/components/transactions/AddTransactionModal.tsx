import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { transactionService, type CreateTransactionData, type ChartOfAccount } from '@/services/transactionService';

interface AddTransactionModalProps {
    onClose: () => void;
    onSubmit: (data: any) => void;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
    onClose,
    onSubmit,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);

    const [form, setForm] = useState<CreateTransactionData>({
        date: new Date().toISOString().slice(0, 10),
        description: '',
        reference: '',
        type: 'payment',
        amount: '',
        accountId: '',
        contraAccountId: '',
        notes: '',
    });

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const data = await transactionService.getAccounts();
                setAccounts(data);
            } catch (err) {
                console.error("Failed to fetch accounts", err);
                setError("Failed to load accounts. Please try again.");
            }
        };
        fetchAccounts();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (name: string, value: string) => {
        setForm({ ...form, [name]: value });
    };

    const validate = () => {
        if (!form.date) return 'Date is required';
        if (!form.description.trim()) return 'Description is required';
        if (!form.amount || parseFloat(form.amount) <= 0) return 'Amount must be greater than 0';
        if (!form.accountId) return 'Please select a category account';
        if (!form.contraAccountId) return 'Please select a payment account';
        if (form.accountId === form.contraAccountId) return 'Source and destination accounts cannot be the same';
        return '';
    };

    const handleSave = async () => {
        const err = validate();
        if (err) {
            setError(err);
            return;
        }
        setLoading(true);
        setError('');
        try {
            await transactionService.createTransaction(form);
            onSubmit(form);
        } catch (e: any) {
            setError(e.response?.data?.message || 'Failed to create transaction');
        } finally {
            setLoading(false);
        }
    };

    // Filter accounts based on type if needed, or just show all
    // Ideally: 
    // For Payment: contra should be Asset (Cash/Bank), account should be Expense/Liability
    // For Receipt: contra should be Asset, account should be Revenue/Equity

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>New Transaction</DialogTitle>
                    <DialogDescription>
                        Create a double-entry transaction.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date *</Label>
                            <Input
                                id="date"
                                name="date"
                                type="date"
                                value={form.date}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select
                                value={form.type}
                                onValueChange={(v) => handleSelectChange('type', v)}
                            >
                                <SelectTrigger id="type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="payment">Payment (Expense)</SelectItem>
                                    <SelectItem value="receipt">Receipt (Income)</SelectItem>
                                    <SelectItem value="transfer">Transfer</SelectItem>
                                    <SelectItem value="journal">Journal Entry</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Input
                            id="description"
                            name="description"
                            placeholder="e.g. Office rent payment"
                            value={form.description}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="accountId">
                                {form.type === 'payment' ? 'Expense/Category' :
                                    form.type === 'receipt' ? 'Income source' : 'Account'} *
                            </Label>
                            <Select
                                value={form.accountId}
                                onValueChange={(v) => handleSelectChange('accountId', v)}
                            >
                                <SelectTrigger id="accountId">
                                    <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts
                                        .filter(acc => {
                                            if (form.type === 'payment') return ['expense', 'liability'].includes(acc.type);
                                            if (form.type === 'receipt') return ['revenue', 'equity'].includes(acc.type);
                                            return true;
                                        })
                                        .map((acc) => (
                                            <SelectItem key={acc.id} value={acc.id}>
                                                {acc.code} - {acc.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contraAccountId">
                                {form.type === 'payment' ? 'Paid From (Cash/Bank)' :
                                    form.type === 'receipt' ? 'Deposit To (Cash/Bank)' : 'Offset Account'} *
                            </Label>
                            <Select
                                value={form.contraAccountId}
                                onValueChange={(v) => handleSelectChange('contraAccountId', v)}
                            >
                                <SelectTrigger id="contraAccountId">
                                    <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts
                                        .filter(acc => {
                                            if (form.type === 'payment' || form.type === 'receipt') return ['asset', 'liability'].includes(acc.type);
                                            return true;
                                        })
                                        .map((acc) => (
                                            <SelectItem key={acc.id} value={acc.id}>
                                                {acc.code} - {acc.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount *</Label>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={form.amount}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reference">Reference</Label>
                            <Input
                                id="reference"
                                name="reference"
                                placeholder="e.g. INV-001"
                                value={form.reference}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Input
                            id="notes"
                            name="notes"
                            placeholder="Optional notes..."
                            value={form.notes}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Transaction'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AddTransactionModal;
