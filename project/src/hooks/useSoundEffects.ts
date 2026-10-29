import { useRef, useEffect, useCallback } from "react"

function makeAudio(src: string, volume = 1, loop = false) {
  const a = new Audio(src)
  a.volume = volume
  a.loop = loop
  return a
}

export function useSoundEffects() {
  // Atmosfera principal usa creepy_ambience conforme sua preferência
  const bgm          = useRef(makeAudio("/sounds/creepy_ambience.mp3",        0.30, true))
  const radioStatic  = useRef(makeAudio("/sounds/radio_fundo.mp3",           0.10, true))
  const evilCue      = useRef(makeAudio("/sounds/background_evil_cue.mp3",   0.35, false))
  const whisper      = useRef(makeAudio("/sounds/whisper_voices.mp3",         0.22, true))
  const phoneRing    = useRef(makeAudio("/sounds/telephone_ring.mp3",         0.60, true))
  const rotaryDial   = useRef(makeAudio("/sounds/rotary_phone_dial.mp3",      0.50))
  const siren        = useRef(makeAudio("/sounds/siren_approaching.mp3",      0.45))
  const wrongBuzz    = useRef(makeAudio("/sounds/wrong_buzzer.mp3",           0.50))
  const scream       = useRef(makeAudio("/sounds/scream.mp3",                 0.60))
  const horrorScream = useRef(makeAudio("/sounds/universfield-male-horror-scream-08-352438.mp3", 0.55))
  const winAmbience  = useRef(makeAudio("/sounds/freesound_community-car-passing-and-birds-chirping-in-the-background-94401.mp3", 0.35, true))

  const stopAudio = (audio: HTMLAudioElement) => {
    audio.pause()
    audio.currentTime = 0
  }

  useEffect(() => {
    return () => {
      ;[bgm, radioStatic, evilCue, whisper, phoneRing, rotaryDial, siren, wrongBuzz, scream, horrorScream, winAmbience].forEach(
        (r) => { r.current.pause(); r.current.src = "" }
      )
    }
  }, [])

  // Corta efeitos pontuais para não encavalar entre cenas
  const stopAllSFX = useCallback(() => {
    ;[phoneRing, rotaryDial, siren, wrongBuzz, scream, horrorScream, evilCue].forEach((r) =>
      stopAudio(r.current)
    )
  }, [])

  const stopBGM = useCallback(() => {
    ;[bgm, radioStatic, whisper, winAmbience].forEach((r) => stopAudio(r.current))
  }, [])

  // Liga a BGM (creepy_ambience) + rádio estático no turno
  const playBGM = useCallback(() => {
    stopAudio(winAmbience.current)
    stopAudio(evilCue.current)
    if (bgm.current.paused) {
      bgm.current.play().catch(() => {})
    }
    if (radioStatic.current.paused) {
      radioStatic.current.play().catch(() => {})
    }
  }, [])

  // Telefone tocando (INCOMING)
  const playPhoneRing = useCallback(() => {
    stopAudio(siren.current)
    stopAudio(rotaryDial.current)
    phoneRing.current.currentTime = 0
    phoneRing.current.play().catch(() => {})
  }, [])

  // Para o toque do telefone (com opção de tocar o clique ao atender)
  const stopPhoneRing = useCallback((withClick = true) => {
    stopAudio(phoneRing.current)
    if (withClick) {
      rotaryDial.current.currentTime = 0
      rotaryDial.current.play().catch(() => {})
      setTimeout(() => rotaryDial.current.pause(), 700)
    }
  }, [])

  // Som curto de confirmação/transferência (Código 1, Trote, ou transferência 190/192/153)
  const playConfirmTransfer = useCallback(() => {
    stopAudio(phoneRing.current)
    rotaryDial.current.currentTime = 0
    rotaryDial.current.play().catch(() => {})
    setTimeout(() => rotaryDial.current.pause(), 900)
  }, [])

  // Sirene ao despachar emergência (Código 2 ou acionamento crítico)
  const playDispatchCode2 = useCallback(() => {
    stopAudio(phoneRing.current)
    siren.current.currentTime = 0
    siren.current.play().catch(() => {})
    setTimeout(() => siren.current.pause(), 4000)
  }, [])

  // Buzzer de erro
  const playError = useCallback(() => {
    wrongBuzz.current.currentTime = 0
    wrongBuzz.current.play().catch(() => {})
  }, [])

  // Game Over — corta BGM, toca impacto sombrio + gritos
  const playGameOver = useCallback(() => {
    stopBGM()
    stopAllSFX()
    evilCue.current.currentTime = 0
    evilCue.current.play().catch(() => {})
    scream.current.currentTime = 0
    scream.current.play().catch(() => {})
    setTimeout(() => horrorScream.current.play().catch(() => {}), 900)
  }, [stopBGM, stopAllSFX])

  // Vitória — corta tensão e toca som de manhã tranquila
  const playWin = useCallback(() => {
    stopBGM()
    stopAllSFX()
    winAmbience.current.currentTime = 0
    winAmbience.current.play().catch(() => {})
  }, [stopBGM, stopAllSFX])

  // Whispers quando moral < 40
  const startLowMoraleAmbience = useCallback(() => {
    if (!whisper.current.paused) return
    whisper.current.currentTime = 0
    whisper.current.play().catch(() => {})
  }, [])

  const stopLowMoraleAmbience = useCallback(() => {
    stopAudio(whisper.current)
  }, [])

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
