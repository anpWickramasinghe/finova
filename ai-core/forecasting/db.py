import os
import asyncpg
import pandas as pd
from dotenv import load_dotenv
from typing import List, Dict

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def get_db_connection():
    return await asyncpg.connect(DATABASE_URL, statement_cache_size=0)

async def fetch_historical_cash_flow() -> pd.DataFrame:
    """
    Fetches daily net cash flow from ledger_entry joined with chart_of_accounts.
    Focuses on 'asset' type accounts (Cash/Bank).
    """
    conn = await get_db_connection()
    try:
        # Sum (debit - credit) for asset accounts per day
        query = """
            SELECT 
                DATE(date) as date,
                SUM(debit - credit) as net_flow
            FROM ledger_entry le
            JOIN chart_of_accounts coa ON le."accountId" = coa.id
            WHERE coa.type = 'asset'
            GROUP BY DATE(date)
            ORDER BY date ASC;
        """
        rows = await conn.fetch(query)
        
        if not rows:
            return pd.DataFrame(columns=['date', 'net_flow'])
            
        df = pd.DataFrame(rows, columns=['date', 'net_flow'])
        df['date'] = pd.to_datetime(df['date'])
        df['net_flow'] = pd.to_numeric(df['net_flow'])
        return df
    finally:
        await conn.close()

async def fetch_account_balances() -> List[Dict]:
    """
    Fetches current balances for all accounts for verification.
    """
    conn = await get_db_connection()
    try:
        query = """
            SELECT 
                coa.name, 
                coa.type,
                SUM(le.debit - le.credit) as balance
            FROM chart_of_accounts coa
            LEFT JOIN ledger_entry le ON coa.id = le."accountId"
            GROUP BY coa.name, coa.type;
        """
        rows = await conn.fetch(query)
        return [dict(row) for row in rows]
    finally:
        await conn.close()
