import { db } from '../config/db.js';
import { chart_of_accounts } from '../db/schema.js';
import { v4 as uuidv4 } from 'uuid';

// Standard Chart of Accounts (1xxx-6xxx scheme)
const defaultAccounts = [
    // 1xxx - Assets
    { code: '1000', name: 'Cash', type: 'asset', subType: 'current_asset', normalBalance: 'debit', isSystem: true },
    { code: '1010', name: 'Petty Cash', type: 'asset', subType: 'current_asset', normalBalance: 'debit', isSystem: true },
    { code: '1100', name: 'Bank Account', type: 'asset', subType: 'current_asset', normalBalance: 'debit', isSystem: true },
    { code: '1200', name: 'Accounts Receivable', type: 'asset', subType: 'current_asset', normalBalance: 'debit', isSystem: true },
    { code: '1300', name: 'Inventory', type: 'asset', subType: 'current_asset', normalBalance: 'debit', isSystem: false },
    { code: '1400', name: 'Prepaid Expenses', type: 'asset', subType: 'current_asset', normalBalance: 'debit', isSystem: false },
    { code: '1500', name: 'Fixed Assets - Equipment', type: 'asset', subType: 'fixed_asset', normalBalance: 'debit', isSystem: true },
    { code: '1510', name: 'Fixed Assets - Furniture', type: 'asset', subType: 'fixed_asset', normalBalance: 'debit', isSystem: false },
    { code: '1600', name: 'Accumulated Depreciation', type: 'asset', subType: 'fixed_asset', normalBalance: 'credit', isSystem: true },

    // 2xxx - Liabilities
    { code: '2000', name: 'Accounts Payable', type: 'liability', subType: 'current_liability', normalBalance: 'credit', isSystem: true },
    { code: '2100', name: 'Accrued Expenses', type: 'liability', subType: 'current_liability', normalBalance: 'credit', isSystem: false },
    { code: '2200', name: 'Salaries Payable', type: 'liability', subType: 'current_liability', normalBalance: 'credit', isSystem: true },
    { code: '2300', name: 'Tax Payable', type: 'liability', subType: 'current_liability', normalBalance: 'credit', isSystem: true },
    { code: '2400', name: 'EPF/ETF Payable', type: 'liability', subType: 'current_liability', normalBalance: 'credit', isSystem: true },
    { code: '2500', name: 'Bank Loan', type: 'liability', subType: 'long_term_liability', normalBalance: 'credit', isSystem: false },

    // 3xxx - Equity
    { code: '3000', name: 'Owner\'s Capital', type: 'equity', subType: 'owner_equity', normalBalance: 'credit', isSystem: true },
    { code: '3100', name: 'Retained Earnings', type: 'equity', subType: 'retained_earnings', normalBalance: 'credit', isSystem: true },
    { code: '3200', name: 'Drawings', type: 'equity', subType: 'owner_equity', normalBalance: 'debit', isSystem: false },

    // 4xxx - Revenue
    { code: '4000', name: 'Sales Revenue', type: 'revenue', subType: 'operating_revenue', normalBalance: 'credit', isSystem: true },
    { code: '4100', name: 'Service Revenue', type: 'revenue', subType: 'operating_revenue', normalBalance: 'credit', isSystem: true },
    { code: '4200', name: 'Interest Income', type: 'revenue', subType: 'other_revenue', normalBalance: 'credit', isSystem: false },
    { code: '4300', name: 'Other Income', type: 'revenue', subType: 'other_revenue', normalBalance: 'credit', isSystem: false },

    // 5xxx - Cost of Goods Sold
    { code: '5000', name: 'Cost of Goods Sold', type: 'expense', subType: 'cogs', normalBalance: 'debit', isSystem: true },
    { code: '5100', name: 'Direct Labor', type: 'expense', subType: 'cogs', normalBalance: 'debit', isSystem: false },
    { code: '5200', name: 'Direct Materials', type: 'expense', subType: 'cogs', normalBalance: 'debit', isSystem: false },

    // 6xxx - Operating Expenses
    { code: '6000', name: 'Salary Expense', type: 'expense', subType: 'operating_expense', normalBalance: 'debit', isSystem: true },
    { code: '6100', name: 'Rent Expense', type: 'expense', subType: 'operating_expense', normalBalance: 'debit', isSystem: true },
    { code: '6200', name: 'Office Supplies', type: 'expense', subType: 'operating_expense', normalBalance: 'debit', isSystem: false },
    { code: '6300', name: 'Bank Charges', type: 'expense', subType: 'operating_expense', normalBalance: 'debit', isSystem: true },
    { code: '6400', name: 'Utilities Expense', type: 'expense', subType: 'operating_expense', normalBalance: 'debit', isSystem: true },
    { code: '6500', name: 'Insurance Expense', type: 'expense', subType: 'operating_expense', normalBalance: 'debit', isSystem: false },
    { code: '6600', name: 'Depreciation Expense', type: 'expense', subType: 'operating_expense', normalBalance: 'debit', isSystem: true },
    { code: '6700', name: 'Travel Expense', type: 'expense', subType: 'operating_expense', normalBalance: 'debit', isSystem: false },
    { code: '6800', name: 'Marketing Expense', type: 'expense', subType: 'operating_expense', normalBalance: 'debit', isSystem: false },
    { code: '6900', name: 'Miscellaneous Expense', type: 'expense', subType: 'operating_expense', normalBalance: 'debit', isSystem: false },
];

async function seedChartOfAccounts() {
    console.log('🏦 Seeding Chart of Accounts...');

    for (const acct of defaultAccounts) {
        try {
            await db.insert(chart_of_accounts).values({
                id: uuidv4(),
                code: acct.code,
                name: acct.name,
                type: acct.type,
                subType: acct.subType,
                normalBalance: acct.normalBalance,
                isSystem: acct.isSystem,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`  ✅ ${acct.code} - ${acct.name}`);
        } catch (err: any) {
            if (err.code === '23505') {
                console.log(`  ⏭️  ${acct.code} - ${acct.name} (already exists)`);
            } else {
                console.error(`  ❌ ${acct.code} - ${acct.name}:`, err.message);
            }
        }
    }

    console.log('\n✅ Chart of Accounts seeding complete!');
    process.exit(0);
}

seedChartOfAccounts();
