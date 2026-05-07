import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { db } from './lib/db.js'

// ── Environment validation ──
const isProd = process.env.PROD === 'true'
const hasMongoUri = !!process.env.MONGODB_URI
console.log('[server] Environment:')
console.log('  PROD (deployment tier):', isProd ? '✓ true' : '✗ false (dev/preview)')
console.log('  MONGODB_URI:', hasMongoUri ? '✓ configured' : '✗ not set (in-memory DB)')
if (isProd && !hasMongoUri) {
  console.warn('[server] ⚠ PROD=true but MONGODB_URI is not set — using in-memory storage')
}

const app = express()
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001

app.use(cors({ origin: '*' }))
app.use(express.json())

// ── Request logging ──
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    console.log(`[api] ${req.method} ${req.path} → ${res.statusCode} (${Date.now() - start}ms)`)
  })
  next()
})

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', db: db.isProduction() ? 'mongodb' : 'in-memory' })
})

// --- Add your API routes below ---

// === auto-mounted routers (backend planner) ===
import agentsRouter from './routes/agents.js'
import requirementblastsRouter from './routes/requirementblasts.js'
import compliancechecklistsRouter from './routes/compliancechecklists.js'
import duediligencerecordsRouter from './routes/duediligencerecords.js'
import dealsRouter from './routes/deals.js'
import emailtemplatesRouter from './routes/emailtemplates.js'
import meetingnotesRouter from './routes/meetingnotes.js'
import offmarketpropertiesRouter from './routes/offmarketproperties.js'
import dealpropertiesRouter from './routes/dealproperties.js'
app.use('/api/agents', agentsRouter)
app.use('/api/requirementblasts', requirementblastsRouter)
app.use('/api/compliancechecklists', compliancechecklistsRouter)
app.use('/api/duediligencerecords', duediligencerecordsRouter)
app.use('/api/deals', dealsRouter)
app.use('/api/emailtemplates', emailtemplatesRouter)
app.use('/api/meetingnotes', meetingnotesRouter)
app.use('/api/offmarketproperties', offmarketpropertiesRouter)
app.use('/api/dealproperties', dealpropertiesRouter)
// === end auto-mounted routers ===


// ── Error handler ──
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server] Error:', err.message)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`[server] API server running on http://localhost:${PORT}`)
  console.log(`[server] DB mode: ${db.isProduction() ? 'MongoDB' : 'In-memory'}`)
})

export { app, db }