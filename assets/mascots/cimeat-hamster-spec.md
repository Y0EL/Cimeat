# Spesifikasi Karakter Cimeat Hamster

Nama karakter: Cimeat Hamster

## Kepribadian
Cimeat Hamster adalah life pet ramah untuk aplikasi Cimeat. Karakternya polos, lembut, penasaran, dan suportif, seperti teman kecil yang menemani pengguna saat onboarding, empty state, placeholder visual, dan momen progres harian.

## Shape Language
- Siluet utama adalah fluffy blob yang membulat, cloud-like, dan sangat sederhana.
- Kepala dan tubuh menyatu dalam satu massa lembut, bukan anatomi hamster realistis.
- Bagian atas kepala memiliki dua lengkung telinga besar dan tiga gumpalan kecil di tengah.
- Sisi kiri dan kanan memakai scallop lembut untuk memberi nuansa bulu.
- Bagian bawah tubuh memiliki tiga sampai empat gelombang besar seperti awan.
- Semua ujung garis wajib rounded dan terasa doodle.

## Proporsi Dasar
- ViewBox utama: `0 0 1024 1024`.
- Tubuh mengisi sekitar 80 persen lebar viewBox dan 70 persen tinggi viewBox.
- Mata berada sedikit di atas tengah wajah.
- Jarak mata lebar, dengan diameter mata sekitar 14 sampai 16 persen dari lebar viewBox.
- Pupil kecil, solid hitam, dan berada sedikit ke arah dalam bawah agar ekspresi terlihat innocent.
- Mulut kecil berada di tengah bawah mata, tidak lebih lebar dari jarak antar pupil.

## Ketebalan Stroke
- Stroke utama SVG produksi: `34`.
- Stroke variasi kecil seperti aksen tidur atau gesture: tetap `34` jika bentuknya outline.
- Pupil dan dot ekspresi boleh memakai fill hitam tanpa stroke.
- Semua path memakai `stroke-linecap="round"` dan `stroke-linejoin="round"`.

## Aturan Ekspresi
- Ekspresi harus kecil, sederhana, dan tidak dramatis.
- Mata dasar: dua circle outline besar dengan pupil solid hitam.
- Varian happy: mulut boleh menjadi senyum kecil, pipi boleh ditambah dua gores pendek.
- Varian thinking: pupil boleh sedikit tidak sejajar dan mulut boleh menjadi garis lengkung kecil.
- Varian sleep: mata berubah menjadi dua lengkung tertutup; siluet tubuh tetap sama.
- Jangan membuat gigi, lidah, alis kompleks, highlight mata berwarna, atau detail wajah realistis.

## Aturan Pose
- Tubuh dasar harus sama di semua variasi.
- Pose hanya boleh berubah lewat paw kecil, gesture ringan, atau simbol sederhana.
- Paw melambai harus terasa seperti ekstensi cloud-blob, bukan tangan manusia.
- Pose thinking boleh memakai paw kecil di pipi dan dua dot pikiran.
- Pose sleep boleh memakai simbol `Z` outline sederhana.
- Jangan mengubah siluet utama, ukuran mata, atau bahasa bentuk dasar antar variasi.

## Hal Yang Tidak Boleh Dilakukan
- Jangan memakai warna selain hitam dan putih.
- Jangan memakai shadow, gradient, texture, noise, atau rendering realistis.
- Jangan menambahkan detail anatomi berlebihan seperti jari, cakar, bulu individual, hidung realistis, atau telinga dalam kompleks.
- Jangan membuat karakter menjadi hewan lain atau blob abstrak yang tidak terbaca sebagai hamster.
- Jangan membuat garis tipis, sudut tajam, atau dekorasi rumit.
- Jangan memakai kata terlarang dalam penamaan aset; gunakan istilah `uji`, `demo`, atau `contoh` bila perlu.

## Guideline Untuk Referensi Generate Image
Gunakan Cimeat Hamster sebagai maskot monochrome hitam putih dengan tubuh cloud-like, stroke hitam tebal, garis rounded, mata oval besar, pupil solid kecil, dan ekspresi polos. Pertahankan siluet kepala-tubuh menyatu, telinga besar membulat, tiga gumpalan kecil di atas kepala, scallop fluffy di sisi, dan gelombang besar di bawah tubuh. Jika membuat pose baru, ubah hanya gesture kecil atau ekspresi sederhana; jangan mengubah proporsi, warna, ketebalan garis, atau tingkat kompleksitas.

> Sumber internal: `public/contoh.png` - referensi visual utama sesi 2026-06-02.
