
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(
    title="NexusHR AI Workforce Intelligence",
    description="Attrition model API trained on a public HR dataset.",
    version="1.0.0",
)

MODEL_PATH = Path(__file__).parent / "models" / "attrition_model.joblib"


class AnalysisStatus(BaseModel):
    status: str
    model_available: bool
    message: str


class AttritionPredictionRequest(BaseModel):
    features: dict[str, object] = Field(
        ...,
        description="Feature names and values matching the training dataset.",
    )


def load_model():
    if not MODEL_PATH.exists():
        return None

    try:
        artifact = joblib.load(MODEL_PATH)
        if not isinstance(artifact, dict):
            return None
        if "pipeline" not in artifact or "feature_columns" not in artifact:
            return None
        return artifact
    except Exception:
        return None


@app.get("/health", response_model=AnalysisStatus)
def health():
    artifact = load_model()
    available = artifact is not None

    return AnalysisStatus(
        status="ok",
        model_available=available,
        message=(
            "Trained attrition model is available."
            if available
            else "Service is running, but no valid trained model is installed."
        ),
    )


@app.post("/predict")
def predict(request: AttritionPredictionRequest):
    artifact = load_model()

    if artifact is None:
        raise HTTPException(
            status_code=503,
            detail="A valid trained attrition model is not available.",
        )

    expected_columns = artifact["feature_columns"]
    supplied_features = request.features

    missing = [
        column for column in expected_columns
        if column not in supplied_features
    ]
    unexpected = [
        column for column in supplied_features
        if column not in expected_columns
    ]

    if missing or unexpected:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Feature names must match the training schema.",
                "missing_features": missing,
                "unexpected_features": unexpected,
            },
        )

    try:
        frame = pd.DataFrame(
            [[supplied_features[column] for column in expected_columns]],
            columns=expected_columns,
        )

        pipeline = artifact["pipeline"]
        probability = float(pipeline.predict_proba(frame)[0][1])

        return {
            "model": "logistic_regression",
            "training_dataset": artifact["training_dataset"],
            "prediction": "At-risk" if probability >= 0.5 else "Lower-risk",
            "attrition_probability": round(probability, 4),
            "threshold": 0.5,
            "interpretation": (
                "This estimate comes from a public historical dataset. "
                "It is not a validated prediction for your organization "
                "and must not be used alone for employment decisions."
            ),
        }

    except (TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid feature values: {exc}",
        ) from exc
