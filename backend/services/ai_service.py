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
    async def get_recommendation(self, history_today: list, history_past: list, settings: dict):
        # Hitung total kalori hari ini
        total_today = sum([h.get('calories', 0) for h in history_today])
        goal = settings.get('calorieGoal', 2000)
        is_offside = total_today > goal
        gap = total_today - goal
        
        # Format data hari ini
        today_summary = "\\n".join([f"- {h.get('name', 'Unknown')} ({h.get('calories', 0)} kcal, P:{h.get('protein', 0)}g, K:{h.get('carbs', 0)}g, L:{h.get('fat', 0)}g)" for h in history_today])
        
        # Format histori 7 hari terakhir
        past_summary = ""
        if history_past:
            valid_scores = [h.get('score', 0) for h in history_past if isinstance(h.get('score'), (int, float))]
            avg_score = sum(valid_scores) / len(valid_scores) if valid_scores else 0
            
            categories = [h.get('category', 'Lainnya') for h in history_past]
            most_common_cat = max(set(categories), key=categories.count) if categories else "Campur"
            
            past_summary = f"""
        DATA HABIT / KEBIASAAN MAKAN (7 HARI TERAKHIR):
        - Rata-rata Health Score: {round(avg_score, 1)}/100
        - Kategori Paling Sering: {most_common_cat}
        - Total makanan / catatan: {len(history_past)} porsi
            """
        else:
            past_summary = "DATA HABIT: Belum ada cukup data historis yang terkumpul."

        # Logika Instruksi khusus jika offside
        offside_instruction = f"""
        SITUASI KRITIS: User sudah makan {total_today} kcal, padahal targetnya cuma {goal} kcal (kelebihan {gap} kcal)!
        TUGAS KHUSUS ANDA:
        1. JANGAN sarankan makanan atau menu baru apapun untuk sisa hari ini!
        2. Sarankan untuk **BERHENTI MAKAN** (puasa) untuk sisa hari ini.
        3. Berikan saran aktivitas fisik ringan atau olahraga (contoh: jalan santai, squat, atau beresin kamar) buat bakar ekstra kalori tadi.
        4. Sarankan minum air putih lebih banyak biar kenyang lebih lama.
        5. Beri teguran asik tapi tegas biar user gak kebablasan lagi.
        """ if is_offside else f"""
        SITUASI: User baru makan {total_today} kcal dari target {goal} kcal. Masih ada ruang!
        TUGAS ANDA:
        1. Rekomendasi 1-2 menu LOKAL INDONESIA yang AFFORDABLE (murah meriah), NORMAL (bisa ditemuin di warung/kaki lima manapun), dan SEHAT untuk sisa hari ini.
        2. Sesuaikan saran dengan program user ({settings.get('goal')}).
        """

        prompt = f"""
        Bertindaklah sebagai asisten gizi pribadi yang sangat ramah, suportif, dan asik layaknya bestie.
        
        TARGET HARIAN USER (Program: {settings.get('goal', 'Menjaga Berat Badan')}):
        - Kalori: {goal} kcal
        - Protein: {settings.get('proteinGoal')}g
        - Karbohidrat: {settings.get('carbsGoal')}g
        - Lemak: {settings.get('fatGoal')}g
        
        {past_summary}
        
        MAKANAN HARI INI:
        {today_summary if history_today else "Belum ada makanan yang dicatat hari ini."}
        
        {offside_instruction}

        FOKUS TAMBAHAN: 
        - Tegur kebiasaan buruk atau berikan pujian berdasarkan "DATA HABIT".
        - Berikan 2-4 kalimat saran yang sangat personal, singkat, dan praktis menggunakan Bahasa Indonesia yang santai/gaul (lo, gue, bro, bestie).
        - Berikan motivasi singkat di akhir.

        ATURAN FORMATTING (SANGAT PENTING):
        - Gunakan **bold** (dua bintang) untuk angka kalori, jenis aktivitas, atau kata kunci penting lainnya.
        - JANGAN gunakan tanda kutip untuk membungkus seluruh jawaban.
        - JANGAN pakai tanda hubung seperti DASH "—" ataupun "-" untuk estetika!
        
        Kembalikan HANYA teks saran, tanpa awalan `Ini sarannya:` atau penjelasan lainnya, murni teks paragraf saja!
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
                clean_res = result.get("response", "").strip()
                # Clean up dashes as requested
                clean_res = clean_res.replace("—", " ").replace("-", " ")
                return {"recommendation": clean_res}
            except Exception as e:
                print(f"[AI Recommendation] Error: {e}")
                return {"recommendation": "Gagal mendapatkan saran AI. Tetap semangat jalani dietmu ya bro! 💪"}

    async def generate_recipe(self, images_bytes: list, settings: dict, additional_prompt: str = ""):
        base64_images = [base64.b64encode(img).decode('utf-8') for img in images_bytes] if images_bytes else []
        
        user_request_text = f"\nREQUEST TAMBAHAN USER: {additional_prompt}\n(Tolong perhatikan request ini baik-baik!)\n" if additional_prompt.strip() else ""
        
        prompt = f"""
        Bertindaklah sebagai Chef AI Pribadi dan Ahli Gizi Cimeat.
        
        TUJUAN:
        Buatkan SATU resep masakan lokal Indonesia yang simpel, logis, dan enak menggunakan bahan-bahan utama yang terlihat di foto (boleh ditambah bumbu dapur dasar). 
        Jika tidak ada foto yang diberikan, buatkan resep bebas sesuai target kalori.
        Masakan tersebut harus dikira-kira agar porsinya mendekati sisa target nutrisi user hari ini.{user_request_text}

        SISA TARGET MAKRO USER HARI INI:
        - Kalori: {settings.get('calorieGoal')} kcal
        - Protein: {settings.get('proteinGoal')}g
        - Karbohidrat: {settings.get('carbsGoal')}g
        - Lemak: {settings.get('fatGoal')}g

        FORMAT BALASAN ANDA (Gunakan Markdown):
        # 🍳 [Nama Masakan]
        *Teks pembuka singkat yang asik ala anak Jaksel/gaul.*

        **Bahan Tambahan (Asumsi bumbu/bahan lain):**
        - ...

        **Cara Masak Senggol Bacok:**
        1. ...
        2. ...
        
        **Estimasi Nutrisi untuk Resep Ini:**
        - **Kalori:** ... kcal
        - **Protein:** ... g
        - **Karbo:** ... g
        - **Lemak:** ... g
        
        HANYA KEMBALIKAN TEKS MARKDOWN TERSEBUT.
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
        
        if base64_images:
            payload["images"] = base64_images

        async with httpx.AsyncClient(timeout=180.0) as client:
            try:
                response = await client.post(endpoint, json=payload, headers=headers)
                response.raise_for_status()
                result = response.json()
                return {"recipe": result.get("response", "").strip()}
            except Exception as e:
                print(f"[AI Recipe] Error: {e}")
                return {"recipe": "Waduh bro, AI Chef kita lagi error/sibuk. Coba foto ulang atau muat ulang halamannya ya! 👨‍🍳"}

    async def chat_recipe(self, recipe_text: str, chat_history: list, new_message: str):
        history_text = "\n".join([f"{'USER' if msg.get('role') == 'user' else 'AI'}: {msg.get('content')}" for msg in chat_history])
        
        prompt = f"""
        Bertindaklah sebagai Chef AI Pribadi dan Ahli Gizi Cimeat.
        
        Konteks: Kita sedang mendiskusikan resep hasil buatan AI sebelumnya:
        ===== RESEP AWAL =====
        {recipe_text}
        ======================
        
        RIWAYAT OBROLAN SAAT INI:
        {history_text if chat_history else "Belum ada riwayat."}
        
        PERTANYAAN/PERUBAHAN DARI USER:
        {new_message}
        
        TUGAS ANDA:
        Balaslah dalam Bahasa Indonesia yang gaul (lo, gue, bro, bestie) tapi tetap informatif dan relevan sebagai asisten dapur. 
        Jawab pertanyaan, modifikasi cara masak, saran bahan pengganti, atau hitung ulang makro jika diminta. Jangan sebutkan Anda AI, bertindaklah natural seperti teman di dapur.
        Gunakan gaya Markdown (huruf tebal, poin) jika membalas resep atau instruksi baru.
        KEMBALIKAN HANYA TEKS BALASAN LANGSUNG (tidak perlu `Saya adalah AI` dll).
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
                return {"reply": result.get("response", "").strip()}
            except Exception as e:
                print(f"[AI Chat Recipe] Error: {e}")
                return {"reply": "Waduh bro, Chef AI gagal nangkep maksud lo. Coba difrasenya dibedain atau cek koneksi deh! 🥺"}

    async def analyze_text_log(self, text: str):
        prompt = f"""
        Bertindaklah sebagai ahli gizi profesional. Ekstrak informasi makanan dari teks berikut dan kembalikan hanya objek JSON murni tanpa markdown.
        
        TEKS DARI USER: "{text}"
        
        FORMAT JSON:
        {{
          "food_name": "string (Contoh: 'Sate Ayam')",
          "estimated_weight_g": integer (estimasi logis),
          "calories": integer (estimasi total),
          "macronutrients": {{
            "protein_g": integer,
            "fat_g": integer,
            "carbs_g": integer
          }},
          "health_score": integer (1-100),
          "confidence_score": float (0.0-1.0)
        }}
        
        PENTING:
        1. Jika ada beberapa makanan, gabungkan menjadi satu entri utama yang mewakili makanan tersebut.
        2. Gunakan Bahasa Indonesia.
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
            "stream": False,
            "format": "json"
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                print(f"[AI Text Log] Analyzing: {text[:50]}...")
                response = await client.post(endpoint, json=payload, headers=headers)
                response.raise_for_status()
                result = response.json()
                raw_response = result.get("response", "").strip()
                clean_json = re.sub(r'^```json\s*|```\s*$', '', raw_response, flags=re.MULTILINE).strip()
                data = json.loads(clean_json)
                if "confidence_score" not in data:
                    data["confidence_score"] = 0.95
                return data
            except Exception as e:
                print(f"[AI Text Log] Error: {e}")
                raise e

ai_service = AIService()
