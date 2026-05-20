/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle2, ChevronRight, Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

interface WizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function GeneratePayrollWizard({ open, onOpenChange, onSuccess }: WizardProps) {
    const [step, setStep] = useState(1);
    const [month, setMonth] = useState(String(new Date().getMonth() + 1));
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [isGenerating, setIsGenerating] = useState(false);
    const [results, setResults] = useState<any[]>([]);

    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const years = [2024, 2025, 2026];

    const reset = () => {
        setStep(1);
        setResults([]);
        setMonth(String(new Date().getMonth() + 1));
        setYear(String(new Date().getFullYear()));
    };

    const handleClose = (v: boolean) => {
        if (!v) reset();
        onOpenChange(v);
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const res = await axios.post(`${API_URL}/payroll/bulk`, { month, year }, { headers: getAuthHeader() });
            setResults(res.data.results || []);
            setStep(3);
            toast.success(res.data.message);
            onSuccess();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to generate payroll');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Payroll Generation Wizard</DialogTitle>
                    <DialogDescription>Generate monthly payslips for all active employees.</DialogDescription>
                </DialogHeader>

                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-8 mt-4 relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border z-0"></div>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary z-0 transition-all duration-300" style={{ width: `${(step - 1) * 50}%` }}></div>

                    {[1, 2, 3].map(s => (
                        <div key={s} className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${step >= s ? 'bg-primary border-primary text-primary-foreground' : 'bg-surface border-border text-text-muted mt'}`}>
                            {s < step ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-sm font-semibold">{s}</span>}
                        </div>
                    ))}
                </div>

                <div className="min-h-[200px]">
                    {step === 1 && (
                        <div className="animate-fade-in space-y-6">
                            <h3 className="text-lg font-medium text-text-primary">Step 1: Select Period</h3>
                            <p className="text-sm text-text-secondary">Choose the month and year you wish to generate draft payrolls for.</p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Month</label>
                                    <Select value={month} onValueChange={setMonth}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {months.map(m => (
                                                <SelectItem key={m} value={String(m)}>
                                                    {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Year</label>
                                    <Select value={year} onValueChange={setYear}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-fade-in space-y-6">
                            <h3 className="text-lg font-medium text-text-primary">Step 2: Pre-flight Checks</h3>
                            <p className="text-sm text-text-secondary">
                                The system will calculate basic salary, overtime, statutory deductions (EPF/ETF), and dynamic salary components for all active employees. This will create <span className="font-semibold text-primary">Draft</span> records that must be approved later.
                            </p>

                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-primary-900 border-l-4 border-l-primary">
                                <p className="font-medium mb-1 flex items-center gap-2">Ready to run Engine <Play className="h-4 w-4" /></p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 opacity-90">
                                    <li>Extracting Attendance logs</li>
                                    <li>Fetching user-specific compensation logic</li>
                                    <li>Applying statutory brackets</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-fade-in space-y-4">
                            <div className="text-center py-4">
                                <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-medium text-text-primary">Generation Complete</h3>
                                <p className="text-sm text-text-secondary mt-1">Review the status of the generated batches below.</p>
                            </div>

                            <div className="max-h-48 overflow-y-auto border border-border rounded-lg bg-surface">
                                <div className="divide-y divide-border">
                                    {results.map((r, i) => (
                                        <div key={i} className="p-3 text-sm flex justify-between items-center">
                                            <span className="font-medium">{r.name}</span>
                                            {r.success ?
                                                <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs border border-green-200">Success</span> :
                                                <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs border border-red-200" title={r.message}>Failed: {r.message}</span>
                                            }
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-6 border-t border-border pt-4">
                    {step === 1 && <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>}
                    {step === 1 && <Button onClick={() => setStep(2)}>Next <ChevronRight className="w-4 h-4 ml-1" /></Button>}

                    {step === 2 && <Button variant="outline" onClick={() => setStep(1)} disabled={isGenerating}>Back</Button>}
                    {step === 2 && (
                        <Button onClick={handleGenerate} disabled={isGenerating}>
                            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Run Payroll Engine
                        </Button>
                    )}

                    {step === 3 && <Button onClick={() => handleClose(false)}>Done</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
