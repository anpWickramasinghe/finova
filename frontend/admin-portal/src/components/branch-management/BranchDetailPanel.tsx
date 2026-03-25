import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Building2,
    Users
} from "lucide-react";
import type { Branch } from '../../pages/branch-management/types';
import BranchEmployeesModal from './BranchEmployeesModal';
import BranchStripeTransferModal from './BranchStripeTransferModal';
import { CreditCard } from "lucide-react";
import { branchService } from '../../services/branchService';

interface BranchDetailPanelProps {
    branch: Branch | null;
    onUpdateBranch: (branch: Branch) => void;
}

const BranchDetailPanel: React.FC<BranchDetailPanelProps> = ({
    branch,
    onUpdateBranch,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Branch>>({});
    const [showEmployeesModal, setShowEmployeesModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        if (branch) {
            setFormData(branch);
            setIsEditing(false);
        }
    }, [branch]);

    if (!branch) {
        return (
            <Card className="h-full flex items-center justify-center text-center p-6">
                <div className="text-muted-foreground">
                    <Building2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-medium">No Branch Selected</h3>
                    <p className="text-sm">Select a branch from the list to view details</p>
                </div>
            </Card>
        );
    }

    const handleSave = () => {
        onUpdateBranch({ ...branch, ...formData } as Branch);
        setIsEditing(false);
    };

    const handleConnectStripe = async () => {
        try {
            setIsConnecting(true);
            const data = await branchService.connectBranchStripe(branch.id);
            onUpdateBranch(data.branch);
        } catch (error) {
            console.error('Failed to connect Stripe:', error);
            alert('Failed to connect Stripe account');
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <Card className="h-full">
            <CardHeader className="relative pb-0">
                <div className="flex flex-col items-center text-center pb-6">
                    <div className="w-24 h-24 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-12 h-12 text-primary" />
                    </div>
                    <CardTitle className="text-xl mb-1">{branch.name}</CardTitle>
                </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6 space-y-6">
                {isEditing ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Branch Name</Label>
                            <Input
                                id="name"
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email || ''}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password (Leave blank to keep current)</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password || ''}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Enter new password"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="manager">Manager</Label>
                            <Input
                                id="manager"
                                value={formData.manager || ''}
                                onChange={e => setFormData({ ...formData, manager: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactNumber">Contact Number</Label>
                            <Input
                                id="contactNumber"
                                value={formData.contactNumber || ''}
                                onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stripeAccountId">Stripe Account ID (Optional)</Label>
                            <Input
                                id="stripeAccountId"
                                value={formData.stripeAccountId || ''}
                                onChange={e => setFormData({ ...formData, stripeAccountId: e.target.value })}
                                placeholder="acct_12345"
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Email</p>
                                    <p className="font-medium">{branch.email}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Manager</p>
                                    <p className="font-medium">{branch.manager}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Contact</p>
                                    <p className="font-medium">{branch.contactNumber}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Employees</p>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium">{branch.employeeCount}</p>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="h-6 px-2 text-xs"
                                            onClick={() => setShowEmployeesModal(true)}
                                        >
                                            <Users className="w-3 h-3 mr-1" />
                                            View
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Revenue</p>
                                    <p className="font-medium">${branch.revenue.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Last Audit</p>
                                    <p className="font-medium">{new Date(branch.lastAudit).toLocaleDateString()}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-muted-foreground">Stripe Account ID</p>
                                    <p className="font-medium font-mono text-xs mt-1">
                                        {branch.stripeAccountId || 'Not Configured'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h4 className="text-sm font-medium mb-3">Recent Activity</h4>
                            <div className="space-y-3">
                                {branch.auditLog && branch.auditLog.slice(0, 3).map((log, index) => (
                                    <div key={index} className="flex items-start gap-2 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                                        <div>
                                            <p className="text-text-primary">{log.action}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(log.timestamp).toLocaleString()} by {log.user}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
            <CardFooter>
                {isEditing ? (
                    <div className="flex w-full gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
                            Cancel
                        </Button>
                        <Button className="flex-1" onClick={handleSave}>
                            Save Changes
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col w-full gap-2">
                        <Button className="w-full" onClick={() => setIsEditing(true)}>
                            Edit Branch
                        </Button>
                        {!branch.stripeAccountId ? (
                            <Button
                                variant="secondary"
                                className="w-full"
                                onClick={handleConnectStripe}
                                disabled={isConnecting}
                            >
                                <CreditCard className="w-4 h-4 mr-2" />
                                {isConnecting ? 'Connecting...' : 'Connect Stripe Account'}
                            </Button>
                        ) : (
                            <Button 
                                variant="secondary" 
                                className="w-full" 
                                onClick={() => setShowTransferModal(true)}
                            >
                                <CreditCard className="w-4 h-4 mr-2" />
                                Transfer via Stripe
                            </Button>
                        )}
                    </div>
                )}
            </CardFooter>
            <BranchEmployeesModal
                isOpen={showEmployeesModal}
                onClose={() => setShowEmployeesModal(false)}
                branchName={branch.name}
                branchId={branch.id}
            />
            <BranchStripeTransferModal
                isOpen={showTransferModal}
                onClose={() => setShowTransferModal(false)}
                branch={branch}
                onTransferComplete={() => {
                    // Could refresh branch data or show a success toast here
                }}
            />
        </Card>
    );
};

export default BranchDetailPanel;
