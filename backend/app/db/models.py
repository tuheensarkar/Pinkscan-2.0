import enum
from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base

class RoleEnum(str, enum.Enum):
    patient = "patient"
    doctor = "doctor"
    admin = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.patient, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    email_verification_otp_hash = Column(String, nullable=True)
    email_verification_otp_expires_at = Column(DateTime(timezone=True), nullable=True)
    password_reset_otp_hash = Column(String, nullable=True)
    password_reset_otp_expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Patient details
    age = Column(Integer, nullable=True)
    medical_history = Column(Text, nullable=True)

    # Doctor details
    specialization = Column(String, nullable=True)
    hospital_name = Column(String, nullable=True)

    # Relationships
    predictions = relationship("Prediction", back_populates="patient", foreign_keys="[Prediction.patient_id]")
    doctor_predictions = relationship("Prediction", back_populates="doctor", foreign_keys="[Prediction.doctor_id]")
    posts = relationship("Post", back_populates="author")
    comments = relationship("Comment", back_populates="author")
    appointments_as_patient = relationship("Appointment", back_populates="patient", foreign_keys="[Appointment.patient_id]")
    appointments_as_doctor = relationship("Appointment", back_populates="doctor", foreign_keys="[Appointment.doctor_id]")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Can be null for batch or doctor test
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    features_json = Column(Text, nullable=False)  # JSON string of input features
    prediction_result = Column(String, nullable=False) # e.g., "Malignant", "Benign"
    confidence = Column(Float, nullable=False)
    report_pdf_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)

    # Relationships
    patient = relationship("User", back_populates="predictions", foreign_keys=[patient_id])
    doctor = relationship("User", back_populates="doctor_predictions", foreign_keys=[doctor_id])


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    appointment_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, default="Pending") # Pending, Approved, Rejected, Completed
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("User", back_populates="appointments_as_patient", foreign_keys=[patient_id])
    doctor = relationship("User", back_populates="appointments_as_doctor", foreign_keys=[doctor_id])


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    author = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_verified_answer = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    post = relationship("Post", back_populates="comments")
    author = relationship("User", back_populates="comments")