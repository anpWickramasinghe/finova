import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Loader2, DollarSign, Download, BadgeCheck } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { StripePayoutModal } from './StripePayoutModal';

const API_URL = import.meta.env.VITE_API_URL;
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

interface PayslipItem {
    id: string;
    componentName: string;
    type: string;
    amount: string;
}

interface PayrollDetailDrawerProps {
    payrollId: string | null;
    open: boolean;
    onClose: () => void;
    onStatusChange: () => void;
}

export default function PayrollDetailDrawer({ payrollId, open, onClose, onStatusChange }: PayrollDetailDrawerProps) {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showStripeModal, setShowStripeModal] = useState(false);

    useEffect(() => {
        if (!payrollId || !open) return;
        const fetchDetails = async () => {
            setIsLoading(true);
            try {
                const res = await axios.get(`${API_URL}/payroll/${payrollId}`, { headers: getAuthHeader() });
                setData(res.data);
            } catch (err) {
                toast.error('Failed to load payslip details');
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [payrollId, open]);

    const handleAction = async (status: string) => {
        setIsUpdating(true);
        try {
            await axios.patch(`${API_URL}/payroll/${payrollId}/status`, { status }, { headers: getAuthHeader() });
            toast.success(`Payslip marked as ${status}`);
            onStatusChange();
            if (status === 'Approved') {
                toast.info('Ledger Journal Entries for Salary Expense created automatically.');
            }
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Action failed');
        } finally {
            setIsUpdating(false);
        }
    };

    if (!open) return null;

    const items: PayslipItem[] = data?.items || [];
    const earnings = items.filter(i => i.type === 'Earning');
    const deductions = items.filter(i => i.type.includes('Deduction'));
    const employerContbs = items.filter(i => i.type === 'EmployerContribution');

    return (
        <Sheet open={open} onOpenChange={(val: boolean) => !val && onClose()}>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle>Payslip Details</SheetTitle>
                    <SheetDescription>Detailed breakdown for {data?.userName}</SheetDescription>
                </SheetHeader>

                {isLoading ? (
                    <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-text-secondary" /></div>
                ) : data ? (
                    <div className="space-y-6">
                        {/* Header Summary */}
                        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-5 border border-primary/20 flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-text-secondary">{data.month}/{data.year}</p>
                                <h2 className="text-2xl font-bold font-heading text-primary-900 mt-1">LKR {parseFloat(data.netSalary).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>

                                <span className={`inline-flex mt-2 items-center px-2 py-0.5 rounded text-xs font-semibold ${data.status === 'Draft' ? 'bg-gray-200 text-gray-800' :
                                    data.status === 'Pending Approval' ? 'bg-yellow-200 text-yellow-800' :
                                        data.status === 'Approved' ? 'bg-blue-200 text-blue-800' :
                                            data.status === 'Paid' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                                    }`}>
                                    {data.status}
                                </span>
                            </div>
                            <div className="text-right space-y-1">
                                <p className="text-sm"><span className="text-text-secondary">Worked Days:</span> <span className="font-semibold">{data.workedDays}</span></p>
                                <p className="text-sm"><span className="text-text-secondary">Total Hours:</span> <span className="font-semibold">{data.totalWorkHours}</span></p>
                                <p className="text-sm"><span className="text-text-secondary">OT Hours:</span> <span className="font-semibold">{data.totalOvertimeHours}</span></p>
                            </div>
                        </div>

                        {/* Breakdown Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* Earnings Column */}
                            <div>
                                <h3 className="text-sm font-bold text-green-700 uppercase tracking-wider mb-3 border-b border-border pb-1">Earnings</h3>
                                <div className="space-y-2 text-sm">
                                    {earnings.map(e => (
                                        <div key={e.id} className="flex justify-between">
                                            <span className="text-text-secondary">{e.componentName}</span>
                                            <span className="font-medium">{parseFloat(e.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between pt-2 mt-2 border-t border-border/50 font-bold">
                                        <span>Total Earnings</span>
                                        <span>{parseFloat(data.totalEarnings).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Deductions Column */}
                            <div>
                                <h3 className="text-sm font-bold text-red-700 uppercase tracking-wider mb-3 border-b border-border pb-1">Deductions</h3>
                                <div className="space-y-2 text-sm">
                                    {deductions.map(d => (
                                        <div key={d.id} className="flex justify-between">
                                            <span className="text-text-secondary">{d.componentName}</span>
                                            <span className="font-medium text-red-600">({parseFloat(d.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })})</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between pt-2 mt-2 border-t border-border/50 font-bold">
                                        <span>Total Deductions</span>
                                        <span className="text-red-700">({parseFloat(data.totalDeductions).toLocaleString('en-US', { minimumFractionDigits: 2 })})</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Employer Contributions */}
                        {employerContbs.length > 0 && (
                            <div className="bg-surface border border-border rounded-lg p-4">
                                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Employer Contributions (Not deducted from net)</h3>
                                <div className="space-y-1 text-sm">
                                    {employerContbs.map(c => (
                                        <div key={c.id} className="flex justify-between text-text-secondary">
                                            <span>{c.componentName}</span>
                                            <span>{parseFloat(c.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-6 border-t border-border">
                            {data.status === 'Draft' && (
                                <Button className="flex-1" onClick={() => handleAction('Pending Approval')} disabled={isUpdating}>
                                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit for Approval'}
                                </Button>
                            )}
                            {data.status === 'Pending Approval' && (
                                <>
                                    <Button variant="destructive" className="flex-1" onClick={() => handleAction('Rejected')} disabled={isUpdating}>Reject</Button>
                                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleAction('Approved')} disabled={isUpdating}>
                                        <BadgeCheck className="w-4 h-4 mr-2" /> Approve
                                    </Button>
                                </>
                            )}
                            {data.status === 'Approved' && (
                                <>
                                    <Button variant="outline" className="flex-1 border-green-600 text-green-700 hover:bg-green-50" onClick={() => handleAction('Paid')} disabled={isUpdating}>
                                        <DollarSign className="w-4 h-4 mr-2" /> Mark Paid Manually
                                    </Button>
                                    <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setShowStripeModal(true)} disabled={isUpdating}>
                                        <DollarSign className="w-4 h-4 mr-2" /> Pay via Stripe
                                    </Button>
                                </>
                            )}

                            <Button variant="outline" size="icon" title="Download PDF">
                                <Download className="w-4 h-4" />
                            </Button>
                        </div>
                        {data.status === 'Approved' && (
                            <p className="text-xs text-center text-text-secondary">Approving booked a Salary Expense journal entry to the ledger.</p>
                        )}
                    </div>
                ) : (
                    <div className="text-center text-text-secondary py-12">Failed to load data.</div>
                )}
            </SheetContent>

            {data && (
                <StripePayoutModal
                    payrollId={payrollId!}
                    employeeAccountId={data.stripeAccountId}
                    open={showStripeModal}
                    onOpenChange={setShowStripeModal}
                    onSuccess={() => {
                        onStatusChange();
                        onClose();
                    }}
                />
            )}
        </Sheet>
    );
}
