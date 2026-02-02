
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface OvertimeApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApprove: (minutes: number) => void;
    onReject: () => void;
    employeeName: string;
    date: string;
    calculatedMinutes: number;
}

const OvertimeApprovalModal: React.FC<OvertimeApprovalModalProps> = ({
    isOpen,
    onClose,
    onApprove,
    onReject,
    employeeName,
    date,
    calculatedMinutes
}) => {
    const [approvedMinutes, setApprovedMinutes] = useState(calculatedMinutes);

    useEffect(() => {
        setApprovedMinutes(calculatedMinutes);
    }, [calculatedMinutes]);

    if (!isOpen) return null;

    const formatTime = (totalMinutes: number) => {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h}h ${m}m`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
                    <h3 className="font-semibold text-lg text-gray-900">Approve Overtime</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase tracking-wider">Employee</Label>
                        <div className="font-medium text-gray-900">{employeeName}</div>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase tracking-wider">Date</Label>
                        <div className="text-sm text-gray-700">{date}</div>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-md border border-blue-100 space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-blue-700">Calculated Overtime:</span>
                            <span className="font-semibold text-blue-900">{formatTime(calculatedMinutes)} ({calculatedMinutes} min)</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="approved-minutes">Approved Duration (Minutes)</Label>
                        <Input
                            id="approved-minutes"
                            type="number"
                            value={approvedMinutes}
                            onChange={(e) => setApprovedMinutes(Number(e.target.value))}
                            className="font-mono"
                        />
                        <p className="text-xs text-gray-500 text-right">
                            {formatTime(approvedMinutes)}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                    <Button variant="outline" onClick={onReject} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                        Reject
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={() => onApprove(approvedMinutes)} className="bg-green-600 hover:bg-green-700 text-white">
                        Approve
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default OvertimeApprovalModal;
