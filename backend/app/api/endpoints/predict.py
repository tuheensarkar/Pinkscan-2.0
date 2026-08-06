import json
import os
import joblib
import httpx
import pandas as pd
from typing import Any, Dict, List, Tuple
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User, Prediction
from app.schemas import (
    PredictionInput,
    Prediction as PredictionSchema,
    BatchPredictionResponse,
    SelfAssessmentInput,
    SelfAssessmentResponse,
)
from app.core.config import settings
from app.core.dependencies import get_current_user, get_current_doctor_or_admin
from app.services.pdf_generator import generate_pdf_report

router = APIRouter()

DISCLAIMER = (
    "This assessment estimates risk based on your responses. It is not a medical "
    "diagnosis and cannot confirm or rule out breast cancer."
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ML_DIR = os.path.join(BASE_DIR, "ml")

# Lazy load models
model = None
scaler = None

def load_ml_assets():
    global model, scaler
    if not model or not scaler:
        try:
            model_path = os.path.join(ML_DIR, 'model.pkl')
            scaler_path = os.path.join(ML_DIR, 'scaler.pkl')
            model = joblib.load(model_path)
            scaler = joblib.load(scaler_path)
        except Exception as e:
            # Model not trained yet, handle gracefully
            print(f"Failed to load ML models: {e}")

def _num(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0

def _calculate_self_assessment(responses: Dict[str, Any]) -> Tuple[str, int, List[str], List[str]]:
    score = 8
    factors: List[str] = []
    recommendations = ["Continue regular self-exams."]

    def add(points: int, label: str):
        nonlocal score
        score += points
        factors.append(label)

    age = _num(responses.get("age"))
    height = _num(responses.get("height")) / 100
    weight = _num(responses.get("weight"))
    bmi = weight / (height * height) if height and weight else 0
    first_menstruation_age = _num(responses.get("firstMenstruationAge"))
    first_childbirth = str(responses.get("firstChildbirthAge", "")).strip().lower()
    first_childbirth_age = _num(first_childbirth)

    if age >= 50:
        add(8, "Age 50 or above")
    elif age >= 40:
        add(4, "Age 40 or above")
    if bmi >= 30:
        add(4, "BMI in the obese range")
    elif bmi >= 25:
        add(2, "BMI in the overweight range")

    checks = [
        ("familyHistory", "yes", 12, "Family history of breast cancer"),
        ("brcaMutation", "yes", 18, "Known BRCA1/BRCA2 mutation"),
        ("previousBiopsy", "yes", 7, "Previous breast biopsy"),
        ("previousCancer", "yes", 20, "Previous breast cancer"),
        ("denseBreastTissue", "yes", 8, "Dense breast tissue"),
        ("menopauseStatus", "post", 4, "Post-menopause status"),
        ("hormoneTherapy", "yes", 6, "Hormone replacement therapy"),
        ("smoking", "yes", 3, "Smoking"),
        ("alcohol", "regular", 3, "Regular alcohol consumption"),
        ("physicalActivity", "low", 4, "Low physical activity"),
        ("diet", "poor", 3, "Diet low in fruits, vegetables, or whole foods"),
    ]
    for key, expected, points, label in checks:
        if responses.get(key) == expected:
            add(points, label)

    if 0 < first_menstruation_age < 12:
        add(4, "Menstruation before age 12")
    if first_childbirth == "none":
        add(5, "No childbirth history")
    elif first_childbirth_age >= 30:
        add(5, "First childbirth at age 30 or later")

    symptom_checks = [
        ("breastLump", 12, "Breast lump"),
        ("breastPain", 5, "Breast pain"),
        ("nippleDischarge", 8, "Nipple discharge"),
        ("skinDimpling", 10, "Skin dimpling"),
        ("breastSizeChange", 7, "Change in breast size or shape"),
        ("swollenLymph", 9, "Swollen lymph nodes"),
    ]
    symptom_count = 0
    for key, points, label in symptom_checks:
        if responses.get(key):
            symptom_count += 1
            add(points, label)

    if symptom_count > 0:
        recommendations.append("Schedule a clinical breast examination.")
    if symptom_count >= 2 or responses.get("breastLump") or responses.get("skinDimpling") or responses.get("nippleDischarge"):
        recommendations.append("Consult a doctor as soon as possible.")

    score = min(round(score), 92)
    level = "High" if score >= 40 else "Moderate" if score >= 20 else "Low"
    if level == "Low":
        recommendations.append("Keep routine screening appointments based on your age and clinician guidance.")
    elif level == "Moderate":
        recommendations.append("Discuss screening frequency and personal risk factors with a healthcare professional.")
    else:
        recommendations.append("Seek medical review promptly for a detailed clinical assessment.")

    return level, score, factors or ["No major risk factors were selected."], recommendations

async def _get_groq_recommendations(level: str, score: int, factors: List[str], recommendations: List[str]) -> str:
    if not settings.GROQ_API_KEY:
        return None

    prompt = (
        "You are assisting a breast cancer risk self-assessment app. "
        "Write concise, patient-friendly recommendations only, no diagnosis. "
        f"Risk level: {level}. Score: {score}%. Factors: {', '.join(factors)}. "
        f"Baseline recommendations: {'; '.join(recommendations)}. "
        f"Include this disclaimer meaning without changing it: {DISCLAIMER}"
    )
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": "You provide careful, non-diagnostic health guidance."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.2,
                    "max_tokens": 260,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"Groq recommendation failed: {e}")
        return None

@router.post("/", response_model=PredictionSchema)
def create_prediction(
    prediction_in: PredictionInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    load_ml_assets()
    if not model or not scaler:
        raise HTTPException(status_code=500, detail="ML model is not trained/available.")
        
    # Scale and predict
    features_df = pd.DataFrame([prediction_in.features])
    features_scaled = scaler.transform(features_df)
    
    # Depending on model (e.g. breast cancer -> 0 malignant, 1 benign usually, but depends on dataset)
    # We will assume a probability output and standard labeling
    prediction_raw = model.predict(features_scaled)[0]
    probabilities = model.predict_proba(features_scaled)[0]
    
    # We assume binary classification 0 or 1.
    class_label = "Malignant" if prediction_raw == 0 else "Benign"
    confidence = float(max(probabilities) * 100)
    
    # PDF report
    pdf_url = None
    if current_user.role == "doctor":
        patient = db.query(User).filter(User.id == prediction_in.patient_id).first()
        p_name = patient.full_name if patient else "Unknown"
        pdf_url = generate_pdf_report(p_name, class_label, confidence, prediction_in.notes)
    else:
        pdf_url = generate_pdf_report(current_user.full_name or current_user.email, class_label, confidence, prediction_in.notes)
        
    db_prediction = Prediction(
        patient_id=prediction_in.patient_id if current_user.role == "doctor" else current_user.id,
        doctor_id=current_user.id if current_user.role == "doctor" else None,
        features_json=json.dumps(prediction_in.features),
        prediction_result=class_label,
        confidence=confidence,
        notes=prediction_in.notes,
        report_pdf_url=pdf_url
    )
    
    db.add(db_prediction)
    db.commit()
    db.refresh(db_prediction)
    return db_prediction

@router.post("/self-assessment", response_model=SelfAssessmentResponse)
async def create_self_assessment(
    assessment_in: SelfAssessmentInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Self assessment is available for patients only.")

    level, score, factors, recommendations = _calculate_self_assessment(assessment_in.responses)
    ai_recommendations = await _get_groq_recommendations(level, score, factors, recommendations)
    details = "\n".join([
        f"Risk Level: {level}",
        f"Risk Score: {score}%",
        "Factors: " + "; ".join(factors),
        "Recommendations: " + "; ".join(recommendations),
        f"AI Recommendations: {ai_recommendations}" if ai_recommendations else "",
        f"Disclaimer: {DISCLAIMER}",
    ]).strip()
    pdf_url = generate_pdf_report(
        current_user.full_name or current_user.email,
        f"{level} Risk",
        score,
        "Patient self-assessment",
        details,
    )

    db_prediction = Prediction(
        patient_id=current_user.id,
        doctor_id=None,
        features_json=json.dumps(assessment_in.responses),
        prediction_result=f"{level} Risk",
        confidence=float(score),
        notes=ai_recommendations or "; ".join(recommendations),
        report_pdf_url=pdf_url,
    )
    db.add(db_prediction)
    db.commit()

    return SelfAssessmentResponse(
        level=level,
        score=score,
        factors=factors,
        recommendations=recommendations,
        ai_recommendations=ai_recommendations,
        disclaimer=DISCLAIMER,
        report_pdf_url=pdf_url,
    )

@router.get("/history", response_model=List[PredictionSchema])
def list_prediction_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "patient":
        return (
            db.query(Prediction)
            .filter(Prediction.patient_id == current_user.id, Prediction.doctor_id.is_(None))
            .order_by(Prediction.created_at.desc())
            .all()
        )
    if current_user.role == "doctor":
        return (
            db.query(Prediction)
            .filter(Prediction.doctor_id == current_user.id)
            .order_by(Prediction.created_at.desc())
            .all()
        )
    return db.query(Prediction).order_by(Prediction.created_at.desc()).all()

@router.post("/batch", response_model=BatchPredictionResponse)
async def batch_predict_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_doctor_or_admin)
):
    load_ml_assets()
    if not model or not scaler:
        raise HTTPException(status_code=500, detail="ML model not found.")
        
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV.")
        
    df = pd.read_csv(file.file)
    
    # Assumes last column is NOT target and all columns are features or appropriately preprocessed
    # In real world, id columns need stripping. We will just pass values.
    features_scaled = scaler.transform(df.values)
    preds = model.predict(features_scaled)
    probs = model.predict_proba(features_scaled)
    
    results = []
    for i in range(len(preds)):
        class_label = "Malignant" if preds[i] == 0 else "Benign"
        conf = float(max(probs[i]) * 100)
        results.append({"row": i, "prediction": class_label, "confidence": conf})
        
    return BatchPredictionResponse(filename=file.filename, results=results)
