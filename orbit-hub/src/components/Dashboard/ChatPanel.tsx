import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { MessageCircle, Send, Sparkles, UserCircle2 } from 'lucide-react'
import type { OrbitConversationMessage, OrbitProfile } from '../../types/orbit'
import { FeatureCard } from '../FeatureCard'
import { getChatHistory, saveChatHistory } from '../../lib/storage'

type Props = {
  profile?: OrbitProfile
}

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'

export function ChatPanel({ profile }: Props) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<OrbitConversationMessage[]>(() => {
    const history = getChatHistory()
    if (!profile) return []
    const existing = history.find((h) => h.profileId === profile.id)
    return (
      existing?.messages ?? [
        {
          id: 'intro',
          from: 'them',
          text:
            'Orbit Hub Chat will sit alongside your conversations. Use it to jot thoughts, generate prompts, and summarize threads.',
          createdAt: new Date().toISOString(),
        },
      ]
    )
  })

  const suggestions = useMemo(() => {
    const base: string[] = []
    if (profile?.projects && profile.projects.length > 0) {
      base.push(
        `“Last time we talked, you mentioned ${profile.projects[0]}. How is that going now?”`,
      )
    }
    if (profile?.goals && profile.goals.length > 0) {
      base.push(`“What’s the latest update on ${profile.goals[0]}?”`)
    }
    if (profile?.interests && profile.interests.length > 0) {
      base.push(
        `“I saw something related to ${profile.interests[0]}. Have you come across anything interesting there recently?”`,
      )
    }
    base.push(
      '“What’s something you’re excited about this week that we haven’t talked about yet?”',
    )
    return base.slice(0, 3)
  }, [profile])

  function persist(newMessages: OrbitConversationMessage[]) {
    if (!profile) return
    const history = getChatHistory()
    const existingIndex = history.findIndex((h) => h.profileId === profile.id)
    const updated = {
      id: profile.id,
      profileId: profile.id,
      messages: newMessages,
    }
    if (existingIndex === -1) {
      history.push(updated)
    } else {
      history[existingIndex] = updated
    }
    saveChatHistory(history)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!input.trim() || !profile) return

    const now = new Date().toISOString()
    const userMessage: OrbitConversationMessage = {
      id: crypto.randomUUID(),
      from: 'you',
      text: input.trim(),
      createdAt: now,
    }

    const optimisticMessages = [...messages, userMessage]
    setMessages(optimisticMessages)
    persist(optimisticMessages)
    setInput('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_name: profile.name,
          profile_company: profile.company ?? null,
          profile_interests: profile.interests ?? [],
          messages: optimisticMessages.map((m) => ({
            from: m.from,
            text: m.text,
          })),
        }),
      })

      if (!res.ok) {
        throw new Error('Request failed')
      }

      const data: { reply: string } = await res.json()

      const botMessage: OrbitConversationMessage = {
        id: crypto.randomUUID(),
        from: 'them',
        text: data.reply,
        createdAt: new Date().toISOString(),
      }

      const updatedMessages = [...optimisticMessages, botMessage]
      setMessages(updatedMessages)
      persist(updatedMessages)
    } catch {
      const errorMessage: OrbitConversationMessage = {
        id: crypto.randomUUID(),
        from: 'them',
        text: "I couldn't reach the Orbit Hub AI right now. Try again in a moment.",
        createdAt: new Date().toISOString(),
      }
      const updatedMessages = [...optimisticMessages, errorMessage]
      setMessages(updatedMessages)
      persist(updatedMessages)
    }
  }

  const avatarInitial = profile?.name?.[0]?.toUpperCase() ?? '?'

  return (
    <FeatureCard
      title="Orbit Chat"
      description="A sidecar chat that analyzes your conversations, keeps summaries, and suggests prompts."
      icon={MessageCircle}
      accent="sky"
    >
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 via-amber-400 to-rose-400 text-[11px] font-semibold text-white shadow-md shadow-orange-300/60">
              {avatarInitial}
              <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 ring-2 ring-slate-900">
                <UserCircle2 className="h-3 w-3 text-sky-300" />
              </div>
            </div>
            <div className="text-sm leading-tight">
              <p className="font-medium text-slate-900">
                {profile?.name ?? 'Select a profile in your data'}
              </p>
              <p className="text-slate-500">
                Notes, reflections, and prompts stay tied to this person.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2 py-1 text-[10px] text-orange-700">
            <Sparkles className="h-3 w-3 text-orange-400" />
            <span>AI assistant via backend</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-orange-100 bg-orange-50/70 p-3 max-h-64 overflow-y-auto">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex text-sm ${
                m.from === 'you' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.from === 'you'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-slate-800 border border-orange-100'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">
              Start typing a thought or draft message. We&apos;ll keep a running, searchable trace
              here.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex items-end gap-1.5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
            placeholder="Capture a reflection, a draft message, or something you noticed in the conversation…"
            className="min-h-[48px] flex-1 resize-none rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200/80"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-orange-500 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-300/70 hover:bg-orange-400"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>

        {suggestions.length > 0 && (
          <div className="rounded-lg bg-white p-3 text-sm text-slate-700 space-y-1.5 border border-orange-100">
            <p className="flex items-center gap-1.5 text-slate-800">
              <Sparkles className="h-3 w-3 text-orange-400" />
              Suggested prompts
            </p>
            <ul className="space-y-0.5">
              {suggestions.map((prompt) => (
                <li key={prompt} className="flex gap-1.5">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-400" />
                  <span>{prompt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </FeatureCard>
  )
}

