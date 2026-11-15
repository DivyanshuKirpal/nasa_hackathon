// Vercel serverless function: POST /api/guidance.
// Set GROQ_API_KEY (and optionally GROQ_MODEL) in the Vercel project settings.
import { handleGuidanceNode } from '../server/groq.js'

export default function handler(req, res) {
  return handleGuidanceNode(req, res, process.env)
}
