from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr
from datetime import datetime

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "patient"
    age: Optional[int] = None
    medical_history: Optional[str] = None
    specialization: Optional[str] = None
    hospital_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    medical_history: Optional[str] = None
    specialization: Optional[str] = None
    hospital_name: Optional[str] = None
    password: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordWithOtp(BaseModel):
    email: EmailStr
    otp: str
    password: str
    confirm_password: str

class UserInDBBase(UserBase):
    id: int
    is_active: bool
    is_verified: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass

# --- Prediction Schemas ---
class PredictionBase(BaseModel):
    features_json: str
    prediction_result: str
    confidence: float
    notes: Optional[str] = None

class PredictionCreate(PredictionBase):
    patient_id: Optional[int] = None

class Prediction(PredictionBase):
    id: int
    doctor_id: Optional[int] = None
    patient_id: Optional[int] = None
    report_pdf_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class PredictionInput(BaseModel):
    features: List[float]
    patient_id: Optional[int] = None
    notes: Optional[str] = None

class BatchPredictionResponse(BaseModel):
    filename: str
    results: List[Dict[str, Any]]

class SelfAssessmentInput(BaseModel):
    responses: Dict[str, Any]

class SelfAssessmentResponse(BaseModel):
    level: str
    score: int
    factors: List[str]
    recommendations: List[str]
    ai_recommendations: Optional[str] = None
    disclaimer: str
    report_pdf_url: Optional[str] = None

# --- Appointment Schemas ---
class AppointmentBase(BaseModel):
    appointment_date: datetime
    reason: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    doctor_id: int

class AppointmentUpdate(BaseModel):
    status: str
    appointment_date: Optional[datetime] = None

class Appointment(AppointmentBase):
    id: int
    patient_id: int
    doctor_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Community Schemas ---
class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    pass

class Comment(CommentBase):
    id: int
    post_id: int
    author_id: int
    is_verified_answer: bool
    created_at: datetime
    author: User

    class Config:
        from_attributes = True

class PostBase(BaseModel):
    title: str
    content: str

class PostCreate(PostBase):
    pass

class Post(PostBase):
    id: int
    author_id: int
    created_at: datetime
    author: User
    comments: List[Comment] = []

    class Config:
        from_attributes = True
