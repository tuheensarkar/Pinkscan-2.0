# PinkScan - AI-Powered Breast Cancer Risk Assessment Platform

PinkScan is a professional, production-ready full-stack application for breast cancer risk assessment. It encompasses predictive machine learning, explainable AI (SHAP), a comprehensive multi-role web platform (Patient, Doctor, Admin), community forums, appointment scheduling, and automated clinical report generation.

## Features
- **Multi-Role Dashboards**: Specific workflows for Patients, Doctors, and Admins.
- **AI Prediction**: Built with scikit-learn & XGBoost, evaluated and serialized.
- **Explainable AI**: SHAP integration to provide feature attribution (waterfall/bar charts).
- **Batch Processing**: CSV upload capabilities for Doctors to predict on multiple patient records.
- **Automated PDF Reports**: High-quality downloadable patient reports 
- **Community Forum**: Real-time Q&A between patients and doctors.
- **Appointments**: Complete doctor-patient scheduling system.
- **Modern UI**: Next.js 15, TailwindCSS, shadcn/ui, Recharts.

## Folder Structure
- `frontend/` - Next.js 15 App (React, Tailwind, Shadcn)
- `backend/` - FastAPI Python App (SQLAlchemy, ML Inference)
- `backend/scripts/` - ML Model Training Scripts

## Installation & Setup

### Requirements
- Node.js 18+
- Python 3.10+
- Docker & Docker Compose

### 1. Environment Variables
Create a `.env` file in the root directory (or respective frontend/backend directories based on the components).

**Backend `.env`**
```env
DATABASE_URL=your-database-url
SECRET_KEY=your-supersecret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-smtp-user
SMTP_PASS=your-brevo-smtp-password
SMTP_FROM="PinkScan <verified-sender@example.com>"
FRONTEND_URL=http://localhost:3000
```

**Frontend `.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```
```

### 3. Backend Setup & ML Training
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Run necessary database migrations (if Alembic is set up):
   ```bash
   alembic upgrade head
   ```
4. **Train the Model**:
   Download the Wisconsin Breast Cancer Diagnostic Dataset. Place it in `backend/scripts/data.csv` (or use the built-in sklearn dataset fetching).
   ```bash
   python scripts/train_model.py
   ```
   This will train multiple models, select the best one, and output `model.pkl` and `scaler.pkl` to `backend/app/ml/`.
5. Run the Server:
   ```bash
   uvicorn app.main:app --reload
   ```

### 4. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment
Use Docker Compose to deploy the full stack.

```bash
docker-compose up --build -d
```

## Screenshots
_Placeholder for Screenshots_

- Landing Page
- Doctor Dashboard
- SHAP Charts
- Reports

## Architecture
- **Frontend**: Next.js (App Router), TypeScript, TailwindCSS, shadcn/ui.
- **Backend**: FastAPI, SQLAlchemy, Pydantic, JWT auth.
- **ML**: Scikit-Learn, Pandas, SHAP.
- **Database**: PostgreSQL.
