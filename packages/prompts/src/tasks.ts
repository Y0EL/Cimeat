export const foodAnalysisJsonContract = `Return HANYA JSON valid (tanpa markdown fence, tanpa teks lain) dengan bentuk:
{
  "food_name": "string",
  "estimated_weight_g": 0,
  "calories": 0,
  "macronutrients": { "protein_g": 0, "carbs_g": 0, "fat_g": 0 },
  "health_score": 0,
  "confidence_score": 0.0,
  "calorie_range": { "min": 0, "max": 0 },
  "portion_notes": "string",
  "cimit_message": "komentar Cimit singkat, satir tapi care, dengan 1 saran"
}
Aturan: health_score 0-100 (makin sehat makin tinggi). confidence_score 0..1. calories integer. macros gram. calorie_range mengelilingi estimasi. Untuk makanan campur, gabungkan jadi satu estimasi total.`

export const analyzeImageTask = `Analisis foto makanan ini. Identifikasi makanan + porsi yang terlihat, estimasi nutrisi.
${foodAnalysisJsonContract}
Jika bukan makanan / tidak bisa dianalisis: confidence_score rendah, calories 0, cimit_message minta foto ulang.`

export const analyzeAudioTask = `User bicara natural soal yang dia makan (Bahasa Indonesia kasual). Transkrip audio, ekstrak makanannya, lalu estimasi nutrisi total.
Return HANYA JSON valid seperti kontrak food analysis, DITAMBAH field "transcript": "hasil transkrip".
${foodAnalysisJsonContract}`

export const analyzeTextTask = `Dari teks user soal makanan, estimasi nutrisi.
${foodAnalysisJsonContract}`

export const generateRecipeTask = `Buat SATU resep masakan harian Indonesia dari bahan yang dimiliki user. Hormati mode (hemat/sehat/balanced), sisa kalori, budget, alat masak, dan pantangan kalau diberikan.
Return HANYA JSON valid:
{
  "title": "string",
  "recipe_markdown": "langkah masak ringkas dalam markdown, bahan + cara",
  "nutrition_estimate": { "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "servings": 1 },
  "cimit_message": "komentar Cimit"
}
Mode hemat: murah & mengenyangkan. Mode sehat: protein bersih + sayur. Bulatkan kalori ke kelipatan 5.`

export const nearbyRecommendTask = `Dari daftar tempat makan terdekat (kandidat) + konteks user (mode, sisa kalori), urutkan dan pilih rekomendasi terbaik.
Mode hemat: utamakan murah, mengenyangkan, atur porsi biar tetap aman. Mode sehat: utamakan protein bersih + sayur, harga bukan batas utama. Mode balanced: seimbang harga/sehat/jarak.
Return HANYA JSON valid:
{
  "items": [ { "name": "string", "distance_m": 0, "food_type": "string", "suggested_order": "saran pesanan + porsi", "estimated_calories": 0, "reason": "kenapa cocok" } ],
  "cimit_message": "komentar Cimit singkat"
}
Maksimal 4 item, urut dari paling cocok.`

export const dailyAdviceTask = `Berdasarkan status makan user hari ini (kalori masuk vs target, makro, makanan terakhir), beri SATU saran Cimit harian. Singkat, fun, actionable. Plain text (bukan JSON).`

export const offsideRoastTask = `User sudah offside (lewat target kalori) hari ini. Beri roast sehat ala Cimit: validasi dulu, roast ringan, lalu rencana recovery konkret (mis. makan ringan, minum air, jalan). Plain text. JANGAN body shaming, JANGAN suruh puasa ekstrem.`
