import { Banknote, CheckCircle, Clock, SaveAll } from 'lucide-react';

export default function PayrollStatsCards({ records }: { records: any[] }) {
    const totalPayable = records.reduce((sum, r) => sum + parseFloat(r.netSalary || 0), 0);
    const drafts = records.filter(r => r.status === 'Draft').length;
    const pending = records.filter(r => r.status === 'Pending Approval').length;
    const paid = records.filter(r => r.status === 'Paid').length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-full">
                    <Banknote className="h-6 w-6" />
                </div>
                <div>
                    <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Total Net Payable</h4>
                    <p className="text-2xl font-bold font-heading text-primary-900">
                        {totalPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4">
                <div className="p-3 bg-gray-100 text-gray-600 rounded-full">
                    <SaveAll className="h-6 w-6" />
                </div>
                <div>
                    <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Draft Records</h4>
                    <p className="text-2xl font-bold font-heading text-gray-900">{drafts}</p>
                </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4">
                <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full">
                    <Clock className="h-6 w-6" />
                </div>
                <div>
                    <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Pending Approval</h4>
                    <p className="text-2xl font-bold font-heading text-yellow-900">{pending}</p>
                </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4">
                <div className="p-3 bg-green-100 text-green-600 rounded-full">
                    <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                    <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Processed & Paid</h4>
                    <p className="text-2xl font-bold font-heading text-green-900">{paid}</p>
                </div>
            </div>
        </div>
    );
}
