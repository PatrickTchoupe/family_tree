from sqlmodel import SQLModel, Field
from datetime import datetime, date
from enum import Enum
import uuid

class RelationshipType(str, Enum):
    parent_child = "parent_child"
    spouse = "spouse"
    partner = "partner"

class Relationship(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    tree_id: uuid.UUID = Field(foreign_key="tree.id", index=True)
    person_a_id: uuid.UUID = Field(foreign_key="person.id", index=True)
    person_b_id: uuid.UUID = Field(foreign_key="person.id", index=True)
    type: RelationshipType
    start_date: date | None = None
    end_date: date | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)