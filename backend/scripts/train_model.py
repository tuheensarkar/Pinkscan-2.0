import os
import time
import pandas as pd
import numpy as np
import joblib
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
import matplotlib.pyplot as plt
import seaborn as sns
import shap

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ML_DIR = os.path.join(BASE_DIR, 'app', 'ml')
os.makedirs(ML_DIR, exist_ok=True)

def train_and_evaluate():
    print("Loading Wisconsin Breast Cancer Dataset...")
    data = load_breast_cancer()
    X = pd.DataFrame(data.data, columns=data.feature_names)
    y = data.target

    print(f"Dataset shape: {X.shape}")

    # Data Cleaning and Scaling
    print("Splitting and scaling data...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Models to train
    models = {
        "Logistic Regression": LogisticRegression(max_iter=10000, random_state=42),
        "Decision Tree": DecisionTreeClassifier(random_state=42),
        "Random Forest": RandomForestClassifier(random_state=42),
        "SVM": SVC(probability=True, random_state=42),
        "XGBoost": XGBClassifier(use_label_encoder=False, eval_metric='logloss', random_state=42)
    }

    best_model_name = ""
    best_model = None
    best_f1 = 0

    print("\n--- Training Models ---")
    for name, model in models.items():
        print(f"Training {name}...")
        model.fit(X_train_scaled, y_train)
        y_pred = model.predict(X_test_scaled)
        
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred)
        rec = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        
        print(f"{name} Performance: Acc={acc:.4f}, Prec={prec:.4f}, Rec={rec:.4f}, F1={f1:.4f}")

        # Basic cross-validation
        cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='f1')
        print(f"{name} CV F1 Mean: {cv_scores.mean():.4f}\n")

        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name
            best_model = model

    print(f"Best Model: {best_model_name} with F1-Score of {best_f1:.4f}")

    # Hyperparameter tuning for the best model (e.g., if XGBoost)
    if best_model_name == "XGBoost":
        print("Running GridSearchCV for XGBoost...")
        param_grid = {
            'n_estimators': [50, 100, 200],
            'max_depth': [3, 5, 7],
            'learning_rate': [0.01, 0.1, 0.2]
        }
        grid = GridSearchCV(XGBClassifier(use_label_encoder=False, eval_metric='logloss', random_state=42), 
                            param_grid, cv=5, scoring='f1', n_jobs=-1)
        grid.fit(X_train_scaled, y_train)
        best_model = grid.best_estimator_
        print(f"Best XGBoost Params: {grid.best_params_}")
        
    elif best_model_name == "Random Forest":
        print("Running GridSearchCV for Random Forest...")
        param_grid = {
            'n_estimators': [100, 200],
            'max_depth': [None, 10, 20]
        }
        grid = GridSearchCV(RandomForestClassifier(random_state=42), param_grid, cv=5, scoring='f1', n_jobs=-1)
        grid.fit(X_train_scaled, y_train)
        best_model = grid.best_estimator_
        print(f"Best RF Params: {grid.best_params_}")

    print("\n--- Final Model Evaluation on Test Set ---")
    y_pred = best_model.predict(X_test_scaled)
    print(classification_report(y_test, y_pred, target_names=data.target_names))

    # Saving Model and Scaler
    model_path = os.path.join(ML_DIR, 'model.pkl')
    scaler_path = os.path.join(ML_DIR, 'scaler.pkl')

    print(f"Saving final model to {model_path}...")
    joblib.dump(best_model, model_path)
    
    print(f"Saving scaler to {scaler_path}...")
    joblib.dump(scaler, scaler_path)

    # Feature Importance for tree-based models OR SHAP explanation
    try:
        print("\nGenerating Global SHAP explanation...")
        explainer = shap.Explainer(best_model, X_train_scaled)
        shap_values = explainer(X_train_scaled)
        # We just generate the SHAP explainer here to ensure it works, we don't save plots in the script since this runs on backend start/admin trigger
        print("SHAP explanation successful.")
    except Exception as e:
        print(f"Could not generate SHAP explanation directly here: {e}")

    print("Training complete!")

if __name__ == "__main__":
    train_and_evaluate()
