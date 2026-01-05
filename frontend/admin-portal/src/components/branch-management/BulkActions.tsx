import React from 'react';
import { Button } from "@/components/ui/button";
import { X, Trash2, Download } from "lucide-react";

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
        <div className="flex items-center justify-between p-4 mb-6 border rounded-lg bg-muted/50 border-primary/20">
            <div className="flex items-center gap-4">
                <span className="font-medium text-primary">
                    {selectedCount} branches selected
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearSelection}
                    className="h-8 px-2 text-muted-foreground"
                >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                </Button>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onBulkAction('export')}
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onBulkAction('delete')}
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                </Button>
            </div>
        </div>
    );
};

export default BulkActions;
