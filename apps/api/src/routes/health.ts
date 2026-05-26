import { Hono } from 'hono'

export const healthRouter = new Hono()

healthRouter.get('/', (c) => c.json({ ok: true, service: 'cimeat-api', timestamp: Date.now() }))
