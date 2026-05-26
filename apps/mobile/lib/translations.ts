export type Lang = 'id' | 'en' | 'zh'

type S = Record<Lang, string>

// Cimeat shared strings (food / calorie tracking domain).
// Most screens use inline copy; these cover shared/common labels.
export const T = {
  // --- common ---
  common_cancel: { id: 'Batal', en: 'Cancel', zh: '取消' },
  common_save: { id: 'Simpan', en: 'Save', zh: '保存' },
  common_delete: { id: 'Hapus', en: 'Delete', zh: '删除' },
  common_back: { id: 'Kembali', en: 'Back', zh: '返回' },
  common_close: { id: 'Tutup', en: 'Close', zh: '关闭' },
  common_send: { id: 'Kirim', en: 'Send', zh: '发送' },
  common_saving: { id: 'Menyimpan...', en: 'Saving...', zh: '保存中...' },
  common_loading: { id: 'Memuat', en: 'Loading', zh: '加载中' },
  common_error: { id: 'Gagal', en: 'Failed', zh: '失败' },
  common_try_again: { id: 'Coba lagi ya.', en: 'Please try again.', zh: '请重试。' },
  common_edit: { id: 'Edit', en: 'Edit', zh: '编辑' },
  common_type_message: { id: 'Ketik pesan...', en: 'Type a message...', zh: '输入消息...' },

  // --- brand / nav ---
  brand: { id: 'Cimeat', en: 'Cimeat', zh: 'Cimeat' },
  tab_home: { id: 'Beranda', en: 'Home', zh: '首页' },
  tab_diary: { id: 'Diary', en: 'Diary', zh: '记录' },
  tab_add: { id: 'Catat', en: 'Log', zh: '记录' },
  tab_coach: { id: 'Coach', en: 'Coach', zh: '教练' },
  tab_settings: { id: 'Setelan', en: 'Settings', zh: '设置' },

  // --- macros ---
  macro_calories: { id: 'Kalori', en: 'Calories', zh: '卡路里' },
  macro_protein: { id: 'Protein', en: 'Protein', zh: '蛋白质' },
  macro_carb: { id: 'Karbo', en: 'Carbs', zh: '碳水' },
  macro_fat: { id: 'Lemak', en: 'Fat', zh: '脂肪' },

  // --- meal types ---
  meal_breakfast: { id: 'Sarapan', en: 'Breakfast', zh: '早餐' },
  meal_lunch: { id: 'Makan Siang', en: 'Lunch', zh: '午餐' },
  meal_dinner: { id: 'Makan Malam', en: 'Dinner', zh: '晚餐' },
  meal_snack: { id: 'Camilan', en: 'Snack', zh: '零食' },

  // --- settings ---
  settings_title: { id: 'Setelan', en: 'Settings', zh: '设置' },
  settings_guest: { id: 'Tamu Cimeat', en: 'Cimeat Guest', zh: 'Cimeat 访客' },
  settings_theme: { id: 'Tema', en: 'Theme', zh: '主题' },
  settings_language: { id: 'Bahasa', en: 'Language', zh: '语言' },
  settings_theme_light: { id: 'Terang', en: 'Light', zh: '浅色' },
  settings_theme_dark: { id: 'Gelap', en: 'Dark', zh: '深色' },
  settings_theme_system: { id: 'Sistem', en: 'System', zh: '跟随系统' },
  settings_signout: { id: 'Keluar', en: 'Sign out', zh: '退出登录' },
} satisfies Record<string, S>

export type TKey = keyof typeof T

export const MONTHS_SHORT: Record<Lang, string[]> = {
  id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
}
