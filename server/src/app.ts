import express from 'express'
import cors from 'cors'
import {ENV} from './lib/ENV'
const app = express()

app.use(cors({ origin: ENV.CLIENT_URL }))
app.use(express.json())

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', project: 'CodeClash' })
})

export default app