from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import StreamingResponse
from typing import List
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

class RecommendRequest(BaseModel):
    history_today: list
    history_past: list = []
    settings: dict

@app.post("/recommend")
async def get_recommendation(data: RecommendRequest):
    try:
        print(f"[API] Generating recommendation (sync)...")
        result = await ai_service.get_recommendation(data.history_today, data.history_past, data.settings)
        return result
    except Exception as e:
        print(f"[API] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend/stream")
async def get_recommendation_stream(data: RecommendRequest):
    print(f"[API] Streaming recommendation...")
    return StreamingResponse(
        ai_service.stream_recommendation(data.history_today, data.history_past, data.settings),
        media_type="text/plain"
    )

class TextAnalysisRequest(BaseModel):
    text: str

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    print(f"[API] Audio received for transcription: {audio.filename}")
    try:
        contents = await audio.read()
        text = await ai_service.transcribe_audio(contents)
        print(f"[API] Whisper Transcription: {text}")
        return {"text": text}
    except Exception as e:
        print(f"[API] Transcription Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-text", response_model=AnalysisResponse)
async def analyze_text_v2(data: TextAnalysisRequest):
    try:
        print(f"[API] Text received for analysis: {data.text}")
        result = await ai_service.analyze_text_log(data.text)
        return result
    except Exception as e:
        print(f"[API] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recipe")
async def create_recipe(
    images: List[UploadFile] = File(default=[]),
    additionalPrompt: str = Form(""),
    calorieGoal: int = Form(...),
    proteinGoal: int = Form(...),
    carbsGoal: int = Form(...),
    fatGoal: int = Form(...)
):
    try:
        image_contents = []
        if images:
            for img in images:
                if getattr(img, "filename", ""):
                    content = await img.read()
                    if content:
                        image_contents.append(content)
        settings = {"calorieGoal": calorieGoal, "proteinGoal": proteinGoal, "carbsGoal": carbsGoal, "fatGoal": fatGoal}
        result = await ai_service.generate_recipe(image_contents, settings, additionalPrompt)
        return result
    except Exception as e:
        print(f"[API] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recipe/stream")
async def create_recipe_stream(
    images: List[UploadFile] = File(default=[]),
    additionalPrompt: str = Form(""),
    calorieGoal: int = Form(...),
    proteinGoal: int = Form(...),
    carbsGoal: int = Form(...),
    fatGoal: int = Form(...)
):
    try:
        image_contents = []
        if images:
            for img in images:
                if getattr(img, "filename", ""):
                    content = await img.read()
                    if content:
                        image_contents.append(content)
        settings = {"calorieGoal": calorieGoal, "proteinGoal": proteinGoal, "carbsGoal": carbsGoal, "fatGoal": fatGoal}
        return StreamingResponse(
            ai_service.stream_recipe(image_contents, settings, additionalPrompt),
            media_type="text/plain"
        )
    except Exception as e:
        print(f"[API] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ChatRecipeRequest(BaseModel):
    recipe_text: str
    chat_history: list
    message: str

@app.post("/chat_recipe")
async def chat_recipe_api(data: ChatRecipeRequest):
    try:
        result = await ai_service.chat_recipe(data.recipe_text, data.chat_history, data.message)
        return result
    except Exception as e:
        print(f"[API] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat_recipe/stream")
async def chat_recipe_stream(data: ChatRecipeRequest):
    try:
        return StreamingResponse(
            ai_service.stream_chat_recipe(data.recipe_text, data.chat_history, data.message),
            media_type="text/plain"
        )
    except Exception as e:
        print(f"[API] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
