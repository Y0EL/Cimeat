import { buildMealReply, parseQuickAddText } from '@cimeat/chat-core'
import type { Bot, Context } from 'grammy'
import { getDb } from '../db'
import { loadEnv } from '../env'
import { logger } from '../logger'
import { recordChatMeal } from '../services/chat-meal-service'
import { runCoachTextTurn } from '../services/coach-agent-service'
import { scanFood } from '../services/food-vision-service'
import { saveAgentMeal } from '../services/chat-meal-service'
import { consumeLinkingCode, resolveUserByChannel } from '../services/linking-service'

const linkPrompt = [
  'Akun lo belum kesambung sama Cimeat.',
  '',
  'Cara nyambungin. Buka app Cimeat, masuk Pengaturan, pilih Sambungin Telegram.',
  'Nanti dikasih kode. Kirim ke sini gini.',
  '  /start KODE',
].join('\n')

const welcomeLinked = [
  'Mantap, akun lo udah kesambung.',
  '',
  'Sekarang tinggal ngobrol aja sama gue. Contoh.',
  '  tadi sarapan nasi goreng 600 kkal',
  '  makan siang ayam sama nasi',
  '  ringkasan kalori gue hari ini berapa',
  '',
  'Atau kirim foto makanan, nanti gue analisis kalorinya.',
].join('\n')

const helpMessage = [
  'Ngobrol aja biasa, gue ngerti.',
  '  tadi makan siang nasi padang 700 kkal',
  '  kalori gue hari ini udah berapa',
  '  hapus catatan terakhir',
  '',
  'Kirim foto makanan juga bisa, nanti gue analisis otomatis.',
].join('\n')

function conversationId(ctx: Context): string {
  return `telegram:${ctx.chat?.id ?? 'unknown'}`
}

async function downloadFileAsBase64(
  ctx: Context,
  fileId: string,
): Promise<{ data: string; mimeType: string } | null> {
  const file = await ctx.api.getFile(fileId)
  if (!file.file_path) return null
  const token = loadEnv().TELEGRAM_BOT_TOKEN
  const res = await fetch(`https://api.telegram.org/file/bot${token}/${file.file_path}`)
  if (!res.ok) return null
  const buffer = Buffer.from(await res.arrayBuffer())
  const lower = file.file_path.toLowerCase()
  const mimeType = lower.endsWith('.png')
    ? 'image/png'
    : lower.endsWith('.webp')
      ? 'image/webp'
      : 'image/jpeg'
  return { data: buffer.toString('base64'), mimeType }
}

export function registerHandlers(bot: Bot) {
  bot.command('start', async (ctx) => {
    const db = getDb()
    const externalId = String(ctx.chat.id)
    const code = ctx.match.trim()

    if (code.length === 0) {
      const linked = await resolveUserByChannel(db, 'telegram', externalId)
      await ctx.reply(linked ? welcomeLinked : linkPrompt)
      return
    }

    const result = await consumeLinkingCode(db, code, 'telegram', externalId)
    if (result.status === 'linked') {
      await ctx.reply(welcomeLinked)
      logger.info({ externalId, userId: result.userId }, 'telegram linked')
      return
    }
    if (result.status === 'already') {
      await ctx.reply('Chat ini udah kesambung ke akun Cimeat. Langsung ngobrol aja.')
      return
    }
    await ctx.reply('Kodenya salah atau udah kadaluarsa. Minta kode baru dari app ya.')
  })

  bot.command('help', async (ctx) => {
    await ctx.reply(helpMessage)
  })

  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text
    if (text.startsWith('/')) return

    const db = getDb()
    const userId = await resolveUserByChannel(db, 'telegram', String(ctx.chat.id))
    if (!userId) {
      await ctx.reply(linkPrompt)
      return
    }

    await ctx.replyWithChatAction('typing').catch(() => {})

    try {
      const reply = await runCoachTextTurn({
        conversationId: conversationId(ctx),
        userId,
        source: 'telegram',
        parts: [{ text }],
      })
      await ctx.reply(reply)
    } catch (err) {
      logger.warn({ err }, 'telegram coach failed, pakai regex fallback')
      await replyWithRegexFallback(ctx, db, userId, text)
    }
  })

  bot.on('message:photo', async (ctx) => {
    const db = getDb()
    const userId = await resolveUserByChannel(db, 'telegram', String(ctx.chat.id))
    if (!userId) {
      await ctx.reply(linkPrompt)
      return
    }

    const photo = ctx.message.photo.at(-1)
    if (!photo) return

    await ctx.replyWithChatAction('typing').catch(() => {})
    try {
      const media = await downloadFileAsBase64(ctx, photo.file_id)
      if (!media) {
        await ctx.reply('Gagal ambil fotonya. Coba kirim ulang ya.')
        return
      }
      const scan = await scanFood(media.data, media.mimeType)
      if (scan.items.length === 0) {
        await ctx.reply('Hmm, gue gak yakin ini makanan apa. Coba foto yang lebih jelas ya.')
        return
      }
      for (const item of scan.items) {
        await saveAgentMeal(
          db,
          userId,
          {
            name: item.name,
            calories: item.calories,
            protein: item.protein,
            carb: item.carb,
            fat: item.fat,
            servings: 1,
          },
          'photo',
        )
      }
      const names = scan.items.map((i) => i.name).join(', ')
      await ctx.reply(
        buildMealReply({ name: names, calories: scan.totalCalories }) +
          ' Udah gue catat ya. Cek di app kalo mau ralat.',
      )
    } catch (err) {
      logger.error({ err }, 'telegram food scan failed')
      await ctx.reply('Lagi gagal analisis fotonya nih. Coba lagi atau catat manual aja dulu ya.')
    }
  })

  bot.catch((err) => {
    logger.error({ err: err.error }, 'telegram bot error')
  })
}

async function replyWithRegexFallback(
  ctx: Context,
  db: ReturnType<typeof getDb>,
  userId: string,
  text: string,
): Promise<void> {
  const parsed = parseQuickAddText(text)
  if (!parsed) {
    await ctx.reply('Lagi rada lemot nih otak gue. Coba lagi, atau tulis kayak "nasi goreng 600 kkal" ya.')
    return
  }
  const recorded = await recordChatMeal(db, userId, parsed, text, 'telegram')
  await ctx.reply(buildMealReply({ name: recorded.name, calories: recorded.calories }))
}
