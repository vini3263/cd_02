import { useRef, useEffect, useCallback } from "react"

function makeAudio(src: string, volume = 1, loop = false) {
  const a = new Audio(src)
  a.volume = volume
  a.loop = loop
  return a
}

export function useSoundEffects() {
  const bgm          = useRef<HTMLAudioElement | null>(null)
  const radioStatic  = useRef<HTMLAudioElement | null>(null)
  const evilCue      = useRef<HTMLAudioElement | null>(null)
  const whisper      = useRef<HTMLAudioElement | null>(null)
  const phoneRing    = useRef<HTMLAudioElement | null>(null)
  const rotaryDial   = useRef<HTMLAudioElement | null>(null)
  const siren        = useRef<HTMLAudioElement | null>(null)
  const wrongBuzz    = useRef<HTMLAudioElement | null>(null)
  const scream       = useRef<HTMLAudioElement | null>(null)
  const horrorScream = useRef<HTMLAudioElement | null>(null)
  const winAmbience  = useRef<HTMLAudioElement | null>(null)

  const timersRef = useRef<number[]>([])

  const clearAudioTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
  }, [])

  const stopAudio = useCallback((audio: HTMLAudioElement | null) => {
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
  }, [])

  useEffect(() => {
    bgm.current          = makeAudio("/sounds/creepy_ambience.mp3", 0.30, true)
    radioStatic.current  = makeAudio("/sounds/radio_fundo.mp3", 0.10, true)
    evilCue.current      = makeAudio("/sounds/background_evil_cue.mp3", 0.35, false)
    whisper.current      = makeAudio("/sounds/whisper_voices.mp3", 0.22, true)
    phoneRing.current    = makeAudio("/sounds/telephone_ring.mp3", 0.60, true)
    rotaryDial.current   = makeAudio("/sounds/rotary_phone_dial.mp3", 0.50, false)
    siren.current        = makeAudio("/sounds/siren_approaching.mp3", 0.45, false)
    wrongBuzz.current    = makeAudio("/sounds/wrong_buzzer.mp3", 0.50, false)
    scream.current       = makeAudio("/sounds/scream.mp3", 0.60, false)
    horrorScream.current = makeAudio("/sounds/universfield-male-horror-scream-08-352438.mp3", 0.55, false)
    winAmbience.current  = makeAudio(
      "/sounds/freesound_community-car-passing-and-birds-chirping-in-the-background-94401.mp3",
      0.35,
      true
    )

    return () => {
      clearAudioTimers()
      ;[
        bgm,
        radioStatic,
        evilCue,
        whisper,
        phoneRing,
        rotaryDial,
        siren,
        wrongBuzz,
        scream,
        horrorScream,
        winAmbience,
      ].forEach((r) => stopAudio(r.current))
    }
  }, [clearAudioTimers, stopAudio])

  const stopAllSFX = useCallback(() => {
    clearAudioTimers()
    ;[phoneRing, rotaryDial, siren, wrongBuzz, scream, horrorScream, evilCue].forEach((r) =>
      stopAudio(r.current)
    )
  }, [clearAudioTimers, stopAudio])

  const stopBGM = useCallback(() => {
    ;[bgm, radioStatic, whisper, winAmbience].forEach((r) => stopAudio(r.current))
  }, [stopAudio])

  const playBGM = useCallback(() => {
    stopAudio(winAmbience.current)
    stopAudio(evilCue.current)
    if (bgm.current && bgm.current.paused) {
      bgm.current.play().catch(() => {})
    }
    if (radioStatic.current && radioStatic.current.paused) {
      radioStatic.current.play().catch(() => {})
    }
  }, [stopAudio])

  const playPhoneRing = useCallback(() => {
    stopAudio(siren.current)
    stopAudio(rotaryDial.current)
    if (phoneRing.current) {
      phoneRing.current.currentTime = 0
      phoneRing.current.play().catch(() => {})
    }
  }, [stopAudio])

  const stopPhoneRing = useCallback(
    (withClick = true) => {
      stopAudio(phoneRing.current)
      if (withClick && rotaryDial.current) {
        rotaryDial.current.currentTime = 0
        rotaryDial.current.play().catch(() => {})
        const id = window.setTimeout(() => {
          if (rotaryDial.current) rotaryDial.current.pause()
        }, 700)
        timersRef.current.push(id)
      }
    },
    [stopAudio]
  )

  const playConfirmTransfer = useCallback(() => {
    stopAudio(phoneRing.current)
    if (rotaryDial.current) {
      rotaryDial.current.currentTime = 0
      rotaryDial.current.play().catch(() => {})
      const id = window.setTimeout(() => {
        if (rotaryDial.current) rotaryDial.current.pause()
      }, 900)
      timersRef.current.push(id)
    }
  }, [stopAudio])

  const playDispatchCode2 = useCallback(() => {
    stopAudio(phoneRing.current)
    if (siren.current) {
      siren.current.currentTime = 0
      siren.current.play().catch(() => {})
      const id = window.setTimeout(() => {
        if (siren.current) siren.current.pause()
      }, 4000)
      timersRef.current.push(id)
    }
  }, [stopAudio])

  const playError = useCallback(() => {
    stopAudio(phoneRing.current)
    if (wrongBuzz.current) {
      wrongBuzz.current.currentTime = 0
      wrongBuzz.current.play().catch(() => {})
    }
  }, [stopAudio])

  const playGameOver = useCallback(() => {
    stopBGM()
    stopAllSFX()
    if (evilCue.current) {
      evilCue.current.currentTime = 0
      evilCue.current.play().catch(() => {})
    }
    if (scream.current) {
      scream.current.currentTime = 0
      scream.current.play().catch(() => {})
    }
    const id = window.setTimeout(() => {
      if (horrorScream.current) {
        horrorScream.current.currentTime = 0
        horrorScream.current.play().catch(() => {})
      }
    }, 900)
    timersRef.current.push(id)
  }, [stopBGM, stopAllSFX])

  const playWin = useCallback(() => {
    stopBGM()
    stopAllSFX()
    if (winAmbience.current) {
      winAmbience.current.currentTime = 0
      winAmbience.current.play().catch(() => {})
    }
  }, [stopBGM, stopAllSFX])

  const startLowMoraleAmbience = useCallback(() => {
    if (!whisper.current || !whisper.current.paused) return
    whisper.current.currentTime = 0
    whisper.current.play().catch(() => {})
  }, [])

  const stopLowMoraleAmbience = useCallback(() => {
    stopAudio(whisper.current)
  }, [stopAudio])

  return {
    playBGM,
    stopBGM,
    stopAllSFX,
    playPhoneRing,
    stopPhoneRing,
    playConfirmTransfer,
    playDispatchCode2,
    playError,
    playGameOver,
    playWin,
    startLowMoraleAmbience,
    stopLowMoraleAmbience,
  }
}
