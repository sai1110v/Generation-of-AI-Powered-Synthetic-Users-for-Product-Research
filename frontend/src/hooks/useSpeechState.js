import { useEffect, useState } from 'react'
import { getSpeechState, subscribeSpeech } from '../utils/speech'

export function useSpeechState() {
  const [state, setState] = useState(getSpeechState)
  useEffect(() => subscribeSpeech(setState), [])
  return state
}
