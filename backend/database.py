from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

class MoodEntry(Base):
    __tablename__ = 'mood_entries'

    id = Column(Integer, primary_key=True)
    mood = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False)

    def __repr__(self):
        return f"<MoodEntry(mood={{self.mood}}, timestamp={{self.timestamp}})>"

class Transaction(Base):
    __tablename__ = 'transactions'

    id = Column(Integer, primary_key=True)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    mood_entry_id = Column(Integer, ForeignKey('mood_entries.id'))

    def __repr__(self):
        return f"<Transaction(amount={{self.amount}}, category={{self.category}}, timestamp={{self.timestamp}})>"

# Database connection and session setup
DATABASE_URL = "sqlite:///spend_mind_analyzer.db"  # Example database URL
engine = create_engine(DATABASE_URL)
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)