import { useState, useEffect, useCallback, useMemo } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  PlayCircle,
  Settings,
  Users,
  Calculator,
  CheckCircle,
  Building2,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

import PayrollStatsCards from "./components/PayrollStatsCards";
import PayrollTable from "./components/PayrollTable";
import PayrollDetailDrawer from "./components/PayrollDetailDrawer";
import GeneratePayrollWizard from "./components/GeneratePayrollWizard";
import CompensationConfigurator from "./components/CompensationConfigurator";
import EmployeeSalaryMapping from "./components/EmployeeSalaryMapping";
import { branchService } from "../../services/branchService";

const API_URL = import.meta.env.VITE_API_URL;
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function PayrollPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Data States
  const [records, setRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));

  // UI States
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(
    null,
  );
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [isApprovingBulk, setIsApprovingBulk] = useState(false);
  const [activeBranchTab, setActiveBranchTab] = useState<string>("");

  const currentUser = {
    name: "Admin",
    email: "admin@finova.com",
    role: "Admin",
    avatar: "",
  };

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/payroll?month=${month}&year=${year}`,
        { headers: getAuthHeader() },
      );
      setRecords(res.data);
    } catch {
      toast.error("Failed to load records");
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  const loadUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/users`, {
        headers: getAuthHeader(),
      });
      setEmployees(res.data || []);
    } catch {
      // ignore error for fetching users
    }
  }, []);

  const loadBranches = useCallback(async () => {
    try {
      const data = await branchService.getAllBranches();
      setBranches(data || []);
    } catch {
      // ignore error
    }
  }, []);

  const handleBulkSubmitApproval = async (payrollIds: string[]) => {
    if (!payrollIds.length) return;
    setIsSubmittingBulk(true);
    try {
      const res = await axios.post(
        `${API_URL}/payroll/bulk-submit`,
        { payrollIds },
        { headers: getAuthHeader() },
      );
      toast.success(res.data.message || "Records submitted for approval");
      loadRecords();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit records");
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const handleBulkApproveBranch = async (payrollIds: string[]) => {
    if (!payrollIds.length) return;
    setIsApprovingBulk(true);
    try {
      const res = await axios.post(
        `${API_URL}/payroll/bulk-approve`,
        { payrollIds },
        { headers: getAuthHeader() },
      );

      toast.success(res.data.message || "Records approved successfully");

      loadRecords();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve records");
    } finally {
      setIsApprovingBulk(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);
  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const augmentedRecords = records.map((record) => {
    const employee = employees.find((e) => e.id === record.userId);
    const branch = branches.find(
      (b) => String(b.id) === String(employee?.branchId),
    );
    return {
      ...record,
      branchId: branch ? String(branch.id) : "unassigned",
      branchName: branch ? branch.name : "Unassigned / HQ",
    };
  });

  const branchGroups = useMemo(() => {
    const groups = branches
      .map((branch) => ({
        branchId: String(branch.id),
        branchName: branch.name,
        records: augmentedRecords.filter(
          (record) => String(record.branchId) === String(branch.id),
        ),
      }))
      .sort((a, b) => a.branchName.localeCompare(b.branchName));

    const unassignedRecords = augmentedRecords.filter(
      (record) => String(record.branchId) === "unassigned",
    );
    if (unassignedRecords.length > 0) {
      groups.push({
        branchId: "unassigned",
        branchName: "Unassigned / HQ",
        records: unassignedRecords,
      });
    }

    return groups;
  }, [branches, augmentedRecords]);

  const branchTabIds = branchGroups.map((group) => group.branchId);
  const branchTabIdsKey = branchTabIds.join("|");
  const activeBranchGroup =
    branchGroups.find((group) => group.branchId === activeBranchTab) || null;
  const activeBranchPendingIds = (activeBranchGroup?.records || [])
    .filter((record) => record.status === "Pending Approval")
    .map((record) => record.id);

  useEffect(() => {
    if (!branchTabIds.length) {
      if (activeBranchTab) setActiveBranchTab("");
      return;
    }

    if (!activeBranchTab || !branchTabIds.includes(activeBranchTab)) {
      setActiveBranchTab(branchTabIds[0]);
    }
  }, [activeBranchTab, branchTabIdsKey]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = [2024, 2025, 2026];

  const hasDrafts = records.some((r) => r.status === "Draft");

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={currentUser}
        onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        sidebarCollapsed={sidebarCollapsed}
      />
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole="admin"
      />

      <main
        className={`pt-header-height nav-transition ${sidebarCollapsed ? "lg:pl-sidebar-collapsed" : "lg:pl-sidebar-width"}`}
      >
        <div className="p-6 mx-auto max-w-7xl">
          <div className="flex flex-col justify-between mb-8 md:flex-row md:items-center">
            <div>
              <h1 className="mb-1 text-3xl font-bold font-heading text-text-primary">
                Payroll Management
              </h1>
              <p className="text-text-secondary">
                Process monthly comp, configure rules, and manage ledger
                integrations.
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              {hasDrafts && (
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10"
                  onClick={() =>
                    handleBulkSubmitApproval(
                      records
                        .filter((r) => r.status === "Draft")
                        .map((r) => r.id),
                    )
                  }
                  disabled={isSubmittingBulk}
                >
                  {isSubmittingBulk ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Submit All for Approval
                </Button>
              )}
              <Button
                className="text-white bg-primary"
                onClick={() => setIsWizardOpen(true)}
              >
                <PlayCircle className="w-4 h-4 mr-2" /> Run Engine
              </Button>
            </div>
          </div>

          <Tabs defaultValue="processing" className="space-y-6">
            <TabsList className="flex justify-start w-full h-12 p-1 overflow-x-auto border bg-surface border-border">
              <TabsTrigger
                value="processing"
                className="data-[state=active]:bg-background min-w-[150px]"
              >
                <Calculator className="w-4 h-4 mr-2" /> Batch Processing
              </TabsTrigger>
              <TabsTrigger
                value="employee_config"
                className="data-[state=active]:bg-background min-w-[150px]"
              >
                <Users className="w-4 h-4 mr-2" /> Employee Rules
              </TabsTrigger>
              <TabsTrigger
                value="global_config"
                className="data-[state=active]:bg-background min-w-[150px]"
              >
                <Settings className="w-4 h-4 mr-2" /> Global Components
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Main Payroll Processing */}
            <TabsContent
              value="processing"
              className="space-y-6 animate-fade-in"
            >
              <PayrollStatsCards records={records} />

              <div className="flex flex-col justify-between gap-4 p-4 border bg-surface rounded-xl border-border sm:flex-row sm:items-center">
                <div className="flex items-center w-full gap-3 sm:w-auto">
                  <span className="text-sm font-medium whitespace-nowrap">
                    Filter Period:
                  </span>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {new Date(0, m - 1).toLocaleString("default", {
                            month: "short",
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => loadRecords()}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  {activeBranchPendingIds.length > 0 && (
                    <Button
                      variant="outline"
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                      onClick={() =>
                        handleBulkApproveBranch(activeBranchPendingIds)
                      }
                      disabled={isApprovingBulk}
                    >
                      {isApprovingBulk ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Approve Branch Pending
                    </Button>
                  )}
                </div>
              </div>
              {branchGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 border rounded-lg bg-card text-muted-foreground">
                  <Building2 className="w-8 h-8 opacity-30" />
                  <p className="text-sm font-medium">No branches found</p>
                </div>
              ) : (
                <Tabs
                  value={activeBranchTab}
                  onValueChange={setActiveBranchTab}
                >
                  <div className="overflow-x-auto border-b">
                    <TabsList className="h-auto p-0 bg-transparent w-max">
                      {branchGroups.map((group) => {
                        const draftCount = group.records.filter(
                          (record) => record.status === "Draft",
                        ).length;

                        return (
                          <TabsTrigger
                            key={group.branchId}
                            value={group.branchId}
                            className="relative flex items-center gap-2 rounded-none border-b-2 border-transparent px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                          >
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            <span>{group.branchName}</span>
                            <span className="text-xs text-muted-foreground/60 tabular-nums">
                              ({group.records.length})
                            </span>
                            {draftCount > 0 && (
                              <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white leading-none">
                                {draftCount}
                              </span>
                            )}
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  </div>

                  {branchGroups.map((group) => (
                    <TabsContent
                      key={group.branchId}
                      value={group.branchId}
                      className="mt-5 focus-visible:outline-none"
                    >
                      <PayrollTable
                        records={group.records}
                        isLoading={isLoading}
                        onViewDetails={(id) => setSelectedPayrollId(id)}
                        onBulkSubmit={handleBulkSubmitApproval}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </TabsContent>

            {/* TAB 2: Employee Mapping */}
            <TabsContent value="employee_config" className="animate-fade-in">
              <EmployeeSalaryMapping employees={employees} />
            </TabsContent>

            {/* TAB 3: Global Rules */}
            <TabsContent value="global_config" className="animate-fade-in">
              <CompensationConfigurator />
            </TabsContent>
          </Tabs>

          <PayrollDetailDrawer
            payrollId={selectedPayrollId}
            open={!!selectedPayrollId}
            onClose={() => setSelectedPayrollId(null)}
            onStatusChange={loadRecords}
          />

          <GeneratePayrollWizard
            open={isWizardOpen}
            onOpenChange={setIsWizardOpen}
            onSuccess={loadRecords}
          />
        </div>
      </main>
    </div>
  );
}
