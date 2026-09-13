from sqlmodel import SQLModel, Field
from datetime import datetime, date
from enum import Enum
import uuid

class Gender(str, Enum):
    male = "male"
    female = "female"
    other = "other"
    unknown = "unknown"

class Person(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    tree_id: uuid.UUID = Field(foreign_key="tree.id", index=True)
    first_name: str
    last_name: str | None = None
    gender: Gender = Field(default=Gender.unknown)
    birth_date: date | None = None
    death_date: date | None = None
    birth_place: str | None = None
    notes: str | None = None
    photo_url: str | None = None
    linked_user_id: uuid.UUID | None = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)