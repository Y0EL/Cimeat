import { randomUUID } from 'crypto'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { loadEnv } from '../env'
import { logger } from '../logger'

let client: S3Client | null = null

type StorageConfig = {
  endpoint: string
  accessKey: string
  secretKey: string
  bucket: string
  publicUrl: string
}

function getConfig(): StorageConfig | null {
  const env = loadEnv()
  if (
    !env.STORAGE_ENDPOINT ||
    !env.STORAGE_ACCESS_KEY ||
    !env.STORAGE_SECRET_KEY ||
    !env.STORAGE_BUCKET ||
    !env.STORAGE_PUBLIC_URL
  ) {
    return null
  }
  return {
    endpoint: env.STORAGE_ENDPOINT,
    accessKey: env.STORAGE_ACCESS_KEY,
    secretKey: env.STORAGE_SECRET_KEY,
    bucket: env.STORAGE_BUCKET,
    publicUrl: env.STORAGE_PUBLIC_URL,
  }
}

function getClient(cfg: StorageConfig): S3Client {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: cfg.endpoint,
      credentials: { accessKeyId: cfg.accessKey, secretAccessKey: cfg.secretKey },
    })
  }
  return client
}

function extFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'audio/m4a': 'm4a',
    'audio/mp4': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'audio/webm': 'webm',
  }
  return map[mimeType] ?? 'bin'
}

export async function uploadBase64(
  base64: string,
  mimeType: string,
  prefix: 'images' | 'audio',
): Promise<string | null> {
  const cfg = getConfig()
  if (!cfg) return null

  try {
    const buffer = Buffer.from(base64, 'base64')
    const key = `${prefix}/${randomUUID()}.${extFromMime(mimeType)}`
    await getClient(cfg).send(
      new PutObjectCommand({
        Bucket: cfg.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    )
    return `${cfg.publicUrl.replace(/\/$/, '')}/${key}`
  } catch (err) {
    logger.error({ err, prefix }, 'storage upload failed')
    return null
  }
}

export function isStorageConfigured(): boolean {
  return getConfig() !== null
}
