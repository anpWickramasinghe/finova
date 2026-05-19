/**
 * reportExports.ts
 * Categorized CSV and PDF export utilities for Financial & Accounting Reports.
 */

import type { ReportsSummary, ProfitAndLossReport } from '@/services/transactionService';

// ── helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number | string) =>
    parseFloat(String(n)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const lkr = (n: number | string) => `LKR ${fmt(n)}`;

const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

const row = (...cells: (string | number)[]) => cells.map(c => esc(c)).join(',');

const blankRow = () => ',,,,,';

const sectionHeader = (title: string) =>
    `"===== ${title.toUpperCase()} =====",,,,,`;

const dateLabel = (start: string, end: string) =>
    `Period: ${start} to ${end}`;

// ── CSV Export ────────────────────────────────────────────────────────────────

export const exportFinancialCSV = (
    report: ReportsSummary | null,
    pnlReport: ProfitAndLossReport | null,
    startDate: string,
    endDate: string,
) => {
    const lines: string[] = [];
    const generatedAt = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });

    // ── Cover info ──
    lines.push(row('FINOVA FINANCIAL REPORT', '', '', '', '', ''));
    lines.push(row(dateLabel(startDate, endDate), '', '', '', '', ''));
    lines.push(row(`Generated: ${generatedAt}`, '', '', '', '', ''));
    lines.push(blankRow());

    // ── 1. Executive Summary ──
    lines.push(sectionHeader('1. Executive Summary'));
    lines.push(row('Metric', 'Value', '', '', '', ''));
    lines.push(row('Total Transactions', report?.totalTransactions ?? 0, '', '', '', ''));
    lines.push(row('Total Revenue', lkr(pnlReport?.totalRevenue ?? 0), '', '', '', ''));
    lines.push(row('Total Expenses', lkr(pnlReport?.totalExpenses ?? 0), '', '', '', ''));
    lines.push(row('Net Income', lkr(pnlReport?.netIncome ?? 0), '', '', '', ''));
    lines.push(row('Total Ledger Debits', lkr(report?.ledgerTotals?.totalDebit ?? 0), '', '', '', ''));
    lines.push(row('Total Ledger Credits', lkr(report?.ledgerTotals?.totalCredit ?? 0), '', '', '', ''));
    const totalD = parseFloat(String(report?.ledgerTotals?.totalDebit ?? 0));
    const totalC = parseFloat(String(report?.ledgerTotals?.totalCredit ?? 0));
    lines.push(row('Ledger Balance Status', Math.abs(totalD - totalC) < 0.01 ? 'BALANCED' : `OFF BY LKR ${fmt(Math.abs(totalD - totalC))}`, '', '', '', ''));
    lines.push(blankRow());

    // ── 2. Profit & Loss ──
    lines.push(sectionHeader('2. Profit & Loss Statement'));

    // Revenue
    lines.push(row('--- REVENUE ---', '', '', '', '', ''));
    lines.push(row('Account Code', 'Account Name', 'Entries', 'Total Debit', 'Total Credit', 'Net Balance'));
    (pnlReport?.revenues ?? []).forEach(r => {
        lines.push(row(
            r.accountCode,
            r.accountName,
            r.entries?.length ?? 0,
            lkr(r.totalDebit),
            lkr(r.totalCredit),
            lkr(r.netBalance),
        ));
    });
    lines.push(row('TOTAL REVENUE', '', '', '', '', lkr(pnlReport?.totalRevenue ?? 0)));
    lines.push(blankRow());

    // Expenses
    lines.push(row('--- EXPENSES ---', '', '', '', '', ''));
    lines.push(row('Account Code', 'Account Name', 'Entries', 'Total Debit', 'Total Credit', 'Net Balance'));
    (pnlReport?.expenses ?? []).forEach(e => {
        lines.push(row(
            e.accountCode,
            e.accountName,
            e.entries?.length ?? 0,
            lkr(e.totalDebit),
            lkr(e.totalCredit),
            lkr(e.netBalance),
        ));
    });
    lines.push(row('TOTAL EXPENSES', '', '', '', '', lkr(pnlReport?.totalExpenses ?? 0)));
    lines.push(blankRow());
    lines.push(row('NET INCOME / (LOSS)', '', '', '', '', lkr(pnlReport?.netIncome ?? 0)));
    lines.push(blankRow());

    // ── 3. Trial Balance (grouped by account type) ──
    lines.push(sectionHeader('3. Trial Balance'));
    lines.push(row('Account Code', 'Account Name', 'Account Type', 'Total Debit', 'Total Credit', 'Net Activity'));

    const types = ['asset', 'liability', 'equity', 'revenue', 'expense'];
    const typeLabels: Record<string, string> = {
        asset: 'Assets',
        liability: 'Liabilities',
        equity: 'Equity',
        revenue: 'Revenue',
        expense: 'Expenses',
    };

    types.forEach(type => {
        const accounts = (report?.trialBalance ?? []).filter(a => a.accountType === type);
        if (accounts.length === 0) return;

        lines.push(row(`-- ${typeLabels[type]} --`, '', '', '', '', ''));
        accounts.forEach(a => {
            const net = parseFloat(a.totalDebit) - parseFloat(a.totalCredit);
            lines.push(row(
                a.accountCode,
                a.accountName,
                a.accountType,
                lkr(a.totalDebit),
                lkr(a.totalCredit),
                (net >= 0 ? '' : '-') + `LKR ${fmt(Math.abs(net))}`,
            ));
        });
    });
    lines.push(row('TOTAL DEBITS', '', '', lkr(report?.ledgerTotals?.totalDebit ?? 0), '', ''));
    lines.push(row('TOTAL CREDITS', '', '', '', lkr(report?.ledgerTotals?.totalCredit ?? 0), ''));
    lines.push(blankRow());

    // ── 4. Transaction Status Summary ──
    lines.push(sectionHeader('4. Transaction Status Summary'));
    lines.push(row('Status', 'Count', '', '', '', ''));
    Object.entries(report?.statusCounts ?? {}).forEach(([status, count]) => {
        lines.push(row(status.replace('_', ' ').toUpperCase(), count, '', '', '', ''));
    });
    lines.push(blankRow());

    // ── 5. Transaction Type Totals ──
    lines.push(sectionHeader('5. Transaction Type Totals'));
    lines.push(row('Type', 'Total Amount', '', '', '', ''));
    Object.entries(report?.typeTotals ?? {}).forEach(([type, total]) => {
        lines.push(row(type.toUpperCase(), lkr(total), '', '', '', ''));
    });
    lines.push(blankRow());
    lines.push(row('--- END OF REPORT ---', '', '', '', '', ''));

    const csv = lines.join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finova-financial-report-${startDate}-to-${endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// ── PDF Export (HTML → browser print dialog) ─────────────────────────────────

export const exportFinancialPDF = (
    report: ReportsSummary | null,
    pnlReport: ProfitAndLossReport | null,
    startDate: string,
    endDate: string,
) => {
    const generatedAt = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
    const netIncome = pnlReport?.netIncome ?? 0;
    const netColor = netIncome >= 0 ? '#16a34a' : '#dc2626';
    const totalD = parseFloat(String(report?.ledgerTotals?.totalDebit ?? 0));
    const totalC = parseFloat(String(report?.ledgerTotals?.totalCredit ?? 0));
    const isBalanced = Math.abs(totalD - totalC) < 0.01;

    const typeLabels: Record<string, string> = {
        asset: 'Assets', liability: 'Liabilities', equity: 'Equity',
        revenue: 'Revenue', expense: 'Expenses',
    };
    const typeColors: Record<string, string> = {
        asset: '#1d4ed8', liability: '#b45309', equity: '#7c3aed',
        revenue: '#16a34a', expense: '#dc2626',
    };

    const trialByType = (type: string) =>
        (report?.trialBalance ?? []).filter(a => a.accountType === type);

    const trialSection = (type: string) => {
        const rows = trialByType(type);
        if (rows.length === 0) return '';
        const color = typeColors[type] ?? '#374151';
        return `
            <div class="section-group">
                <div class="group-header" style="background:${color}15; border-left:4px solid ${color};">
                    <span style="color:${color}; font-weight:700;">${typeLabels[type]}</span>
                </div>
                <table>
                    <thead><tr>
                        <th>Code</th><th>Account Name</th>
                        <th class="num">Debit (LKR)</th><th class="num">Credit (LKR)</th><th class="num">Net Activity</th>
                    </tr></thead>
                    <tbody>
                        ${rows.map(a => {
                            const net = parseFloat(a.totalDebit) - parseFloat(a.totalCredit);
                            return `<tr>
                                <td class="mono">${a.accountCode}</td>
                                <td>${a.accountName}</td>
                                <td class="num mono">${fmt(a.totalDebit)}</td>
                                <td class="num mono">${fmt(a.totalCredit)}</td>
                                <td class="num mono" style="color:${net >= 0 ? '#1d4ed8' : '#dc2626'}">${net >= 0 ? '+' : ''}${fmt(net)}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>`;
    };

    const statusColors: Record<string, string> = {
        draft: '#6b7280', pending_approval: '#d97706', approved: '#2563eb',
        posted: '#7c3aed', reconciled: '#16a34a', rejected: '#dc2626',
    };

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <title>Finova Financial Report — ${startDate} to ${endDate}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #111827; background: #fff; }

        /* Cover */
        .cover { padding: 48px 60px 32px; border-bottom: 3px solid #4f46e5; }
        .cover h1 { font-size: 26px; font-weight: 800; color: #111827; letter-spacing: -0.5px; }
        .cover .subtitle { font-size: 13px; color: #6b7280; margin-top: 6px; }
        .cover .meta { display: flex; gap: 32px; margin-top: 20px; }
        .cover .meta span { font-size: 11px; color: #374151; }
        .cover .meta strong { color: #111827; }

        /* KPI row */
        .kpi-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; padding: 24px 60px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
        .kpi { padding: 12px 14px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; }
        .kpi .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.6px; color: #6b7280; font-weight: 600; }
        .kpi .value { font-size: 15px; font-weight: 800; margin-top: 4px; }
        .kpi .sub { font-size: 9px; color: #9ca3af; margin-top: 2px; }

        /* Content */
        .content { padding: 28px 60px; }
        .section { margin-bottom: 32px; break-inside: avoid; }
        .section-title { font-size: 14px; font-weight: 700; color: #111827; padding-bottom: 8px; border-bottom: 2px solid #4f46e5; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
        .section-title .badge { font-size: 9px; background: #4f46e5; color: #fff; padding: 2px 8px; border-radius: 99px; }
        .section-group { margin-bottom: 14px; }
        .group-header { padding: 6px 12px; border-radius: 4px; margin-bottom: 6px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }

        /* Tables */
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th { background: #f3f4f6; padding: 7px 10px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #d1d5db; }
        td { padding: 6px 10px; border-bottom: 1px solid #f3f4f6; color: #374151; }
        tr:last-child td { border-bottom: none; }
        .num { text-align: right; }
        .mono { font-family: 'Courier New', monospace; }
        .total-row td { font-weight: 700; background: #f9fafb; border-top: 2px solid #d1d5db; }
        .net-row td { font-weight: 800; font-size: 12px; background: #f0fdf4; border-top: 2px solid #16a34a; }

        /* Status badges */
        .status-badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 9px; font-weight: 600; }

        /* Grid for side-by-side */
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

        /* Footer */
        .footer { padding: 16px 60px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 9px; color: #9ca3af; }

        @media print {
            @page { size: A4; margin: 0; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-break { break-inside: avoid; }
        }
    </style>
</head>
<body>

<!-- ═══ COVER ═══ -->
<div class="cover">
    <h1>&#9654; Finova &mdash; Financial &amp; Accounting Report</h1>
    <p class="subtitle">Comprehensive financial statements, trial balance, and transaction analytics</p>
    <div class="meta">
        <span><strong>Period:</strong> ${startDate} &rarr; ${endDate}</span>
        <span><strong>Generated:</strong> ${generatedAt}</span>
        <span><strong>Status:</strong> <span style="color:${isBalanced ? '#16a34a' : '#dc2626'}; font-weight:700;">${isBalanced ? '✓ Ledger Balanced' : '⚠ Ledger Out of Balance'}</span></span>
    </div>
</div>

<!-- ═══ KPI ROW ═══ -->
<div class="kpi-row">
    <div class="kpi">
        <div class="label">Total Transactions</div>
        <div class="value" style="color:#111827;">${report?.totalTransactions ?? 0}</div>
        <div class="sub">Selected period</div>
    </div>
    <div class="kpi">
        <div class="label">Total Revenue</div>
        <div class="value" style="color:#16a34a;">LKR ${fmt(pnlReport?.totalRevenue ?? 0)}</div>
        <div class="sub">Revenue accounts</div>
    </div>
    <div class="kpi">
        <div class="label">Total Expenses</div>
        <div class="value" style="color:#ea580c;">LKR ${fmt(pnlReport?.totalExpenses ?? 0)}</div>
        <div class="sub">Expense accounts</div>
    </div>
    <div class="kpi">
        <div class="label">Net Income</div>
        <div class="value" style="color:${netColor};">LKR ${fmt(netIncome)}</div>
        <div class="sub">${netIncome >= 0 ? 'Profit' : 'Loss'} for period</div>
    </div>
</div>

<div class="content">

<!-- ═══ SECTION 1: P&L ═══ -->
<div class="section no-break">
    <div class="section-title">
        <span class="badge">1</span> Profit &amp; Loss Statement
    </div>
    <div class="two-col">
        <!-- Revenue -->
        <div class="section-group">
            <div class="group-header" style="background:#f0fdf4; border-left:4px solid #16a34a;">
                <span style="color:#16a34a; font-weight:700;">Revenue</span>
            </div>
            <table>
                <thead><tr>
                    <th>Code</th><th>Account</th><th class="num">Net Balance (LKR)</th>
                </tr></thead>
                <tbody>
                    ${(pnlReport?.revenues ?? []).map(r => `
                        <tr>
                            <td class="mono">${r.accountCode}</td>
                            <td>${r.accountName} <span style="color:#9ca3af;font-size:9px;">(${r.entries?.length ?? 0} entries)</span></td>
                            <td class="num mono">${fmt(r.netBalance)}</td>
                        </tr>`).join('')}
                    <tr class="total-row">
                        <td colspan="2">Total Revenue</td>
                        <td class="num mono" style="color:#16a34a;">LKR ${fmt(pnlReport?.totalRevenue ?? 0)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <!-- Expenses -->
        <div class="section-group">
            <div class="group-header" style="background:#fef2f2; border-left:4px solid #dc2626;">
                <span style="color:#dc2626; font-weight:700;">Expenses</span>
            </div>
            <table>
                <thead><tr>
                    <th>Code</th><th>Account</th><th class="num">Net Balance (LKR)</th>
                </tr></thead>
                <tbody>
                    ${(pnlReport?.expenses ?? []).map(e => `
                        <tr>
                            <td class="mono">${e.accountCode}</td>
                            <td>${e.accountName} <span style="color:#9ca3af;font-size:9px;">(${e.entries?.length ?? 0} entries)</span></td>
                            <td class="num mono">${fmt(e.netBalance)}</td>
                        </tr>`).join('')}
                    <tr class="total-row">
                        <td colspan="2">Total Expenses</td>
                        <td class="num mono" style="color:#ea580c;">LKR ${fmt(pnlReport?.totalExpenses ?? 0)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    <!-- Net Income row -->
    <table style="margin-top:12px;">
        <tbody>
            <tr class="net-row">
                <td style="font-size:13px;">Net Income / (Loss)</td>
                <td class="num mono" style="color:${netColor}; font-size:13px;">LKR ${fmt(netIncome)}</td>
            </tr>
        </tbody>
    </table>
</div>

<!-- ═══ SECTION 2: Trial Balance ═══ -->
<div class="section">
    <div class="section-title">
        <span class="badge">2</span> Trial Balance (by Account Type)
    </div>
    ${['asset', 'liability', 'equity', 'revenue', 'expense'].map(trialSection).join('')}
    <!-- Totals -->
    <table style="margin-top:10px;">
        <tbody>
            <tr class="total-row">
                <td><strong>Grand Total</strong></td>
                <td></td>
                <td class="num mono"><strong>LKR ${fmt(report?.ledgerTotals?.totalDebit ?? 0)}</strong></td>
                <td class="num mono"><strong>LKR ${fmt(report?.ledgerTotals?.totalCredit ?? 0)}</strong></td>
                <td class="num" style="color:${isBalanced ? '#16a34a' : '#dc2626'}; font-weight:800;">
                    ${isBalanced ? '✓ BALANCED' : `⚠ OFF: LKR ${fmt(Math.abs(totalD - totalC))}`}
                </td>
            </tr>
        </tbody>
    </table>
</div>

<!-- ═══ SECTION 3: Transaction Summary ═══ -->
<div class="section two-col no-break">
    <!-- Status distribution -->
    <div>
        <div class="section-title" style="font-size:12px;">
            <span class="badge">3a</span> Status Distribution
        </div>
        <table>
            <thead><tr><th>Status</th><th class="num">Count</th></tr></thead>
            <tbody>
                ${Object.entries(report?.statusCounts ?? {}).map(([status, count]) => `
                    <tr>
                        <td>
                            <span class="status-badge" style="background:${statusColors[status] ?? '#6b7280'}22; color:${statusColors[status] ?? '#6b7280'};">
                                ${status.replace('_', ' ').toUpperCase()}
                            </span>
                        </td>
                        <td class="num"><strong>${count}</strong></td>
                    </tr>`).join('')}
                <tr class="total-row">
                    <td>Total Transactions</td>
                    <td class="num">${report?.totalTransactions ?? 0}</td>
                </tr>
            </tbody>
        </table>
    </div>
    <!-- Type totals -->
    <div>
        <div class="section-title" style="font-size:12px;">
            <span class="badge">3b</span> Type Totals
        </div>
        <table>
            <thead><tr><th>Type</th><th class="num">Amount (LKR)</th></tr></thead>
            <tbody>
                ${Object.entries(report?.typeTotals ?? {}).map(([type, total]) => `
                    <tr>
                        <td style="text-transform:capitalize;">${type}</td>
                        <td class="num mono">${fmt(total as number)}</td>
                    </tr>`).join('')}
            </tbody>
        </table>
    </div>
</div>

</div><!-- /content -->

<div class="footer">
    <span>Finova Financial Management System &mdash; Confidential</span>
    <span>Report Period: ${startDate} to ${endDate} &bull; Generated: ${generatedAt}</span>
</div>

<script>window.onload = () => window.print();</script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=1000,height=700');
    if (!win) {
        alert('Please allow pop-ups to export PDF.');
        return;
    }
    win.document.write(html);
    win.document.close();
};
