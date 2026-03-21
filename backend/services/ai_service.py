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
        Bertindaklah sebagai ahli gizi profesional. Analisis gambar makanan ini dan kembalikan hanya objek JSON murni tanpa markdown dengan format berikut:
        {
          "food_name": "string (Gunakan Bahasa Indonesia yang sederhana, contoh: 'Nasi Goreng Telur', bukan 'Fried Rice with sunny side up')",
          "estimated_weight_g": integer (estimasi berat dalam gram),
          "calories": integer (estimasi kalori yang masuk akal),
          "macronutrients": {
            "protein_g": integer (angka bulat atau natural),
            "fat_g": integer (angka bulat atau natural),
            "carbs_g": integer (angka bulat atau natural)
          },
          "health_score": integer (1-100),
          "confidence_score": float (0.0 - 1.0)
        }
        PENTING:
        1. Nama makanan harus Bahasa Indonesia dan singkat.
        2. Jangan memberikan teks penjelasan, pembukaan, atau penutup. 
        3. Kembalikan HANYA JSON.
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

    async def get_recommendation(self, history_data: list, settings: dict):
        # Format data buat prompt
        history_summary = "\\n".join([f"- {h['name']} ({h['calories']} kcal, P:{h['protein']}g, K:{h['carbs']}g, L:{h['fat']}g)" for h in history_data])
        
        prompt = f"""
        Bertindaklah sebagai asisten gizi pribadi yang sangat ramah dan memotivasi.
        
        TARGET HARIAN USER:
        - Kalori: {settings.get('calorieGoal')} kcal
        - Protein: {settings.get('proteinGoal')}g
        - Karbohidrat: {settings.get('carbsGoal')}g
        - Lemak: {settings.get('fatGoal')}g
        
        MAKANAN HARI INI:
        {history_summary if history_data else "Belum ada makanan yang dicatat hari ini."}
        
        TUGAS ANDA:
        Berikan 2-3 kalimat saran yang sangat personal, singkat, dan praktis menggunakan Bahasa Indonesia yang santai tapi profesional.
        Fokus pada: 
        1. Apa nutrisi yang masih kurang atau sudah kelebihan?
        2. Rekomendasi 1-2 menu lokal Indonesia yang cocok dimakan selanjutnya untuk menyeimbangkan target.
        3. Berikan motivasi singkat.

        Kembalikan HANYA teks saran, tanpa awalan atau penutup lainnya.
        """

        url = self.cloud_url if self.mode == "cloud" else self.local_url
        endpoint = f"{url}/api/generate"
        
        headers = {}
        if self.mode == "cloud":
            headers["Authorization"] = f"Bearer {self.api_key}"

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                response = await client.post(endpoint, json=payload, headers=headers)
                response.raise_for_status()
                result = response.json()
                return {"recommendation": result.get("response", "").strip()}
            except Exception as e:
                print(f"[AI Recommendation] Error: {e}")
                return {"recommendation": "Gagal mendapatkan saran AI. Tetap semangat jalani dietmu ya bro! 💪"}

ai_service = AIService()
