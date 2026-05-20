/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { stripeService } from "@/services/stripeService";
import { toast } from "sonner";

interface StripePayoutModalProps {
  payrollId: string;
  employeeAccountId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function StripePayoutModal({ payrollId, employeeAccountId, open, onOpenChange, onSuccess }: StripePayoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [employeeAccountIdInput, setEmployeeAccountIdInput] = useState("");
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (open) {
      setEmployeeAccountIdInput(employeeAccountId || "");
      setError("");
    }
  }, [open, employeeAccountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeAccountIdInput) {
      setError("Please enter the Stripe Connected Account ID.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await stripeService.payPayroll(payrollId, {
        employeeAccountId: employeeAccountIdInput,
        currency: "usd",
      });
      toast.success("Payroll paid via Stripe successfully.");
      onSuccess();
      onOpenChange(false);
      setEmployeeAccountIdInput("");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to process Stripe payout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pay via Stripe</DialogTitle>
          <DialogDescription>
            Enter the employee's Stripe Connected Account ID to transfer their net salary.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="employeeAccountId">Employee Stripe Account ID *</Label>
            <Input
              id="employeeAccountId"
              placeholder="e.g. acct_12345..."
              value={employeeAccountIdInput}
              onChange={e => setEmployeeAccountIdInput(e.target.value)}
              readOnly={!!employeeAccountId}
              className={employeeAccountId ? "bg-muted" : ""}
            />
            {employeeAccountId && (
              <p className="text-xs text-muted-foreground">Auto-filled from user profile.</p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
