from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from services.ai_service import ai_service

load_dotenv()

app = FastAPI(title="Cimeat AI Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisResponse(BaseModel):
    food_name: str
    estimated_weight_g: int
    calories: int
    macronutrients: dict
    health_score: int
    confidence_score: float

@app.get("/")
async def root():
    return {"status": "Cimeat AI running", "mode": os.getenv("AI_MODE", "cloud")}

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_food(image: UploadFile = File(...)):
    print(f"[API] Image received: {image.filename}")
    try:
        contents = await image.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty image file")
        result = await ai_service.analyze_image(contents)
        print(f"[API] Done: {result.get('food_name')}, {result.get('calories')} kcal")
        return result
    except Exception as e:
        print(f"[API] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # TANPA reload=True agar bisa dijalankan langsung via 'python main.py'
    uvicorn.run(app, host="0.0.0.0", port=8000)
