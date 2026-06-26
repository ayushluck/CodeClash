import express from 'express'
import cors from 'cors'

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', project: 'CodeClash' })
})

export default app