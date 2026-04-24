import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor
from typing import List, Dict

class CashFlowForecaster:
    def __init__(self, historical_data: pd.DataFrame):
        """
        historical_data: DataFrame with columns ['date', 'net_flow']
        """
        self.df = historical_data
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self._prepare_data()

    def _prepare_data(self):
        if self.df.empty:
            return

        # Ensure date range is continuous
        self.df['date'] = pd.to_datetime(self.df['date'])
        self.df.set_index('date', inplace=True)
        
        start_date = self.df.index.min()
        end_date = self.df.index.max()
        
        # Reindex to fill missing days with 0 flow
        all_dates = pd.date_range(start=start_date, end=end_date, freq='D')
        self.df = self.df.reindex(all_dates, fill_value=0)
        self.df.index.name = 'date'
        self.df.reset_index(inplace=True)

    def _create_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df['day_of_week'] = df['date'].dt.dayofweek
        df['day_of_month'] = df['date'].dt.day
        df['month'] = df['date'].dt.month
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        df['is_month_start'] = (df['day_of_month'] <= 3).astype(int)
        df['is_month_end'] = (df['day_of_month'] >= 28).astype(int)
        return df.drop(columns=['date'])

    def train(self):
        if self.df.empty or len(self.df) < 7:
            # Not enough data to train meaningful model
            return False
            
        X = self._create_features(self.df[['date']])
        y = self.df['net_flow']
        
        self.model.fit(X, y)
        return True

    def predict(self, days: int = 30) -> List[Dict]:
        if self.df.empty:
            # Baseline: today is 0, future is 0
            return self._mock_prediction(days)

        # Get the last date in history
        last_date = self.df['date'].max()
        future_dates = [last_date + timedelta(days=i+1) for i in range(days)]
        future_df = pd.DataFrame({'date': future_dates})
        
        # Prepare features for future
        X_future = self._create_features(future_df)
        
        # Predict if model is trained, else use mean/0
        try:
            predictions = self.model.predict(X_future)
        except Exception:
            predictions = np.zeros(days)
            
        # Compile results
        results = []
        current_balance = 0 # This will be adjusted by backend or added here if we had start balance
        
        for i, date in enumerate(future_dates):
            results.append({
                "date": date.strftime("%Y-%m-%d"),
                "predicted_flow": float(predictions[i]),
                "type": "inflow" if predictions[i] >= 0 else "outflow"
            })
            
        return results

    def _mock_prediction(self, days: int) -> List[Dict]:
        """Fallback prediction when no data exists."""
        today = datetime.now()
        results = []
        for i in range(days):
            date = today + timedelta(days=i+1)
            results.append({
                "date": date.strftime("%Y-%m-%d"),
                "predicted_flow": 0.0,
                "type": "inflow"
            })
        return results
