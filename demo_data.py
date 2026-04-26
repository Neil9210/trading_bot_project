import pandas as pd
import numpy as np

def generate_stock_data():
    np.random.seed(42)

    dates = pd.date_range(end=pd.Timestamp.today(), periods=100)

    price = np.cumsum(np.random.randn(100)) + 100

    data = pd.DataFrame({
        "Date": dates,
        "Open": price + np.random.rand(100),
        "High": price + np.random.rand(100) * 2,
        "Low": price - np.random.rand(100) * 2,
        "Close": price,
        "Volume": np.random.randint(1000, 5000, size=100)
    })

    return data
