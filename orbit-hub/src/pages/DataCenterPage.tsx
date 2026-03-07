import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ClipboardPaste, Database } from 'lucide-react'
import { getOrbitData, saveOrbitData } from '../lib/storage'
import type { OrbitData } from '../types/orbit'

function parseOrbitJson(raw: string): { ok: boolean; data?: OrbitData; error?: string } {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray((parsed as any).profiles) ||
      !Array.isArray((parsed as any).conversations)
    ) {
      return {
        ok: false,
        error: 'Expected a JSON object with "profiles" and "conversations" arrays.',
      }
    }

    return { ok: true, data: parsed as OrbitData }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export function DataCenterPage() {
  const existing = useMemo(() => getOrbitData(), [])

  const [rawJson, setRawJson] = useState(
    existing
      ? JSON.stringify(existing, null, 2)
      : `{
  "profiles": [
    {
      "id": "p1",
      "name": "Ada Lovelace",
      "company": "Analytical Engines",
      "role": "Founding Engineer",
      "interests": ["computing", "math", "creative writing"],
      "goals": ["launch v2 of the engine"]
    }
  ],
  "conversations": [
    {
      "id": "c1",
      "profileId": "p1",
      "topic": "Engine roadmap",
      "messages": [
        { "id": "m1", "from": "you", "text": "Loved hearing about your roadmap." },
        { "id": "m2", "from": "them", "text": "I want to ship the new engine this year." }
      ]
    }
  ]
}`,
  )
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('idle')
    setError(null)

    const result = parseOrbitJson(rawJson)
    if (!result.ok || !result.data) {
      setStatus('error')
      setError(result.error ?? 'Unable to parse JSON.')
      return
    }

    saveOrbitData(result.data)
    setStatus('success')
  }

  async function handlePasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setRawJson(text)
      }
    } catch {
      setError('Unable to access clipboard. Please paste with Ctrl+V / Cmd+V instead.')
      setStatus('error')
    }
  }

  const currentStats =
    existing && existing.profiles && existing.conversations
      ? {
          profiles: existing.profiles.length,
          conversations: existing.conversations.length,
        }
      : null

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Database className="h-5 w-5 text-orange-500" />
            Data Center
          </h2>
          <p className="text-sm text-slate-600 max-w-xl">
            Paste the JSON payload from your Chrome extension. Orbit Hub will store it under
            <code className="mx-1 rounded bg-slate-900 px-1 py-0.5 text-xs text-sky-200">
              current_orbit_data
            </code>
            in localStorage.
          </p>
        </div>

        {currentStats && (
          <div className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <span className="text-slate-500">Current orbit:</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {currentStats.profiles} profiles
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              {currentStats.conversations} conversations
            </span>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-4 shadow-sm"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm font-medium text-slate-700">
              Orbit JSON payload
            </label>
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm font-medium text-slate-700 hover:border-orange-300 hover:text-orange-600"
            >
              <ClipboardPaste className="h-3.5 w-3.5" />
              Paste from clipboard
            </button>
          </div>
          <textarea
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            spellCheck={false}
            rows={16}
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono text-slate-900 shadow-inner shadow-slate-100 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200/80"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-300/70 hover:bg-orange-400"
          >
            <Database className="h-3.5 w-3.5" />
            Save to localStorage
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700 mb-1.5">
              Expected shape
            </p>
            <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs text-slate-600">
{`{
  "profiles": [...],
  "conversations": [...]
}`}
            </pre>
          </div>

          {status === 'success' && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-sm text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-500" />
              <p>
                Data saved under
                <code className="mx-1 rounded bg-emerald-900/70 px-1 py-0.5 text-[11px]">
                  current_orbit_data
                </code>
                . Your dashboard will now analyze these profiles and conversations.
              </p>
            </div>
          )}

          {status === 'error' && error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-sm text-rose-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-rose-500" />
              <p>{error}</p>
            </div>
          )}

          <p className="text-sm leading-relaxed text-slate-500">
            Nothing is sent to a server. Orbit Hub only reads and writes to your browser&apos;s
            localStorage, so it&apos;s safe to experiment with test data from your extension.
          </p>
        </div>
      </form>
    </div>
  )
}

