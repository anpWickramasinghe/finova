import React, { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { stripeService } from "@/services/stripeService";
import type { Branch } from "@/pages/branch-management/types";

interface BranchTransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: Branch[];
  onSuccess: () => void;
}

export function BranchTransferModal({ open, onOpenChange, branches, onSuccess }: BranchTransferModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [amount, setAmount] = useState("");
  const [toBranchId, setToBranchId] = useState("");
  const [destinationAccountId, setDestinationAccountId] = useState("");
  const [description, setDescription] = useState("");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !toBranchId || !destinationAccountId) {
      setError("Please fill all required fields.");
      return;
    }
    
    setError("");
    setLoading(true);
    
    try {
      await stripeService.createBranchTransfer({
        amount: parseFloat(amount),
        currency: "usd",
        destinationAccountId,
        toBranchId,
      });
      onSuccess();
      onOpenChange(false);
      // Reset form
      setAmount("");
      setToBranchId("");
      setDestinationAccountId("");
      setDescription("");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to transfer funds.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Branch Transfer (Stripe)</DialogTitle>
          <DialogDescription>
            Transfer funds from the main branch to a sub-branch using Stripe Connect.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="branch">Destination Branch *</Label>
            <Select value={toBranchId} onValueChange={setToBranchId}>
              <SelectTrigger>
                <SelectValue placeholder="Select sub-branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map(b => (
                  <SelectItem key={b.id} value={b.id.toString()}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="accountId">Stripe Connected Account ID *</Label>
            <Input
              id="accountId"
              placeholder="e.g. acct_12345..."
              value={destinationAccountId}
              onChange={e => setDestinationAccountId(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (USD) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="1"
              placeholder="e.g. 5000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Notes / Description</Label>
            <Textarea
              id="description"
              placeholder="Optional notes for this transfer"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
            />
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
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Transfer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
