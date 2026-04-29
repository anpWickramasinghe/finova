import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import {
  transactionService,
  type Transaction,
  type ReportsSummary,
} from "@/services/transactionService";
import { leaveService, type LeaveRequest } from "@/services/leaveService";
import {
  getAttendance,
  type AttendanceRecord,
} from "@/services/attendanceService";
import {
  Loader2,
  Receipt,
  CalendarClock,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  BookOpen,
  ArrowRight,
  LayoutDashboard,
  AlertCircle,
  Banknote,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  pending_approval: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  posted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  reconciled: "bg-teal-50 text-teal-700 border-teal-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const LEAVE_STATUS_COLORS: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
};

const TYPE_COLORS: Record<string, string> = {
  journal: "bg-cyan-50 text-cyan-700 border-cyan-200",
  payment: "bg-orange-50 text-orange-700 border-orange-200",
  receipt: "bg-emerald-50 text-emerald-700 border-emerald-200",
  transfer: "bg-purple-50 text-purple-700 border-purple-200",
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// ─── Stat card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  valueColor?: string;
}

const StatCard = ({
  label,
  value,
  sub,
  icon,
  iconBg,
  valueColor,
}: StatCardProps) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-4">
      <div className={`p-2.5 rounded-xl shrink-0 ${iconBg}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium truncate">
          {label}
        </p>
        <p className={`text-2xl font-bold leading-tight ${valueColor ?? ""}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </CardContent>
  </Card>
);

// ─── Dashboard ───────────────────────────────────────────────────────────────

const Dashboard = () => {
  const { user } = useAuth();

  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const today = new Date();
    const start = format(startOfMonth(today), "yyyy-MM-dd");
    const end = format(endOfMonth(today), "yyyy-MM-dd");

    Promise.allSettled([
      transactionService.getTransactions(),
      transactionService.getReportsSummary(),
      leaveService.getLeaveRequests(),
      getAttendance(start, end),
    ])
      .then(([txnRes, summaryRes, leavesRes, attendanceRes]) => {
        if (txnRes.status === "fulfilled") setTransactions(txnRes.value);
        if (summaryRes.status === "fulfilled") setSummary(summaryRes.value);
        if (leavesRes.status === "fulfilled") setLeaves(leavesRes.value);
        if (attendanceRes.status === "fulfilled")
          setAttendance(attendanceRes.value);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load dashboard data.");
        setLoading(false);
      });
  }, []);

  // ── Derived stats ──
  const pendingTxns = transactions.filter(
    (t) => t.status === "pending_approval",
  );
  const postedTxns = transactions.filter((t) => t.status === "posted");
  const totalVolume = transactions.reduce(
    (s, t) => s + parseFloat(t.totalAmount || "0"),
    0,
  );
  const totalReceipts = transactions
    .filter((t) => t.type === "receipt")
    .reduce((s, t) => s + parseFloat(t.totalAmount || "0"), 0);
  const totalPayments = transactions
    .filter((t) => t.type === "payment")
    .reduce((s, t) => s + parseFloat(t.totalAmount || "0"), 0);

  const pendingLeaves = leaves.filter((l) => l.status === "Pending");
  const approvedLeaves = leaves.filter((l) => l.status === "Approved");

  const presentToday = attendance.filter(
    (a) => a.recordDate === format(new Date(), "yyyy-MM-dd") && a.checkInTime,
  ).length;

  // Recent 5 transactions (newest first)
  const recentTxns = [...transactions]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  // Pending leave requests to action
  const pendingLeaveQueue = pendingLeaves.slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="p-6 space-y-7 max-w-[1400px]">
        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <LayoutDashboard className="h-4 w-4" />
              <span>Manager Portal</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {getGreeting()}
              {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening at your branch —{" "}
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/transactions-management">
              <Receipt className="mr-2 h-4 w-4" />
              New Transaction
            </Link>
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Transactions"
            value={transactions.length}
            sub={`${pendingTxns.length} pending approval`}
            icon={<Receipt className="h-5 w-5 text-blue-600" />}
            iconBg="bg-blue-100 dark:bg-blue-900/30"
          />
          <StatCard
            label="Total Volume (Month)"
            value={`LKR ${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            sub={`${postedTxns.length} posted to ledger`}
            icon={<Banknote className="h-5 w-5 text-emerald-600" />}
            iconBg="bg-emerald-100 dark:bg-emerald-900/30"
            valueColor="text-emerald-700 dark:text-emerald-400"
          />
          <StatCard
            label="Leave Requests"
            value={leaves.length}
            sub={`${pendingLeaves.length} pending · ${approvedLeaves.length} approved`}
            icon={<CalendarClock className="h-5 w-5 text-amber-600" />}
            iconBg="bg-amber-100 dark:bg-amber-900/30"
          />
          <StatCard
            label="Staff Present Today"
            value={presentToday}
            sub={`${attendance.filter((a) => a.recordDate === format(new Date(), "yyyy-MM-dd")).length} records today`}
            icon={<Users className="h-5 w-5 text-purple-600" />}
            iconBg="bg-purple-100 dark:bg-purple-900/30"
          />
        </div>

        {/* ── Cash Flow Overview ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="flex flex-col">
            <CardContent className="p-5 flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm">Cash Flow Summary</h2>
                <span className="text-xs text-muted-foreground">
                  This month
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium">
                      Receipts (Inflow)
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-700">
                    +LKR $
                    {totalReceipts.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">
                      Payments (Outflow)
                    </span>
                  </div>
                  <span className="font-mono font-bold text-red-600">
                    -LKR $
                    {totalPayments.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
                  <span className="text-sm font-semibold">Net</span>
                  <span
                    className={`font-mono font-bold ${totalReceipts - totalPayments >= 0 ? "text-emerald-700" : "text-red-600"}`}
                  >
                    {totalReceipts - totalPayments >= 0 ? "+" : "-"}LKR{" "}
                    {Math.abs(totalReceipts - totalPayments).toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2 },
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Status Breakdown */}
          <Card className="flex flex-col">
            <CardContent className="p-5 flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm">Transaction Status</h2>
                <Link
                  to="/transactions-management"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {[
                  {
                    key: "draft",
                    label: "Draft",
                    icon: <BookOpen className="h-3.5 w-3.5" />,
                  },
                  {
                    key: "pending_approval",
                    label: "Pending Approval",
                    icon: <Clock className="h-3.5 w-3.5" />,
                  },
                  {
                    key: "approved",
                    label: "Approved",
                    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                  },
                  {
                    key: "posted",
                    label: "Posted",
                    icon: <BookOpen className="h-3.5 w-3.5" />,
                  },
                  {
                    key: "rejected",
                    label: "Rejected",
                    icon: <XCircle className="h-3.5 w-3.5" />,
                  },
                ].map(({ key, label, icon }) => {
                  const count =
                    summary?.statusCounts?.[key] ??
                    transactions.filter((t) => t.status === key).length;
                  const total = transactions.length || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 w-36 shrink-0">
                        <span
                          className={`${STATUS_COLORS[key]} rounded px-1.5 py-0.5 text-xs flex items-center gap-1 border`}
                        >
                          {icon}
                          {label}
                        </span>
                      </div>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/60 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono w-6 text-right text-muted-foreground">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Recent Transactions + Leave Queue ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Transactions — 2/3 width */}
          <Card className="lg:col-span-2">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 className="font-semibold text-sm">Recent Transactions</h2>
                <Link
                  to="/transactions-management"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {recentTxns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <Receipt className="h-8 w-8 opacity-30" />
                  <p className="text-sm">No transactions yet</p>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/transactions-management">Create one</Link>
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead className="text-xs pl-5">TXN #</TableHead>
                      <TableHead className="text-xs">Description</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-right text-xs pr-5">
                        Amount
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTxns.map((txn) => (
                      <TableRow
                        key={txn.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground pl-5">
                          {txn.transactionNumber}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium line-clamp-1">
                              {txn.description}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(txn.date), "MMM dd, yyyy")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`capitalize text-xs ${TYPE_COLORS[txn.type] || ""}`}
                          >
                            {txn.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`capitalize text-xs ${STATUS_COLORS[txn.status] || STATUS_COLORS.draft}`}
                          >
                            {txn.status === "pending_approval"
                              ? "Pending"
                              : txn.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium pr-5">
                          LKR{" "}
                          {parseFloat(txn.totalAmount || "0").toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pending Leave Requests — 1/3 width */}
          <Card className="flex flex-col">
            <CardContent className="p-0 flex-1 flex flex-col">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 className="font-semibold text-sm">Leave Requests</h2>
                <Link
                  to="/leaves"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {pendingLeaveQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-10 text-muted-foreground gap-2">
                  <CalendarClock className="h-8 w-8 opacity-30" />
                  <p className="text-sm">No pending requests</p>
                </div>
              ) : (
                <div className="divide-y px-1">
                  {pendingLeaveQueue.map((leave) => (
                    <div
                      key={leave.id}
                      className="px-4 py-3 flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {leave.userName ||
                            `Employee #${leave.userId.slice(0, 6)}`}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {leave.type} leave
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(leave.startDate), "MMM d")}
                          {" – "}
                          {format(new Date(leave.endDate), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs shrink-0 ${LEAVE_STATUS_COLORS[leave.status] || ""}`}
                      >
                        {leave.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              {pendingLeaves.length > 0 && (
                <div className="px-5 py-3 border-t mt-auto">
                  <Button
                    asChild
                    size="sm"
                    className="w-full"
                    variant="outline"
                  >
                    <Link to="/leaves">
                      Review {pendingLeaves.length} pending request
                      {pendingLeaves.length !== 1 ? "s" : ""}
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "New Transaction",
                description: "Record a payment or receipt",
                icon: <Receipt className="h-5 w-5 text-blue-600" />,
                bg: "bg-blue-50 dark:bg-blue-900/10",
                to: "/transactions-management",
              },
              {
                label: "Transaction Reports",
                description: "View ledger & trial balance",
                icon: <BookOpen className="h-5 w-5 text-emerald-600" />,
                bg: "bg-emerald-50 dark:bg-emerald-900/10",
                to: "/transactions-management/reports",
              },
              {
                label: "Leave Management",
                description: "Approve or reject requests",
                icon: <CalendarClock className="h-5 w-5 text-amber-600" />,
                bg: "bg-amber-50 dark:bg-amber-900/10",
                to: "/leaves",
              },
              {
                label: "Attendance",
                description: "Track staff attendance",
                icon: <Users className="h-5 w-5 text-purple-600" />,
                bg: "bg-purple-50 dark:bg-purple-900/10",
                to: "/attendance",
              },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-xl border p-4 hover:bg-muted/40 transition-colors group flex flex-col gap-3"
              >
                <div
                  className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center`}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
