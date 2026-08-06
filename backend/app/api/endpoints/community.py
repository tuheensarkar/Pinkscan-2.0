from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User, Post, Comment
from app.schemas import Post as PostSchema, PostCreate, Comment as CommentSchema, CommentCreate
from app.core.dependencies import get_current_user

router = APIRouter()

@router.get("/posts", response_model=List[PostSchema])
def get_posts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Post).order_by(Post.created_at.desc()).offset(skip).limit(limit).all()

@router.post("/posts", response_model=PostSchema)
def create_post(
    post_in: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = Post(title=post_in.title, content=post_in.content, author_id=current_user.id)
    db.add(post)
    db.commit()
    db.refresh(post)
    return post

@router.post("/posts/{post_id}/comments", response_model=CommentSchema)
def create_comment(
    post_id: int,
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    is_verified = (current_user.role == "doctor")
    
    comment = Comment(
        content=comment_in.content,
        post_id=post.id,
        author_id=current_user.id,
        is_verified_answer=is_verified
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment
