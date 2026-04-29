import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Transaction } from "@/services/transactionService";

interface TransactionTableProps {
  transactions: Transaction[];
  onTransactionClick: (transaction: Transaction) => void;
  groupByMonth?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTypeBadge = (type: string) => {
  const colors: Record<string, string> = {
    journal: "bg-cyan-50 text-cyan-700 border-cyan-200",
    payment: "bg-orange-50 text-orange-700 border-orange-200",
    receipt: "bg-emerald-50 text-emerald-700 border-emerald-200",
    transfer: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <Badge variant="outline" className={`capitalize ${colors[type] || ""}`}>
      {type}
    </Badge>
  );
};

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600 border-slate-200",
    pending_approval: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-blue-50 text-blue-700 border-blue-200",
    posted: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    voided: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <Badge
      variant="outline"
      className={`capitalize ${styles[status?.toLowerCase()] || "bg-slate-100 text-slate-600 border-slate-200"}`}
    >
      {status || "draft"}
    </Badge>
  );
};

const fmtMoney = (val: string | undefined) =>
  `LKR ${parseFloat(val || "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

// ─── Row ──────────────────────────────────────────────────────────────────────

const TxnRow: React.FC<{
  t: Transaction;
  onClick: (t: Transaction) => void;
}> = ({ t, onClick }) => {
  const debitVal = parseFloat(t.debit || "0");
  const creditVal = parseFloat(t.credit || "0");
  return (
    <TableRow
      key={t.id}
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onClick(t)}
    >
      <TableCell className="font-mono text-xs text-muted-foreground">
        {t.transactionNumber}
      </TableCell>
      <TableCell className="font-medium whitespace-nowrap">
        {format(parseISO(t.date), "MMM dd, yyyy")}
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{t.description}</span>
          {t.reference && (
            <span className="text-xs text-muted-foreground">
              Ref: {t.reference}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>{getTypeBadge(t.type)}</TableCell>
      <TableCell>{getStatusBadge(t.status)}</TableCell>
      <TableCell className="text-right font-mono font-medium">
        {debitVal > 0 ? (
          <span className="text-green-600">{fmtMoney(t.debit)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-right font-mono font-medium">
        {creditVal > 0 ? (
          <span className="text-red-600">{fmtMoney(t.credit)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
    </TableRow>
  );
};

// ─── Month Group ──────────────────────────────────────────────────────────────

interface MonthGroup {
  label: string; // e.g. "March 2026"
  key: string; // e.g. "2026-03"
  rows: Transaction[];
  totalDebit: number;
  totalCredit: number;
}

function buildGroups(transactions: Transaction[]): MonthGroup[] {
  const map = new Map<string, Transaction[]>();

  for (const t of transactions) {
    const d = parseISO(t.date);
    const key = format(d, "yyyy-MM");
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }

  // Sort months descending (most-recent first)
  const sorted = [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  return sorted.map(([key, rows]) => ({
    key,
    label: format(parseISO(`${key}-01`), "MMMM yyyy"),
    rows,
    totalDebit: rows.reduce((s, t) => s + parseFloat(t.debit || "0"), 0),
    totalCredit: rows.reduce((s, t) => s + parseFloat(t.credit || "0"), 0),
  }));
}

// ─── Grouped view subcomponent ────────────────────────────────────────────────

const GroupedTable: React.FC<{
  groups: MonthGroup[];
  onTransactionClick: (t: Transaction) => void;
}> = ({ groups, onTransactionClick }) => {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isCollapsed = collapsed.has(group.key);
        const net = group.totalDebit - group.totalCredit;
        return (
          <div
            key={group.key}
            className="rounded-md border bg-card overflow-hidden"
          >
            {/* Month header */}
            <button
              type="button"
              onClick={() => toggle(group.key)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/40 hover:bg-muted/70 transition-colors text-sm font-semibold"
            >
              <div className="flex items-center gap-2">
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
                <span>{group.label}</span>
                <Badge variant="secondary" className="ml-1 text-xs">
                  {group.rows.length}
                </Badge>
              </div>
              <div className="flex items-center gap-4 font-mono text-xs font-medium">
                <span className="text-green-600">
                  Dr {fmtMoney(String(group.totalDebit))}
                </span>
                <span className="text-red-600">
                  Cr {fmtMoney(String(group.totalCredit))}
                </span>
                <span
                  className={net >= 0 ? "text-emerald-600" : "text-orange-600"}
                >
                  Net {net >= 0 ? "" : "-"}
                  {fmtMoney(String(Math.abs(net)))}
                </span>
              </div>
            </button>

            {/* Rows */}
            {!isCollapsed && (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>TXN #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.rows.map((t) => (
                    <TxnRow key={t.id} t={t} onClick={onTransactionClick} />
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-muted/50 font-semibold text-xs">
                    <TableCell
                      colSpan={5}
                      className="text-right text-muted-foreground"
                    >
                      {group.label} totals
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-green-600">
                      {fmtMoney(String(group.totalDebit))}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-red-600">
                      {fmtMoney(String(group.totalCredit))}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onTransactionClick,
  groupByMonth = false,
}) => {
  // Overall totals (used in flat mode footer)
  const totalDebit = transactions.reduce(
    (s, t) => s + parseFloat(t.debit || "0"),
    0,
  );
  const totalCredit = transactions.reduce(
    (s, t) => s + parseFloat(t.credit || "0"),
    0,
  );

  if (transactions.length === 0) {
    return (
      <div className="rounded-md border bg-card">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-24 text-center text-muted-foreground"
              >
                No transactions found. Click "New Transaction" to create one.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  // ── Grouped view ──────────────────────────────────────────────────────────
  if (groupByMonth) {
    const groups = buildGroups(transactions);
    return (
      <GroupedTable groups={groups} onTransactionClick={onTransactionClick} />
    );
  }

  // ── Flat view (default) ───────────────────────────────────────────────────
  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>TXN #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Debit</TableHead>
            <TableHead className="text-right">Credit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <TxnRow key={t.id} t={t} onClick={onTransactionClick} />
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="bg-muted/50 font-semibold">
            <TableCell colSpan={5} className="text-right">
              Totals
            </TableCell>
            <TableCell className="text-right font-mono font-bold text-green-600">
              {fmtMoney(String(totalDebit))}
            </TableCell>
            <TableCell className="text-right font-mono font-bold text-red-600">
              {fmtMoney(String(totalCredit))}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default TransactionTable;
