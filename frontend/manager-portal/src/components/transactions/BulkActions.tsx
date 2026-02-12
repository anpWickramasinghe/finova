import React from 'react';
import { Button } from "@/components/ui/button";
import { Copy, Trash2, CheckCircle, X } from "lucide-react";

interface BulkActionsProps {
    selectedCount: number;
    onBulkAction: (action: string) => void;
    onClearSelection: () => void;
}

const BulkActions: React.FC<BulkActionsProps> = ({
    selectedCount,
    onBulkAction,
    onClearSelection,
}) => {
    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-card border shadow-lg rounded-full px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-5">
            <div className="flex items-center gap-2">
                <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {selectedCount}
                </span>
                <span className="text-sm font-medium">Selected</span>
            </div>

            <div className="h-4 w-px bg-border" />

            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onBulkAction('reconcile')}
                    className="h-8"
                >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Reconcile
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onBulkAction('delete')}
                    className="h-8 text-destructive hover:text-destructive"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onBulkAction('duplicate')}
                    className="h-8"
                >
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                </Button>
            </div>

            <div className="h-4 w-px bg-border" />

            <Button variant="ghost" size="icon" onClick={onClearSelection} className="h-6 w-6 rounded-full">
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
};

export default BulkActions;
