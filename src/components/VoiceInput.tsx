import { useEffect, useRef, useState } from "react";
import { Mic, Play, Trash2 } from "lucide-react";
import type { Lang, QuestionType } from "@/lib/survey";
import { LANGUAGES, UI } from "@/lib/survey";

interface Props {
  lang: Lang;
  questionType: QuestionType;
  /** Existing text typed by the user (used to warn before discarding). */
  existingText?: string | undefined;
  onTranscript: (text: string) => void;
  audioUrl?: string | undefined;
  onAudio: (blob: Blob | undefined, previewUrl: string | undefined) => void;
  /** Called when recording starts so parent can wipe text answer. */
  onRecordStart?: (() => void) | undefined;
  /** Called when recording starts or stops. */
  onRecordingChange?: ((isRecording: boolean) => void) | undefined;
  /** When true, disables the audio recording button and only keeps voice typing. */
  disableAudioRecording?: boolean | undefined;
}

/**
 * Detects whether SpeechRecognition is reliably supported.
 * On iOS / Safari, Web Speech API is absent or restricted, so we return false.
 */
function checkSpeechRecognitionSupport(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIOS) return false;

  return Boolean(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );
}

/**
 * Returns audio constraints and options for high-quality voice compression (~32kbps mono).
 */
function getOptimalRecorderOptions(): MediaRecorderOptions {
  const types = [
    "audio/webm;codecs=opus",
    "audio/ogg;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];
  let chosenMime = "";
  for (const type of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      chosenMime = type;
      break;
    }
  }

  const options: MediaRecorderOptions = {
    audioBitsPerSecond: 32000, // 32kbps mono: ~240KB per minute (70-80% smaller)
  };
  if (chosenMime) {
    options.mimeType = chosenMime;
  }
  return options;
}

export function VoiceInput({
  lang,
  questionType,
  existingText,
  onTranscript,
  audioUrl,
  onAudio,
  onRecordStart,
  onRecordingChange,
  disableAudioRecording,
}: Props) {
  const t = UI[lang];
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // Voice input is only relevant for free-text and feedback questions, not choices/ratings
  const showVoiceControls =
    questionType === "text" || questionType === "longtext" || questionType === "file_text";

  useEffect(() => {
    // Only show Voice Typing button if the platform genuinely supports it (hidden on iOS/Safari)
    setSpeechSupported(checkSpeechRecognitionSupport());
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
      recorderRef.current?.stream?.getTracks().forEach((track) => track.stop());
      onRecordingChange?.(false);
    };
  }, []);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => {
      setRecordingSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  if (!showVoiceControls) return null;

  const toggleDictation = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setNotice(t.noSpeech);
      return;
    }
    const recognition = new SR();
    recognition.lang = LANGUAGES.find((l) => l.code === lang)?.speech ?? "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event: any) => {
      const text = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join(" ");
      onTranscript(text);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setNotice(null);
    setListening(true);
    recognition.start();
  };

  const toggleRecording = async () => {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }

    // Warn user if there is existing text that will be discarded
    if (existingText?.trim()) {
      const ok = window.confirm(
        lang === "hi"
          ? "टाइप किया हुआ टेक्स्ट हटा दिया जाएगा। क्या जारी रखें?"
          : lang === "mr"
          ? "टाइप केलेला मजकूर हटवला जाईल. सुरू ठेवायचे का?"
          : "Typed text will be discarded. Continue with audio recording?"
      );
      if (!ok) return;
      // Notify parent to wipe text
      onRecordStart?.();
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setNotice(t.noMic);
      return;
    }
    try {
      // Request mono voice-optimized audio stream (cuts uncompressed data by half)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1, // Mono
          sampleRate: 24000, // 24kHz voice profile
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Apply 32kbps compressed Opus / AAC encoding
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, getOptimalRecorderOptions());
      } catch {
        recorder = new MediaRecorder(stream);
      }

      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        onRecordingChange?.(false);
        setRecordingSeconds(0);

        // Keep compressed audio locally in-memory — zero uploads to AWS until final submit
        const localPreviewUrl = URL.createObjectURL(blob);
        onAudio(blob, localPreviewUrl);
      };
      recorderRef.current = recorder;
      setNotice(null);
      setRecordingSeconds(0);
      onRecordStart?.();
      recorder.start();
      setRecording(true);
      onRecordingChange?.(true);
    } catch {
      setRecording(false);
      onRecordingChange?.(false);
      setNotice(t.noMic);
    }
  };

  const handleDelete = () => {
    if (audioUrl && audioUrl.startsWith("blob:")) {
      URL.revokeObjectURL(audioUrl);
    }
    onAudio(undefined, undefined);
  };

  return (
    <div className="mt-5 space-y-4">
      <div className="flex flex-wrap gap-3">
        {/* Hidden on iOS / Safari / unsupported devices, and hidden while recording or once audio is recorded */}
        {speechSupported && !audioUrl && !recording && (
          <button
            type="button"
            onClick={toggleDictation}
            className={`inline-flex items-center gap-2.5 rounded-xl border-2 px-5 py-3 text-sm sm:text-base font-medium transition-all ${
              listening
                ? "border-destructive bg-destructive/10 text-destructive shadow-md"
                : "border-border bg-card text-foreground hover:bg-accent hover:border-primary/40 active:scale-[0.98]"
            }`}
          >
            <Mic className="h-5 w-5" />
            {listening ? t.listening : t.voiceType}
          </button>
        )}

        {!disableAudioRecording && (
          <button
            type="button"
            onClick={toggleRecording}
            className={`inline-flex items-center gap-2.5 rounded-xl border-2 px-5 py-3 text-sm sm:text-base font-medium transition-all ${
              recording
                ? "border-destructive bg-destructive/10 text-destructive shadow-md"
                : "border-border bg-card text-foreground hover:bg-accent hover:border-primary/40 active:scale-[0.98]"
            }`}
          >
            {recording ? (
              <span className="relative flex h-5 w-5 items-center justify-center" aria-hidden="true">
                <span className="absolute h-4 w-4 animate-ping rounded-full bg-destructive/40" />
                <span className="relative h-3 w-3 rounded-full bg-destructive" />
              </span>
            ) : (
              <Play className="h-5 w-5" />
            )}
            {recording ? (
              <span aria-live="polite" className="font-semibold">
                {t.stop} · {Math.floor(recordingSeconds / 60)}:
                {String(recordingSeconds % 60).padStart(2, "0")}
              </span>
            ) : audioUrl ? (
              t.rerecord
            ) : (
              t.record
            )}
          </button>
        )}
      </div>

      {recording && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive/5 border border-destructive/20">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-destructive animate-pulse" />
          <p className="text-xs sm:text-sm text-foreground">{t.stopHint}</p>
        </div>
      )}

      {!disableAudioRecording && audioUrl && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 w-fit">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-400">{t.done}</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl border-2 border-border bg-card p-3 shadow-sm">
            <audio controls src={audioUrl} className="h-10 w-full max-w-xs" />
            <button
              type="button"
              onClick={handleDelete}
              className="text-muted-foreground transition-colors hover:text-destructive p-2 rounded-lg hover:bg-destructive/10 shrink-0"
              aria-label="Delete recording"
              title="Delete recording"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {notice && (
        <div className="px-4 py-2.5 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs sm:text-sm text-muted-foreground">{notice}</p>
        </div>
      )}
    </div>
  );
}


