import { useState, useEffect, useCallback, useRef } from 'react';
import { Language } from '../types';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface UseSpeechReturn {
  voiceState: VoiceState;
  isListening: boolean;
  isSpeaking: boolean;
  handsFree: boolean;
  setHandsFree: React.Dispatch<React.SetStateAction<boolean>>;
  transcript: string;
  setTranscript: React.Dispatch<React.SetStateAction<string>>;
  interimTranscript: string;
  errorMessage: string | null;
  clearError: () => void;
  hasSpeechRecognition: boolean;
  hasSpeechSynthesis: boolean;
  startListening: (onFinalCallback?: (text: string) => void) => void;
  stopListening: () => void;
  speakText: (text: string, onFinish?: () => void) => void;
  stopSpeaking: () => void;
  cancelAll: () => void;
  availableVoices: SpeechSynthesisVoice[];
}

export function useSpeech(lang: Language = 'mr'): UseSpeechReturn {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [handsFree, setHandsFree] = useState(false);
  const [hasSpeechRecognition, setHasSpeechRecognition] = useState(false);
  const [hasSpeechSynthesis, setHasSpeechSynthesis] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const recognitionRef = useRef<any>(null);
  const handsFreeTimerRef = useRef<any>(null);
  const onFinalCallbackRef = useRef<((text: string) => void) | null>(null);
  const isManuallyStoppedRef = useRef<boolean>(false);

  const getLangCode = useCallback((l: Language) => {
    switch (l) {
      case 'mr': return 'mr-IN';
      case 'hi': return 'hi-IN';
      case 'en': return 'en-IN';
      default: return 'mr-IN';
    }
  }, []);

  // Initialize browser feature availability & voice lists
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setHasSpeechRecognition(!!SpeechRecognition);

    const hasSynth = 'speechSynthesis' in window;
    setHasSpeechSynthesis(hasSynth);

    if (hasSynth) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (hasSynth) {
        window.speechSynthesis.cancel();
      }
      if (handsFreeTimerRef.current) {
        clearTimeout(handsFreeTimerRef.current);
      }
    };
  }, []);

  // Clean utterance text for natural agricultural reading
  const cleanSpeechText = (raw: string): string => {
    return raw
      .replace(/[*#_`~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [title](url) -> title
      .replace(/https?:\/\/\S+/g, '') // remove raw urls
      .replace(/•/g, ', ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Select best matching voice for rural comprehension
  const pickBestVoice = useCallback((langCode: string): SpeechSynthesisVoice | null => {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const normalizedLang = langCode.toLowerCase().replace('_', '-');
    const primaryCode = normalizedLang.split('-')[0]; // 'mr', 'hi', 'en'

    // 1. Exact match (e.g. mr-IN, hi-IN, en-IN)
    let match = voices.find(v => v.lang.toLowerCase().replace('_', '-') === normalizedLang);
    if (match) return match;

    // 2. Primary language code match (e.g. mr, hi)
    match = voices.find(v => v.lang.toLowerCase().startsWith(primaryCode));
    if (match) return match;

    // 3. Name-based match (e.g. "Marathi", "Hindi", "Indian")
    if (primaryCode === 'mr') {
      match = voices.find(v => v.name.toLowerCase().includes('marathi') || v.lang.includes('hi'));
    } else if (primaryCode === 'hi') {
      match = voices.find(v => v.name.toLowerCase().includes('hindi'));
    }
    if (match) return match;

    // 4. Indian English voice fallback
    match = voices.find(v => v.lang.toLowerCase().includes('en-in') || v.name.toLowerCase().includes('india'));
    if (match) return match;

    // 5. Default voice
    return voices.find(v => v.default) || voices[0] || null;
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
    if (voiceState === 'error') {
      setVoiceState('idle');
    }
  }, [voiceState]);

  // Stop active speech recognition safely
  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    if (voiceState === 'listening') {
      setVoiceState('idle');
    }
  }, [voiceState]);

  // Stop active speech synthesis safely
  const stopSpeaking = useCallback(() => {
    if (handsFreeTimerRef.current) {
      clearTimeout(handsFreeTimerRef.current);
      handsFreeTimerRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (voiceState === 'speaking') {
      setVoiceState('idle');
    }
  }, [voiceState]);

  // Cancel all active speech recognition & synthesis
  const cancelAll = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (handsFreeTimerRef.current) {
      clearTimeout(handsFreeTimerRef.current);
      handsFreeTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setVoiceState('idle');
    setInterimTranscript('');
  }, []);

  // Start speech recognition
  const startListening = useCallback((onFinalCallback?: (text: string) => void) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage('आपल्या ब्राउझरमध्ये व्हॉइस इनपुट उपलब्ध नाही. कृपया Google Chrome किंवा Edge वापरा.');
      setVoiceState('error');
      return;
    }

    // Cancel any active speech before listening
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Stop existing instance if any
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }

    isManuallyStoppedRef.current = false;
    setErrorMessage(null);
    setInterimTranscript('');
    onFinalCallbackRef.current = onFinalCallback || null;

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = getLangCode(lang);
      recognition.continuous = false; // single clear question per turn
      recognition.interimResults = true; // show live transcript while speaking
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setVoiceState('listening');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
        }

        if (final) {
          const cleanFinal = final.trim();
          setTranscript(prev => (prev ? `${prev} ${cleanFinal}` : cleanFinal));
          setInterimTranscript('');

          if (onFinalCallbackRef.current) {
            onFinalCallbackRef.current(cleanFinal);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        if (isManuallyStoppedRef.current) return;

        let msg = 'आवाज ओळखण्यात अडचण आली. कृपया पुन्हा प्रयत्न करा.';
        switch (event.error) {
          case 'not-allowed':
          case 'service-not-allowed':
            msg = 'मायक्रोफोन परवानगी नाकारली गेली. कृपया ॲड्रेस बारमधील कुलूप (Lock/Permissions) चिन्हावर क्लिक करून मायक्रोफोन सुरू करा.';
            break;
          case 'no-speech':
            msg = 'कोणताही आवाज ऐकू आला नाही. कृपया माइकच्या जवळ येऊन स्पष्ट बोला.';
            break;
          case 'audio-capture':
            msg = 'मायक्रोफोन आढळला नाही किंवा तो उपलब्ध नाही.';
            break;
          case 'network':
            msg = 'व्हॉइस सेवेसाठी नेटवर्क त्रुटी आली. इंटरनेट कनेक्शन तपासा.';
            break;
          case 'language-not-supported':
            msg = `निवडलेली भाषा (${getLangCode(lang)}) या ब्राउझरमध्ये व्हॉइससाठी उपलब्ध नाही.`;
            break;
          default:
            msg = `आवाज त्रुटी (${event.error}). कृपया पुन्हा माइक दाबा.`;
        }

        setErrorMessage(msg);
        setVoiceState('error');
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        setInterimTranscript('');
        setVoiceState(prev => (prev === 'listening' ? 'idle' : prev));
      };

      recognition.start();
    } catch (e: any) {
      console.error('Speech recognition start failed:', e);
      setErrorMessage('मायक्रोफोन सुरू करता आला नाही. कृपया पुन्हा प्रयत्न करा.');
      setVoiceState('error');
    }
  }, [lang, getLangCode]);

  // Read assistant response aloud
  const speakText = useCallback((text: string, onFinish?: () => void) => {
    if (!('speechSynthesis' in window)) {
      setErrorMessage('या ब्राउझरमध्ये टेक्स्ट-टू-स्पीच आवाज उपलब्ध नाही.');
      return;
    }

    // Cancel active synthesis first
    window.speechSynthesis.cancel();
    if (handsFreeTimerRef.current) {
      clearTimeout(handsFreeTimerRef.current);
      handsFreeTimerRef.current = null;
    }

    const clean = cleanSpeechText(text);
    if (!clean) {
      if (onFinish) onFinish();
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(clean);
      const targetLang = getLangCode(lang);
      utterance.lang = targetLang;
      utterance.rate = 0.88;
      utterance.pitch = 0.95;
      utterance.volume = 0.85;

      const voice = pickBestVoice(targetLang);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        setVoiceState('speaking');
        setErrorMessage(null);
      };

      utterance.onend = () => {
        setVoiceState('idle');
        if (onFinish) onFinish();

        // Hands-Free Mode: automatically listen for next question after speaking finishes
        if (handsFree && !isManuallyStoppedRef.current) {
          handsFreeTimerRef.current = setTimeout(() => {
            startListening();
          }, 800);
        }
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        setVoiceState('idle');
        if (onFinish) onFinish();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Failed to trigger speech synthesis:', err);
      setVoiceState('idle');
    }
  }, [lang, getLangCode, handsFree, pickBestVoice, startListening]);

  return {
    voiceState,
    isListening: voiceState === 'listening',
    isSpeaking: voiceState === 'speaking',
    handsFree,
    setHandsFree,
    transcript,
    setTranscript,
    interimTranscript,
    errorMessage,
    clearError,
    hasSpeechRecognition,
    hasSpeechSynthesis,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
    cancelAll,
    availableVoices,
  };
}
