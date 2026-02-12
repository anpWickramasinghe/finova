import React, { useState } from 'react';
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
import { Textarea } from "@/components/ui/textarea";

interface AddTransactionModalProps {
    onClose: () => void;
    onSubmit: (data: any) => void;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
    onClose,
    onSubmit,
}) => {
    const [formData, setFormData] = useState({
        date: '',
        description: '',
        amount: '',
        type: 'expense',
        category: '',
        account: '',
        reference: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add New Transaction</DialogTitle>
                    <DialogDescription>
                        Enter the details of the new transaction here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    name="date"
                                    type="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="amount">Amount</Label>
                                <Input
                                    id="amount"
                                    name="amount"
                                    type="number"
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                name="description"
                                placeholder="Transaction description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="type">Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => handleSelectChange('type', value)}
                                >
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="income">Income</SelectItem>
                                        <SelectItem value="expense">Expense</SelectItem>
                                        <SelectItem value="asset">Asset</SelectItem>
                                        <SelectItem value="liability">Liability</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => handleSelectChange('category', value)}
                                >
                                    <SelectTrigger id="category">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="operating">Operating Expenses</SelectItem>
                                        <SelectItem value="revenue">Revenue</SelectItem>
                                        <SelectItem value="financial">Financial Expenses</SelectItem>
                                        <SelectItem value="capital">Capital Expenditure</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="account">Account</Label>
                            <Select
                                value={formData.account}
                                onValueChange={(value) => handleSelectChange('account', value)}
                            >
                                <SelectTrigger id="account">
                                    <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="office">Office Expenses</SelectItem>
                                    <SelectItem value="receivable">Accounts Receivable</SelectItem>
                                    <SelectItem value="bank">Bank Charges</SelectItem>
                                    <SelectItem value="fixed">Fixed Assets</SelectItem>
                                    <SelectItem value="utilities">Utilities</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="reference">Reference (Optional)</Label>
                            <Input
                                id="reference"
                                name="reference"
                                placeholder="INV-001, REC-001, etc."
                                value={formData.reference}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                placeholder="Add any additional notes here..."
                                className="resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">Save Transaction</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddTransactionModal;
