// Server-side proxy to Groq for AI crew guidance.
//
// The API key lives only on the server: in `.env.local` for the Vite dev and
// preview servers (vite.config.ts mounts this handler at /api/guidance) and in
// the Vercel project's environment variables for the deployed function
// (api/guidance.js). The browser never sees the key.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = 'openai/gpt-oss-120b'
const FALLBACK_MODEL = 'openai/gpt-oss-20b'
const MAX_BODY_CHARS = 24_000
const MAX_QUESTION_CHARS = 600
const TIMEOUT_MS = 25_000

const RULES = `You are the onboard wellness assistant inside "Crew Health Check", a prototype app for astronauts on long-duration space missions.
You turn the app's own computed results (statuses, alerts, the crew member's latest readings and personal usual ranges) into short, calm, preventive guidance.
Hard rules:
- Use only the data given. Never invent readings, numbers, thresholds, statistics, studies or sources.
- This is not a diagnosis. Use words like "possible", "check", "consider", "consult". Never write "you have". Never conclude a disease.
- Never name medications, supplements or doses.
- Never state numeric cut-offs, limits or targets of your own (for example "below 4 hours" or "at least 2 litres"); refer to the app's alerts, protocols and the crew member's own usual values instead.
- If any area has status "act", the first focus item must tell the crew member to follow the on-board protocol shown in the app now and to involve the flight surgeon as the app's triage route says.
- Prefer prevention and daily habits: sleep timing, hydration, exercise countermeasures, meal timing, light exposure, workload pacing, rest. Mention radiation shelter only if the data shows a radiation or space weather alert.
- Plain words, short sentences, warm and calm tone. The data is simulated; never mention real astronauts.`

const GUIDANCE_FORMAT = `Reply with one JSON object only, in this shape:
{"headline": string (max 9 words),
 "summary": string (2 sentences max),
 "focus": [{"area": string (one of the area names given), "title": string (max 6 words), "detail": string (1-2 sentences), "priority": "now" | "today" | "this week"}] (2 to 4 items, most urgent first),
 "prevention": [string] (3 short habit tips for the next 24 hours),
 "ground": string (one sentence on when to contact the flight surgeon, consistent with the app's route and communication delay)}`

const ASK_FORMAT = `Reply with one JSON object only: {"answer": string (at most 90 words)}. If the question is outside crew health and wellness, say so politely in the answer.`

function badRequest(message) {
  return { status: 400, json: { error: message } }
}

function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body)
  if (typeof req.body === 'string') return Promise.resolve(JSON.parse(req.body))
  return new Promise((resolve, reject) => {
    let raw = ''
    req.setEncoding('utf8')
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > MAX_BODY_CHARS) {
        reject(new Error('Request body too large'))
        req.destroy()
      }
    })
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

async function callGroq(key, model, messages) {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_completion_tokens: 900,
      response_format: { type: 'json_object' },
      ...(model.startsWith('openai/gpt-oss')
        ? { reasoning_effort: 'low' }
        : {}),
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = data?.error?.message ?? `Groq returned ${response.status}`
    throw new Error(message)
  }
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string') throw new Error('Groq returned no content')
  return JSON.parse(content)
}

/**
 * Validates the request, asks Groq and returns { status, json }.
 * `env` carries GROQ_API_KEY and optionally GROQ_MODEL.
 */
export async function guidanceResponse(body, env) {
  const key = env.GROQ_API_KEY
  if (!key) {
    return {
      status: 503,
      json: { error: 'AI guidance is not configured (GROQ_API_KEY missing).' },
    }
  }
  if (!body || typeof body !== 'object') return badRequest('Expected JSON')
  const { mode, context, question } = body
  if (mode !== 'guidance' && mode !== 'ask') return badRequest('Unknown mode')
  if (!context || typeof context !== 'object') return badRequest('No context')
  const contextText = JSON.stringify(context)
  if (contextText.length > MAX_BODY_CHARS) return badRequest('Context too big')
  if (
    mode === 'ask' &&
    (typeof question !== 'string' ||
      !question.trim() ||
      question.length > MAX_QUESTION_CHARS)
  ) {
    return badRequest('Question missing or too long')
  }

  const messages = [
    {
      role: 'system',
      content: `${RULES}\n\n${mode === 'guidance' ? GUIDANCE_FORMAT : ASK_FORMAT}`,
    },
    {
      role: 'user',
      content:
        mode === 'guidance'
          ? `App results for today:\n${contextText}`
          : `App results for today:\n${contextText}\n\nCrew member's question: ${question.trim()}`,
    },
  ]

  const preferred = env.GROQ_MODEL || DEFAULT_MODEL
  try {
    let result
    let model = preferred
    try {
      result = await callGroq(key, model, messages)
    } catch (error) {
      if (preferred === FALLBACK_MODEL) throw error
      model = FALLBACK_MODEL
      result = await callGroq(key, model, messages)
    }
    return { status: 200, json: { ...result, model } }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { status: 502, json: { error: `AI guidance failed: ${message}` } }
  }
}

/** Node (req, res) handler for the Vite middleware and the Vercel function. */
export async function handleGuidanceNode(req, res, env) {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end(JSON.stringify({ error: 'Use POST' }))
    return
  }
  let body
  try {
    body = await readJsonBody(req)
  } catch {
    res.statusCode = 400
    res.end(JSON.stringify({ error: 'Invalid JSON body' }))
    return
  }
  const { status, json } = await guidanceResponse(body, env)
  res.statusCode = status
  res.end(JSON.stringify(json))
}
