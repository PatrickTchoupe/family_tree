from sqlmodel import SQLModel, Field
from datetime import datetime
from enum import Enum
import uuid

class MembershipRole(str, Enum):
    owner = "owner"
    editor = "editor"
    viewer = "viewer"

class TreeMembership(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    tree_id: uuid.UUID = Field(foreign_key="tree.id", index=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    role: MembershipRole = Field(default=MembershipRole.viewer)
    invited_at: datetime = Field(default_factory=datetime.utcnow)