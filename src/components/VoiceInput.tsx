import { useEffect, useRef, useState } from "react";
import { Mic, Play, Trash2 } from "lucide-react";
import type { Lang } from "@/lib/survey";
import { LANGUAGES, UI } from "@/lib/survey";

interface Props {
  lang: Lang;
  onTranscript: (text: string) => void;
  audioUrl?: string | undefined;
  onAudio: (blob: Blob | undefined, previewUrl: string | undefined) => void;
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

export function VoiceInput({ lang, onTranscript, audioUrl, onAudio }: Props) {
  const t = UI[lang];
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    // Only show Voice Typing button if the platform genuinely supports it (hidden on iOS/Safari)
    setSpeechSupported(checkSpeechRecognitionSupport());
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
      recorderRef.current?.stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => {
      setRecordingSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recording]);


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
        setRecordingSeconds(0);

        // Keep compressed audio locally in-memory — zero uploads to AWS until final submit
        const localPreviewUrl = URL.createObjectURL(blob);
        onAudio(blob, localPreviewUrl);
      };
      recorderRef.current = recorder;
      setNotice(null);
      setRecordingSeconds(0);
      recorder.start();
      setRecording(true);
    } catch {
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
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {/* Hidden on iOS / Safari / unsupported devices to prevent broken UX */}
        {speechSupported && (
          <button
            type="button"
            onClick={toggleDictation}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
              listening
                ? "border-destructive bg-destructive/10 text-destructive"
                : "border-border bg-card text-foreground hover:bg-accent"
            }`}
          >
            <Mic className="h-4 w-4" />
            {listening ? t.listening : t.voiceType}
          </button>
        )}

        <button
          type="button"
          onClick={toggleRecording}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
            recording
              ? "border-destructive bg-destructive/10 text-destructive"
              : "border-border bg-card text-foreground hover:bg-accent"
          }`}
        >
          {recording ? (
            <span className="relative flex h-4 w-4 items-center justify-center" aria-hidden="true">
              <span className="absolute h-3 w-3 animate-ping rounded-full bg-destructive/40" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-destructive" />
            </span>
          ) : (
            <Play className="h-4 w-4" />
          )}
          {recording ? (
            <span aria-live="polite">
              {t.stop} · {Math.floor(recordingSeconds / 60)}:
              {String(recordingSeconds % 60).padStart(2, "0")}
            </span>
          ) : audioUrl ? (
            t.rerecord
          ) : (
            t.record
          )}
        </button>
      </div>

      {audioUrl && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
          <audio controls src={audioUrl} className="h-9 w-full max-w-xs" />
          <button
            type="button"
            onClick={handleDelete}
            className="text-muted-foreground transition-colors hover:text-destructive"
            aria-label="Delete recording"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {notice && <p className="text-xs text-muted-foreground">{notice}</p>}
    </div>
  );
}


