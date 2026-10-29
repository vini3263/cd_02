import { useRef, useEffect, useCallback } from "react"

function makeAudio(src: string, volume = 1, loop = false) {
  const a = new Audio(src)
  a.volume = volume
  a.loop = loop
  return a
}

export function useSoundEffects() {
  const bgm        = useRef(makeAudio("/sounds/background_evil_cue.mp3",   0.25, true))
  const radioStatic= useRef(makeAudio("/sounds/radio_fundo.mp3",           0.08, true))
  const creepy     = useRef(makeAudio("/sounds/creepy_ambience.mp3",        0.15, true))
  const whisper    = useRef(makeAudio("/sounds/whisper_voices.mp3",         0.20, true))
  const phoneRing  = useRef(makeAudio("/sounds/telephone_ring.mp3",         0.70, true))
  const rotaryDial = useRef(makeAudio("/sounds/rotary_phone_dial.mp3",      0.60))
  const siren      = useRef(makeAudio("/sounds/siren_approaching.mp3",      0.55))
  const wrongBuzz  = useRef(makeAudio("/sounds/wrong_buzzer.mp3",           0.60))
  const scream     = useRef(makeAudio("/sounds/scream.mp3",                 0.70))
  const horrorScream = useRef(makeAudio("/sounds/universfield-male-horror-scream-08-352438.mp3", 0.65))
  const ambience   = useRef(makeAudio("/sounds/freesound_community-car-passing-and-birds-chirping-in-the-background-94401.mp3", 0.12, true))

  useEffect(() => {
    return () => {
      ;[bgm, radioStatic, creepy, whisper, phoneRing, siren, wrongBuzz, scream, horrorScream, ambience].forEach(
        (r) => { r.current.pause(); r.current.src = "" }
      )
    }
  }, [])

  const stopAll = useCallback((...refs: React.RefObject<HTMLAudioElement>[]) => {
    refs.forEach(r => { r.current.pause(); r.current.currentTime = 0 })
  }, [])

  // Liga a BGM + rádio estático (ao iniciar briefing/restart)
  const playBGM = useCallback(() => {
    bgm.current.currentTime = 0
    bgm.current.play().catch(() => {})
    setTimeout(() => radioStatic.current.play().catch(() => {}), 800)
    ambience.current.play().catch(() => {})
  }, [])

  // Telefone tocando (INCOMING)
  const playPhoneRing = useCallback(() => {
    phoneRing.current.currentTime = 0
    phoneRing.current.play().catch(() => {})
  }, [])

  const stopPhoneRing = useCallback(() => {
    phoneRing.current.pause()
    phoneRing.current.currentTime = 0
    // toca o discador rotativo ao atender
    rotaryDial.current.currentTime = 0
    rotaryDial.current.play().catch(() => {})
  }, [])

  // Sirene ao despachar Código 2 correto
  const playDispatchCode2 = useCallback(() => {
    siren.current.currentTime = 0
    siren.current.play().catch(() => {})
  }, [])

  // Buzzer de erro
  const playError = useCallback(() => {
    wrongBuzz.current.currentTime = 0
    wrongBuzz.current.play().catch(() => {})
  }, [])

  // Game Over — para BGM, toca grito
  const playGameOver = useCallback(() => {
    bgm.current.pause()
    radioStatic.current.pause()
    ambience.current.pause()
    scream.current.currentTime = 0
    scream.current.play().catch(() => {})
    setTimeout(() => horrorScream.current.play().catch(() => {}), 1200)
    setTimeout(() => creepy.current.play().catch(() => {}), 2000)
  }, [])

  // Toca whispers quando moral < 40 (chamado do componente)
  const startLowMoraleAmbience = useCallback(() => {
    if (!whisper.current.paused) return
    whisper.current.currentTime = 0
    whisper.current.play().catch(() => {})
  }, [])

  const stopLowMoraleAmbience = useCallback(() => {
    whisper.current.pause()
    whisper.current.currentTime = 0
  }, [])

  return {
    playBGM,
    playPhoneRing,
    stopPhoneRing,
    playDispatchCode2,
    playError,
    playGameOver,
    startLowMoraleAmbience,
    stopLowMoraleAmbience,
  }
}
