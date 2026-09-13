from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
import uuid

from app.database import get_session
from app.models.tree import Tree

router = APIRouter(prefix="/trees", tags=["trees"])


@router.post("/", response_model=Tree)
def create_tree(tree: Tree, session: Session = Depends(get_session)):
    session.add(tree)
    session.commit()
    session.refresh(tree)
    return tree


@router.get("/", response_model=list[Tree])
def list_trees(session: Session = Depends(get_session)):
    return session.exec(select(Tree)).all()


@router.get("/{tree_id}", response_model=Tree)
def get_tree(tree_id: uuid.UUID, session: Session = Depends(get_session)):
    tree = session.get(Tree, tree_id)
    if not tree:
        raise HTTPException(status_code=404, detail="Tree not found")
    return tree