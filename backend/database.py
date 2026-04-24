from datetime import datetime, timezone
import os
from pathlib import Path

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, create_engine
from sqlalchemy.orm import Mapped, declarative_base, mapped_column, relationship, sessionmaker

Base = declarative_base()

DB_PATH = Path(__file__).resolve().parent / "spend_mind_analyzer.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

engine_kwargs = {}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class MoodEntry(Base):
    __tablename__ = "mood_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(String(100), default="anonymous", index=True)
    session_id: Mapped[str] = mapped_column(String(100), default="default", index=True)
    text: Mapped[str] = mapped_column(String, default="")
    emotion: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    score: Mapped[float] = mapped_column(Float, default=0.0)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    transactions: Mapped[list["Transaction"]] = relationship(
        "Transaction",
        back_populates="mood_entry",
    )


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(String(100), default="anonymous", index=True)
    session_id: Mapped[str] = mapped_column(String(100), default="default", index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str] = mapped_column(String, default="")
    category: Mapped[str] = mapped_column(String(100), default="")
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    mood_entry_id: Mapped[int | None] = mapped_column(ForeignKey("mood_entries.id"), nullable=True, index=True)

    mood_entry: Mapped[MoodEntry | None] = relationship(
        "MoodEntry",
        back_populates="transactions",
    )


def init_db() -> None:
    Base.metadata.create_all(bind=engine)