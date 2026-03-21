import httpx
import os
import json
import base64
import re
from dotenv import load_dotenv

load_dotenv()

class AIService:
    def __init__(self):
        self.mode = os.getenv("AI_MODE", "cloud")
        self.local_url = os.getenv("OLLAMA_LOCAL_URL", "http://localhost:11434")
        self.cloud_url = os.getenv("OLLAMA_CLOUD_URL", "https://ollama.com")
        self.api_key = os.getenv("OLLAMA_API_KEY")
        self.model = os.getenv("DEFAULT_MODEL", "qwen3.5")

    async def analyze_image(self, image_bytes: bytes):
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        
        prompt = """
        Analyze this food image and return ONLY a plain JSON object with exactly these fields:
        {
          "food_name": "string",
          "estimated_weight_g": integer,
          "calories": integer,
          "macronutrients": {
            "protein_g": integer,
            "fat_g": integer,
            "carbs_g": integer
          },
          "health_score": integer,
          "confidence_score": float
        }
        Jangan berikan teks penjelasan apapun, hanya JSON saja!
        """

        url = self.cloud_url if self.mode == "cloud" else self.local_url
        endpoint = f"{url}/api/generate"
        
        headers = {}
        if self.mode == "cloud":
            headers["Authorization"] = f"Bearer {self.api_key}"

        payload = {
            "model": self.model,
            "prompt": prompt,
            "images": [base64_image],
            "stream": False,
            "format": "json"
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                print(f"[AI] Calling Ollama {self.mode.upper()} ({self.model})...")
                response = await client.post(endpoint, json=payload, headers=headers)
                response.raise_for_status()
                
                result = response.json()
                raw_response = result.get("response", "").strip()
                
                if not raw_response:
                    raise Exception("AI returned an empty response")

                # ✅ MEMBERSIHKAN JSON (Buang markdown backticks kalau ada)
                clean_json = re.sub(r'^```json\s*|```\s*$', '', raw_response, flags=re.MULTILINE).strip()
                
                try:
                    return json.loads(clean_json)
                except json.JSONDecodeError:
                    # Alternatif: Kadang Ollama ngasih response sebagai dict langsung di 'message'
                    print(f"[AI] Raw failed JSON: {raw_response[:100]}...")
                    raise Exception("Gagal parse JSON dari AI")
                    
            except Exception as e:
                print(f"[AI] Error: {e}")
                raise e

ai_service = AIService()
