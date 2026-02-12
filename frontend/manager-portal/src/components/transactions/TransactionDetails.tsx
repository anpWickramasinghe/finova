import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Copy, Download, Share2, Edit, Trash2 } from "lucide-react";

interface Transaction {
    id: string;
    date: string;
    description: string;
    account: string;
    accountCode: string;
    debit: number;
    credit: number;
    type: string;
    status: string;
    reference: string;
    category: string;
    bankFeed: boolean;
    attachments: number;
}

interface TransactionDetailsProps {
    transaction: Transaction | null;
    onClose: () => void;
}

const TransactionDetails: React.FC<TransactionDetailsProps> = ({
    transaction,
    onClose,
}) => {
    if (!transaction) return null;

    const isCredit = transaction.credit > 0;
    const amount = isCredit ? transaction.credit : transaction.debit;
    const amountType = isCredit ? 'Credit' : 'Debit';

    return (
        <Sheet open={!!transaction} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle>Transaction Details</SheetTitle>
                    <SheetDescription>
                        View detailed information about this transaction.
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                    {/* Header Stats */}
                    <div className="bg-muted p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Amount</p>
                            <h2 className="text-2xl font-bold">
                                {isCredit ? '+' : '-'}${amount.toFixed(2)}
                            </h2>
                        </div>
                        <Badge variant={transaction.status === 'reconciled' ? 'default' : 'secondary'}>
                            {transaction.status}
                        </Badge>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                            <Copy className="mr-2 h-4 w-4" /> Copy ID
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                            <Download className="mr-2 h-4 w-4" /> Receipt
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                            <Share2 className="mr-2 h-4 w-4" /> Share
                        </Button>
                    </div>

                    <Separator />

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Transaction ID</p>
                            <p className="text-sm">{transaction.id}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Reference</p>
                            <p className="text-sm">{transaction.reference}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Date</p>
                            <p className="text-sm">{format(new Date(transaction.date), 'PPP')}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Type</p>
                            <p className="text-sm capitalize">{transaction.type}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Category</p>
                            <p className="text-sm">{transaction.category}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Bank Feed</p>
                            <p className="text-sm">{transaction.bankFeed ? 'Connected' : 'Manual Entry'}</p>
                        </div>
                    </div>

                    <Separator />

                    {/* Account Info */}
                    <div>
                        <h4 className="font-medium mb-3">Account Information</h4>
                        <div className="bg-card border rounded-md p-3">
                            <div className="flex justify-between">
                                <div>
                                    <p className="font-medium">{transaction.account}</p>
                                    <p className="text-sm text-muted-foreground">Code: {transaction.accountCode}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">{amountType}</p>
                                    <p className="text-sm text-muted-foreground">${amount.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <div className="bg-muted/50 p-3 rounded-md text-sm">
                            {transaction.description}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 pt-6">
                        <Button className="w-full">
                            <Edit className="mr-2 h-4 w-4" /> Edit Transaction
                        </Button>
                        <Button variant="destructive" className="w-full">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default TransactionDetails;
