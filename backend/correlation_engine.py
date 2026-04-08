import pandas as pd

class SpendingTriggerAnalyzer:
    def __init__(self, data: pd.DataFrame):
        self.data = data

    def detect_triggers(self, threshold: float) -> pd.DataFrame:
        """Detect spending triggers based on a specified threshold."""
        triggers = self.data[self.data['amount'] > threshold]
        return triggers

    def correlate_spending(self, other_data: pd.DataFrame) -> pd.DataFrame:
        """Calculate correlation between categories of spending."""
        combined_data = pd.merge(self.data, other_data, on='category', suffixes=('_self', '_other'))
        correlation = combined_data.corr()
        return correlation

# Sample usage
if __name__ == '__main__':
    # Load your spending data
    spending_data = pd.read_csv('path_to_your_spending_data.csv')
    analyzer = SpendingTriggerAnalyzer(spending_data)

    # Detect spending triggers
    triggers = analyzer.detect_triggers(threshold=100.0)
    print(triggers)

    # Example correlation with another dataset
    # other_data = pd.read_csv('path_to_other_data.csv')
    # correlation_result = analyzer.correlate_spending(other_data)
    # print(correlation_result)