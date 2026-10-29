import { useRef, useEffect, useCallback } from 'react';

export function useSoundEffects() {
  const ambience = useRef<HTMLAudioElement | null>(null);
  const radioBg = useRef<HTMLAudioElement | null>(null);
  const phoneRing = useRef<HTMLAudioElement | null>(null);
  const phoneDial = useRef<HTMLAudioElement | null>(null);
  const siren = useRef<HTMLAudioElement | null>(null);
  const wrongBuzzer = useRef<HTMLAudioElement | null>(null);
  const gameOverCue = useRef<HTMLAudioElement | null>(null);
  const winMorning = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    ambience.current = new Audio('/sounds/creepy_ambience.mp3');
    ambience.current.loop = true;
    ambience.current.volume = 0.25;

    radioBg.current = new Audio('/sounds/radio_fundo.mp3');
    radioBg.current.loop = true;
    radioBg.current.volume = 0.12;

    phoneRing.current = new Audio('/sounds/telephone_ring.mp3');
    phoneRing.current.loop = true;
    phoneRing.current.volume = 0.55;

    phoneDial.current = new Audio('/sounds/rotary_phone_dial.mp3');
    phoneDial.current.volume = 0.45;

    siren.current = new Audio('/sounds/siren_approaching.mp3');
    siren.current.volume = 0.4;

    wrongBuzzer.current = new Audio('/sounds/wrong_buzzer.mp3');
    wrongBuzzer.current.volume = 0.45;

    gameOverCue.current = new Audio('/sounds/background_evil_cue.mp3');
    gameOverCue.current.volume = 0.6;

    winMorning.current = new Audio(
      '/sounds/freesound_community-car-passing-and-birds-chirping-in-the-background-94401.mp3'
    );
    winMorning.current.volume = 0.4;

    return () => {
      [
        ambience,
        radioBg,
        phoneRing,
        phoneDial,
        siren,
        wrongBuzzer,
        gameOverCue,
        winMorning,
      ].forEach((ref) => {
        if (ref.current) {
          ref.current.pause();
          ref.current.currentTime = 0;
        }
      });
    };
  }, []);

  const safePlay = (audio: HTMLAudioElement | null) => {
    if (!audio) return;
    audio.play().catch(() => {
      // Ignora bloqueio de autoplay caso ainda não tenha havido clique
    });
  };

  const stopAudio = (audio: HTMLAudioElement | null) => {
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  };

  // Para todos os efeitos pontuais (evita som vazando de uma cena para outra)
  const stopAllSFX = useCallback(() => {
    stopAudio(phoneRing.current);
    stopAudio(phoneDial.current);
    stopAudio(siren.current);
    stopAudio(wrongBuzzer.current);
  }, []);

  // Inicia o som ambiente do turno
  const playBGM = useCallback(() => {
    stopAudio(gameOverCue.current);
    stopAudio(winMorning.current);
    if (ambience.current && ambience.current.paused) {
      safePlay(ambience.current);
    }
    if (radioBg.current && radioBg.current.paused) {
      safePlay(radioBg.current);
    }
  }, []);

  const stopBGM = useCallback(() => {
    stopAudio(ambience.current);
    stopAudio(radioBg.current);
  }, []);

  const playPhoneRing = useCallback(() => {
    stopAllSFX();
    safePlay(phoneRing.current);
  }, [stopAllSFX]);

  const stopPhoneRing = useCallback(() => {
    stopAudio(phoneRing.current);
  }, []);

  // Toca um clique/discagem rápida ao atender ou confirmar ação
  const playPhoneClick = useCallback(() => {
    stopAudio(phoneRing.current);
    if (phoneDial.current) {
      phoneDial.current.currentTime = 0;
      safePlay(phoneDial.current);
      setTimeout(() => {
        if (phoneDial.current) phoneDial.current.pause();
      }, 650);
    }
  }, []);

  const playDispatchCode2 = useCallback(() => {
    stopAudio(phoneRing.current);
    if (siren.current) {
      siren.current.currentTime = 0;
      safePlay(siren.current);
      // Corta a sirene após 3.5s para não poluir a leitura do relatório
      setTimeout(() => {
        if (siren.current) siren.current.pause();
      }, 3500);
    }
  }, []);

  const playError = useCallback(() => {
    stopAudio(phoneRing.current);
    if (wrongBuzzer.current) {
      wrongBuzzer.current.currentTime = 0;
      safePlay(wrongBuzzer.current);
    }
  }, []);

  const playGameOver = useCallback(() => {
    stopBGM();
    stopAllSFX();
    if (gameOverCue.current) {
      gameOverCue.current.currentTime = 0;
      safePlay(gameOverCue.current);
    }
  }, [stopBGM, stopAllSFX]);

  const playWin = useCallback(() => {
    stopBGM();
    stopAllSFX();
    if (winMorning.current) {
      winMorning.current.currentTime = 0;
      safePlay(winMorning.current);
    }
  }, [stopBGM, stopAllSFX]);

  return {
    playBGM,
    stopBGM,
    playPhoneRing,
    stopPhoneRing,
    playPhoneClick,
    playDispatchCode2,
    playError,
    playGameOver,
    playWin,
    stopAllSFX,
  };
}
