from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User, Appointment
from app.schemas import Appointment as AppointmentSchema, AppointmentCreate, AppointmentUpdate
from app.core.dependencies import get_current_user

router = APIRouter()

@router.post("/", response_model=AppointmentSchema)
def book_appointment(
    appt_in: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can book appointments")
        
    doctor = db.query(User).filter(User.id == appt_in.doctor_id, User.role == "doctor").first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    db_appt = Appointment(
        patient_id=current_user.id,
        doctor_id=appt_in.doctor_id,
        appointment_date=appt_in.appointment_date,
        reason=appt_in.reason,
        status="Pending"
    )
    db.add(db_appt)
    db.commit()
    db.refresh(db_appt)
    return db_appt

@router.get("/", response_model=List[AppointmentSchema])
def list_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "patient":
        return db.query(Appointment).filter(Appointment.patient_id == current_user.id).all()
    elif current_user.role == "doctor":
        return db.query(Appointment).filter(Appointment.doctor_id == current_user.id).all()
    return db.query(Appointment).all() # Admin gets all

@router.put("/{appt_id}", response_model=AppointmentSchema)
def update_appointment(
    appt_id: int,
    appt_in: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    if current_user.role == "doctor" and appt.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your appointment")
        
    appt.status = appt_in.status
    if appt_in.appointment_date:
        appt.appointment_date = appt_in.appointment_date
        
    db.commit()
    db.refresh(appt)
    return appt
