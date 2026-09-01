/**
 * Free browser text-to-speech via the Web Speech API.
 * No paid services or API keys required.
 */

const listeners = new Set()

let speakingState = {
  speaking: false,
  persona: null,
  text: '',
  /** 0–1 simulated energy for visualizer (boundary / interval driven) */
  energy: 0,
}

export function getSpeechState() {
  return speakingState
}

export function subscribeSpeech(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit(next) {
  speakingState = { ...speakingState, ...next }
  listeners.forEach((fn) => {
    try {
      fn(speakingState)
    } catch {
      /* ignore */
    }
  })
}

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function stopSpeaking() {
  if (!isSpeechSupported()) return
  window.speechSynthesis.cancel()
  emit({ speaking: false, persona: null, text: '', energy: 0 })
}

function loadVoices() {
  if (!isSpeechSupported()) return []
  return window.speechSynthesis.getVoices() || []
}

/**
 * Pick a stable voice for a persona so the same person sounds consistent.
 */
export function pickVoiceForPersona(persona) {
  const voices = loadVoices()
  if (!voices.length) return null

  const english = voices.filter((v) =>
    (v.lang || '').toLowerCase().startsWith('en')
  )
  const pool = english.length ? english : voices

  const gender = (persona?.gender || '').toLowerCase()
  const preferFemale = /female|woman|she|her|girl/.test(gender)
  const preferMale = /male|man|he|him|boy/.test(gender)

  const scored = pool.map((v, i) => {
    const name = `${v.name} ${v.lang}`.toLowerCase()
    let score = 0
    if (
      preferFemale &&
      /(female|woman|zira|samantha|karen|moira|tessa|fiona|victoria|google uk english female)/.test(
        name
      )
    ) {
      score += 3
    }
    if (
      preferMale &&
      /(male|man|david|mark|daniel|james|google uk english male)/.test(name)
    ) {
      score += 3
    }
    const seed = String(persona?.id ?? persona?.name ?? '0')
    let hash = 0
    for (let c = 0; c < seed.length; c += 1) {
      hash = (hash + seed.charCodeAt(c) * (c + 1)) % 997
    }
    score += (hash + i) % 2 === 0 ? 0.1 : 0
    return { v, score, i }
  })

  scored.sort((a, b) => b.score - a.score)
  const top = scored.slice(0, Math.min(6, scored.length))
  const seedNum = Number(persona?.id) || 0
  return top[seedNum % top.length]?.v || pool[0]
}

/**
 * Speak text as a persona. Returns a Promise that resolves when speech ends.
 */
export function speakAsPersona(text, persona = null, options = {}) {
  if (!isSpeechSupported() || !text?.trim()) {
    return Promise.resolve(false)
  }

  stopSpeaking()
  loadVoices()

  return new Promise((resolve) => {
    const utter = new SpeechSynthesisUtterance(text.trim())
    const voice = pickVoiceForPersona(persona)
    if (voice) {
      utter.voice = voice
      utter.lang = voice.lang || 'en-US'
    } else {
      utter.lang = 'en-US'
    }

    const id = Number(persona?.id) || 0
    utter.rate = options.rate ?? 0.95 + (id % 5) * 0.03
    utter.pitch = options.pitch ?? 0.9 + (id % 7) * 0.05
    utter.volume = options.volume ?? 1

    let pulseTimer = null
    const clearPulse = () => {
      if (pulseTimer) {
        window.clearInterval(pulseTimer)
        pulseTimer = null
      }
    }

    const finish = (ok) => {
      clearPulse()
      emit({ speaking: false, persona: null, text: '', energy: 0 })
      resolve(ok)
    }

    utter.onstart = () => {
      emit({ speaking: true, persona, text: text.trim(), energy: 0.45 })
      // Simulated voice energy (TTS has no real audio analyser)
      pulseTimer = window.setInterval(() => {
        const wave = 0.35 + Math.random() * 0.55
        emit({ energy: wave })
      }, 90)
    }

    utter.onboundary = () => {
      emit({ energy: 0.55 + Math.random() * 0.45 })
    }

    utter.onend = () => finish(true)
    utter.onerror = () => finish(false)

    window.setTimeout(() => {
      window.speechSynthesis.speak(utter)
    }, 50)
  })
}

/** Ensure voices are loaded (call once on app mount / first use). */
export function warmUpVoices() {
  if (!isSpeechSupported()) return
  loadVoices()
  if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
    window.speechSynthesis.onvoiceschanged = () => loadVoices()
  }
}

/** Stable seed for avatars / voice pairing */
export function personaSeed(persona) {
  if (!persona) return 'guest'
  return `${persona.id ?? ''}-${persona.name ?? 'persona'}`
}
