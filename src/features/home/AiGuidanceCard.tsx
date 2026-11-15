import { Bot, RefreshCw, Send, Sparkles } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Tag } from '../../components/Tag.tsx'
import {
  askGuidance,
  fetchGuidance,
  useGuidanceContext,
  type Guidance,
} from '../../lib/guidance.ts'

// One answer per set of results, so moving between screens does not re-ask.
const cache = new Map<string, Guidance>()

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; guidance: Guidance }
  | { kind: 'error'; message: string }

const PRIORITY_CLASSES: Record<string, string> = {
  now: 'border-holo-peach text-holo-peach',
  today: 'border-holo-aqua text-holo-aqua',
  'this week': 'border-holo-lavender text-holo-lavender',
}

function AskAi({ context }: { context: unknown }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!question.trim() || busy) return
    setBusy(true)
    try {
      const result = await askGuidance(context, question.trim())
      setAnswer(result.answer)
    } catch (error) {
      setAnswer(error instanceof Error ? error.message : 'No answer.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-2">
      <label htmlFor="ask-ai" className="text-sm font-semibold text-slate-700">
        Ask the wellness assistant
      </label>
      <div className="flex gap-2">
        <input
          id="ask-ai"
          value={question}
          maxLength={500}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="For example: how can I sleep better on this shift?"
          className="min-h-11 flex-1 rounded-xl border px-3"
        />
        <button
          type="submit"
          disabled={busy}
          className="holo-button inline-flex min-h-11 items-center gap-2 rounded-xl px-4 font-semibold disabled:opacity-60"
        >
          <Send aria-hidden="true" size={16} />
          {busy ? 'Asking…' : 'Ask'}
        </button>
      </div>
      {answer && (
        <p aria-live="polite" className="rounded-xl bg-slate-100 p-3">
          {answer}
        </p>
      )}
    </form>
  )
}

/** AI guidance from Groq, built only from the app's own results (lib/guidance.ts). */
export function AiGuidanceCard() {
  const { key, context } = useGuidanceContext()
  const [nonce, setNonce] = useState(0)
  const [result, setResult] = useState<{ request: string; state: State }>()
  const request = `${key}#${nonce}`
  const cached = nonce === 0 ? cache.get(key) : undefined
  // Derived, not stored: a new request shows "loading" until its own answer arrives.
  const state: State = cached
    ? { kind: 'ready', guidance: cached }
    : result?.request === request
      ? result.state
      : { kind: 'loading' }

  useEffect(() => {
    if (nonce === 0 && cache.has(key)) return
    const controller = new AbortController()
    fetchGuidance(context, controller.signal)
      .then((guidance) => {
        cache.set(key, guidance)
        setResult({ request, state: { kind: 'ready', guidance } })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setResult({
          request,
          state: {
            kind: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        })
      })
    return () => controller.abort()
  }, [key, context, nonce, request])

  return (
    <section
      aria-labelledby="ai-guidance-title"
      className="glass-panel space-y-4 rounded-2xl p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="ai-guidance-title"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <Sparkles
            aria-hidden="true"
            size={20}
            className="text-holo-lavender"
          />
          AI guidance
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Tag>AI-generated</Tag>
          <Tag>Not a diagnosis</Tag>
          <button
            type="button"
            onClick={() => setNonce((value) => value + 1)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-semibold hover:bg-slate-100"
          >
            <RefreshCw aria-hidden="true" size={16} /> Refresh
          </button>
        </div>
      </div>

      {state.kind === 'loading' && (
        <p role="status" className="flex items-center gap-2 text-slate-700">
          <Bot aria-hidden="true" size={18} className="pulse-dot" />
          Reading today&apos;s results…
        </p>
      )}
      {state.kind === 'error' && (
        <p role="alert" className="text-slate-700">
          AI guidance is not available right now ({state.message}). Your
          statuses, alerts and protocols above work without it.
        </p>
      )}
      {state.kind === 'ready' && (
        <div className="space-y-4">
          <div>
            <p className="holo-text font-display text-xl font-semibold">
              {state.guidance.headline}
            </p>
            <p className="mt-1 text-slate-700">{state.guidance.summary}</p>
          </div>
          <ul className="grid gap-2">
            {state.guidance.focus.map((item, index) => (
              <li
                key={`${item.title}-${index}`}
                className="rounded-xl border border-slate-200 bg-slate-100 p-3"
              >
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs uppercase ${PRIORITY_CLASSES[item.priority] ?? PRIORITY_CLASSES.today}`}
                  >
                    {item.priority}
                  </span>
                  {item.title}
                  <span className="text-sm font-normal text-slate-600">
                    · {item.area}
                  </span>
                </p>
                <p className="mt-1 text-slate-700">{item.detail}</p>
              </li>
            ))}
          </ul>
          {state.guidance.prevention.length > 0 && (
            <div>
              <h3 className="font-semibold">
                Prevention for the next 24 hours
              </h3>
              <ul className="mt-1 list-disc space-y-1 pl-6 text-slate-700">
                {state.guidance.prevention.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
          {state.guidance.ground && (
            <p className="text-slate-700">
              <span className="font-semibold">Ground contact: </span>
              {state.guidance.ground}
            </p>
          )}
          <p className="text-xs text-slate-600">
            Generated by {state.guidance.model} via Groq from the app&apos;s own
            simulated results. It never changes a status, alert or route; follow
            the protocol and the flight surgeon.
          </p>
        </div>
      )}
      <AskAi context={context} />
    </section>
  )
}
