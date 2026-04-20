from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "groceries": ["grocery", "supermarket", "mart", "food"],
    "dining": ["restaurant", "cafe", "coffee", "swiggy", "zomato", "ubereats"],
    "transport": ["uber", "lyft", "metro", "fuel", "gas", "petrol", "taxi"],
    "utilities": ["electric", "water", "internet", "wifi", "phone", "utility"],
    "subscriptions": ["netflix", "spotify", "prime", "subscription", "youtube"],
    "shopping": ["amazon", "flipkart", "shop", "mall", "store"],
    "health": ["pharmacy", "clinic", "hospital", "medicine", "doctor"],
    "entertainment": ["movie", "cinema", "game", "concert"],
    "rent": ["rent", "landlord", "lease"],
}


@dataclass
class AnalyzerConfig:
    max_clusters: int = 3
    anomaly_fraction: float = 0.08
    recurring_min_occurrences: int = 3
    recurring_cv_threshold: float = 0.35


class SpendingMindAnalyzer:
    """Analyze spending data for patterns, anomalies, and recurring expenses."""

    def __init__(self, config: AnalyzerConfig | None = None):
        self.config = config or AnalyzerConfig()

    def analyze(self, transactions: List[Dict]) -> Dict:
        frame = self.clean_transactions(transactions)
        if frame.empty:
            return {
                "total_transactions": 0,
                "total_spend": 0.0,
                "spend_by_category": {},
                "clusters": [],
                "anomalies": [],
                "recurring_expenses": [],
            }

        summary = self._category_summary(frame)
        clusters = self._cluster_categories(summary)
        anomalies = self._detect_anomalies(frame)
        recurring = self._detect_recurring_expenses(frame)

        return {
            "total_transactions": int(len(frame)),
            "total_spend": round(float(frame["amount"].sum()), 2),
            "spend_by_category": {
                str(k): round(float(v), 2) for k, v in frame.groupby("category")["amount"].sum().to_dict().items()
            },
            "clusters": clusters,
            "anomalies": anomalies,
            "recurring_expenses": recurring,
        }

    def clean_transactions(self, transactions: List[Dict]) -> pd.DataFrame:
        frame = pd.DataFrame(transactions)
        if frame.empty:
            return frame

        if "amount" not in frame.columns:
            frame["amount"] = np.nan
        if "date" not in frame.columns:
            frame["date"] = pd.NaT
        if "description" not in frame.columns:
            frame["description"] = ""
        if "category" not in frame.columns:
            frame["category"] = ""

        frame["amount"] = pd.to_numeric(frame["amount"], errors="coerce")
        frame["date"] = pd.to_datetime(frame["date"], errors="coerce", utc=True)
        frame["description"] = frame["description"].fillna("").astype(str)
        frame["category"] = frame["category"].fillna("").astype(str).str.strip().str.lower()

        frame = frame.dropna(subset=["amount", "date"]).copy()
        frame = frame[frame["amount"] > 0].copy()
        frame["category"] = frame.apply(
            lambda row: row["category"] if row["category"] else self._infer_category(row["description"]),
            axis=1,
        )

        frame["merchant_key"] = (
            frame["description"].str.lower().str.replace(r"[^a-z0-9\s]", "", regex=True).str.strip().replace("", "unknown")
        )
        frame = frame.sort_values("date").reset_index(drop=True)
        return frame

    def _infer_category(self, description: str) -> str:
        text = (description or "").lower()
        for category, keywords in CATEGORY_KEYWORDS.items():
            if any(keyword in text for keyword in keywords):
                return category
        return "other"

    def _category_summary(self, frame: pd.DataFrame) -> pd.DataFrame:
        summary = (
            frame.groupby("category")
            .agg(total_spend=("amount", "sum"), avg_spend=("amount", "mean"), txn_count=("amount", "count"))
            .reset_index()
        )
        summary["total_spend"] = summary["total_spend"].astype(float)
        summary["avg_spend"] = summary["avg_spend"].astype(float)
        summary["txn_count"] = summary["txn_count"].astype(float)
        return summary

    def _cluster_categories(self, summary: pd.DataFrame) -> List[Dict]:
        if summary.empty:
            return []

        if len(summary) == 1:
            return [
                {
                    "category": str(summary.iloc[0]["category"]),
                    "cluster": 0,
                    "total_spend": round(float(summary.iloc[0]["total_spend"]), 2),
                    "avg_spend": round(float(summary.iloc[0]["avg_spend"]), 2),
                    "txn_count": int(summary.iloc[0]["txn_count"]),
                }
            ]

        n_clusters = min(self.config.max_clusters, len(summary))
        features = summary[["total_spend", "avg_spend", "txn_count"]].to_numpy()
        scaled = StandardScaler().fit_transform(features)
        model = KMeans(n_clusters=n_clusters, n_init=10, random_state=42)
        labels = model.fit_predict(scaled)

        result: List[Dict] = []
        for idx, row in summary.iterrows():
            result.append(
                {
                    "category": str(row["category"]),
                    "cluster": int(labels[idx]),
                    "total_spend": round(float(row["total_spend"]), 2),
                    "avg_spend": round(float(row["avg_spend"]), 2),
                    "txn_count": int(row["txn_count"]),
                }
            )
        return result

    def _detect_anomalies(self, frame: pd.DataFrame) -> List[Dict]:
        if len(frame) < 6:
            return []

        features = pd.DataFrame(
            {
                "amount": frame["amount"],
                "day_of_month": frame["date"].dt.day,
                "day_of_week": frame["date"].dt.weekday,
                "hour": frame["date"].dt.hour,
            }
        )

        model = IsolationForest(contamination=self.config.anomaly_fraction, random_state=42)
        preds = model.fit_predict(features)
        anomaly_rows = frame[preds == -1].copy()

        return [
            {
                "date": row["date"].isoformat(),
                "amount": round(float(row["amount"]), 2),
                "category": str(row["category"]),
                "description": str(row["description"]),
            }
            for _, row in anomaly_rows.sort_values("amount", ascending=False).iterrows()
        ]

    def _detect_recurring_expenses(self, frame: pd.DataFrame) -> List[Dict]:
        recurring: List[Dict] = []
        grouped = frame.groupby(["merchant_key", "category"], as_index=False)

        for _, group in grouped:
            if len(group) < self.config.recurring_min_occurrences:
                continue

            sorted_group = group.sort_values("date")
            gaps = sorted_group["date"].diff().dropna().dt.days
            if gaps.empty:
                continue

            avg_gap = float(gaps.mean())
            std_gap = float(gaps.std(ddof=0))
            cv = std_gap / avg_gap if avg_gap > 0 else 1.0

            if cv <= self.config.recurring_cv_threshold and 20 <= avg_gap <= 40:
                recurring.append(
                    {
                        "merchant_key": str(sorted_group.iloc[0]["merchant_key"]),
                        "category": str(sorted_group.iloc[0]["category"]),
                        "occurrences": int(len(sorted_group)),
                        "avg_amount": round(float(sorted_group["amount"].mean()), 2),
                        "estimated_frequency_days": round(avg_gap, 1),
                        "last_seen": sorted_group.iloc[-1]["date"].isoformat(),
                    }
                )

        recurring.sort(key=lambda item: item["occurrences"], reverse=True)
        return recurring