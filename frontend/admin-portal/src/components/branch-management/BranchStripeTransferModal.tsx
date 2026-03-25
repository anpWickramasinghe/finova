import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, DollarSign } from "lucide-react";
import { branchService } from '../../services/branchService';
import type { Branch } from '../../pages/branch-management/types';

interface BranchStripeTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    branch: Branch;
    onTransferComplete: () => void;
}

const BranchStripeTransferModal: React.FC<BranchStripeTransferModalProps> = ({
    isOpen,
    onClose,
    branch,
    onTransferComplete,
}) => {
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleTransfer = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            await branchService.transferToBranchStripe(branch.id, Number(amount));
            onTransferComplete();
            onClose();
        } catch (err: any) {
            console.error('Transfer failed:', err);
            setError(err.response?.data?.message || 'Failed to initiate transfer');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Transfer Funds via Stripe</DialogTitle>
                    <DialogDescription>
                        Transfer funds directly to the Stripe Connect account of {branch.name}.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}
                    
                    <div className="space-y-2">
                        <Label>Stripe Account ID</Label>
                        <div className="p-2 text-sm bg-muted rounded-md font-mono text-muted-foreground">
                            {branch.stripeAccountId || 'Not configured'}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Transfer Amount (USD)</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="amount"
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-9"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex space-x-2 items-center justify-end">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleTransfer}
                        disabled={isSubmitting || !amount || !branch.stripeAccountId}
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Confirm Transfer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default BranchStripeTransferModal;
