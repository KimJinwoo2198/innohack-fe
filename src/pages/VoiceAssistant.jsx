import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  Headphones,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Plug,
  RefreshCcw,
  Waves,
} from "lucide-react";

import Footer from "../components/Footer";
import { useVoiceAssistant } from "../hooks/useVoiceAssistant";

const DEFAULT_INSTRUCTIONS =
  "당신은 임신 및 산후 케어에 특화된 실시간 음성 어시스턴트입니다. 사용자에게 공감하면서, 과학적으로 검증된 정보를 한국어로 간결하게 전달하세요.";

const TOKEN_STORAGE_KEY = "voice_assistant.jwt";

const STATUS_TEXT = {
  idle: "대기 중",
  acquiring_media: "마이크 권한 요청 중",
  requesting_session: "세션 생성 중",
  connecting: "WebRTC 연결 중",
  connected: "연결됨",
  disconnecting: "연결 종료 중",
  error: "오류 발생",
};

export default function VoiceAssistant() {
  const audioRef = useRef(null);

  const [token, setToken] = useState(
    () => sessionStorage.getItem(TOKEN_STORAGE_KEY) ?? ""
  );
  const [rememberToken, setRememberToken] = useState(() => Boolean(token));
  const [instructions, setInstructions] = useState(DEFAULT_INSTRUCTIONS);

  const metadata = useMemo(
    () => ({
      client: "web",
      clientVersion: "1.0.0",
      locale: "ko-KR",
    }),
    []
  );

  const {
    status,
    error,
    session,
    iceState,
    mediaPermission,
    transcripts,
    connect,
    disconnect,
    resetTranscripts,
    attachRemoteAudio,
    isConnecting,
    localStreamActive,
    remoteStreamActive,
  } = useVoiceAssistant({
    accessToken: token,
    defaultInstructions: instructions,
    metadata,
  });

  useEffect(() => {
    if (!rememberToken) {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      return;
    }
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, [rememberToken, token]);

  useEffect(() => {
    if (audioRef.current) {
      attachRemoteAudio(audioRef.current);
    }
  }, [attachRemoteAudio]);

  const handleConnect = async () => {
    try {
      await connect({
        instructions,
        metadata,
      });
    } catch (_) {
      // useVoiceAssistant 내부에서 상태와 에러를 관리하므로 추가 처리 불필요
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <main className="flex min-h-dvh flex-col pb-28">
      <div className="flex flex-col gap-6 px-5 pt-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            실시간 음성 어시스턴트
          </h1>
          <p className="text-sm text-subtext">
            로그인 세션 쿠키를 우선 사용하며, 필요 시 JWT 토큰을 직접 입력해 OpenAI Realtime과 연결합니다.
          </p>
        </header>

        <section className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Plug className="h-5 w-5 text-primary" />
              <span className="text-base font-semibold">연결 상태</span>
            </div>
            <StatusBadge status={status} />
          </div>

          <div className="grid gap-3 text-sm text-text/90 md:grid-cols-2">
            <StatusItem
              label="ICE 상태"
              icon={<Waves className="h-4 w-4" />}
              value={iceState}
            />
            <StatusItem
              label="마이크 권한"
              icon={<Mic className="h-4 w-4" />}
              value={
                mediaPermission === "granted"
                  ? "허용됨"
                  : mediaPermission === "denied"
                    ? "거부됨"
                    : "대기 중"
              }
            />
            <StatusItem
              label="로컬 스트림"
              icon={<Mic className="h-4 w-4" />}
              value={localStreamActive ? "활성화" : "비활성"}
            />
            <StatusItem
              label="원격 스트림"
              icon={<Headphones className="h-4 w-4" />}
              value={remoteStreamActive ? "수신 중" : "대기 중"}
            />
          </div>

          {session ? (
            <div className="rounded-xl bg-gray-50 p-3 text-xs text-text/80">
              <p className="font-medium text-text">세션 정보</p>
              <div className="mt-1 flex flex-col gap-1">
                <span>세션 ID: {session.id}</span>
                <span>OpenAI 세션: {session.openai_session_id}</span>
                <span>모델: {session.voice}</span>
                <span>
                  만료: {session.client_secret?.expires_at ?? "정보 없음"}
                </span>
              </div>
            </div>
          ) : null}
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold">JWT Access Token (선택)</span>
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-primary"
              onClick={() => setToken("")}
            >
              <RefreshCcw className="h-4 w-4" />
              초기화
            </button>
          </div>
          <input
            type="password"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white"
            placeholder="필요할 때만 Bearer 없이 순수 JWT 토큰을 입력하세요"
            value={token}
            onChange={(event) => setToken(event.target.value.trim())}
          />
          <label className="flex items-center gap-2 text-xs text-subtext">
            <input
              type="checkbox"
              checked={rememberToken}
              onChange={(event) => setRememberToken(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            현재 세션에만 토큰 저장 (브라우저 종료 시 삭제)
          </label>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold">세션 지시문</span>
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-primary"
              onClick={() => setInstructions(DEFAULT_INSTRUCTIONS)}
            >
              <RefreshCcw className="h-4 w-4" />
              기본값 복원
            </button>
          </div>
          <textarea
            className="min-h-[120px] w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white"
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
          />
          <span className="text-xs text-subtext">
            세션마다 커스텀 지시문을 설정할 수 있습니다. 백엔드의
            `metadata`와 함께 세션 생성 요청에 포함됩니다.
          </span>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold">연동 제어</span>
            <ControlBadge status={status} />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleConnect}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-gray-300"
              disabled={isConnecting || status === "connected"}
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
              연결 시작
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-800 px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-gray-500"
              disabled={status !== "connected" && status !== "connecting"}
            >
              <PhoneOff className="h-4 w-4" />
              연결 종료
            </button>
          </div>
          {error ? (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-600">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div className="flex flex-col gap-1">
                <span className="font-semibold">연결 중 오류가 발생했습니다.</span>
                <span>{error.message}</span>
                {error.details ? (
                  <code className="rounded bg-white/60 p-2 text-[10px] text-red-500">
                    {typeof error.details === "string"
                      ? error.details
                      : JSON.stringify(error.details, null, 2)}
                  </code>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold">자막 / 텍스트 응답</span>
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-primary"
              onClick={resetTranscripts}
            >
              <RefreshCcw className="h-4 w-4" />
              초기화
            </button>
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-text/90">
            {transcripts.length === 0 ? (
              <p className="text-xs text-subtext">
                아직 수신된 메시지가 없습니다. 연결 후 어시스턴트를 호출해
                보세요.
              </p>
            ) : (
              transcripts.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-lg bg-white p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between text-xs text-subtext">
                    <span>{entry.role === "assistant" ? "어시스턴트" : entry.role}</span>
                    {entry.finalized ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <CircleDashed className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-text">
                    {entry.text || "(전달된 텍스트 없음)"}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <span className="text-base font-semibold">오디오 출력</span>
          <audio
            ref={audioRef}
            id="assistant-audio"
            autoPlay
            playsInline
            className="w-full rounded-xl border border-gray-200 bg-gray-50"
          />
          <span className="text-xs text-subtext">
            연결이 성사되면 OpenAI가 제공하는 음성 스트림이 자동으로 재생됩니다.
          </span>
        </section>
      </div>

      <Footer />
    </main>
  );
}

function StatusBadge({ status }) {
  const text = STATUS_TEXT[status] ?? "알 수 없음";
  const isPositive = status === "connected";
  const isNeutral =
    status === "idle" ||
    status === "acquiring_media" ||
    status === "requesting_session" ||
    status === "connecting";

  const badgeClass = isPositive
    ? "bg-emerald-100 text-emerald-600"
    : isNeutral
      ? "bg-primary/10 text-primary"
      : "bg-red-100 text-red-600";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
    >
      {text}
    </span>
  );
}

function StatusItem({ label, value, icon }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
      <span className="text-subtext">{icon}</span>
      <div className="flex flex-1 flex-col">
        <span className="text-xs text-subtext">{label}</span>
        <span className="text-sm font-medium text-text">{value}</span>
      </div>
    </div>
  );
}

function ControlBadge({ status }) {
  if (status === "connected") {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-600">
        <CheckCircle2 className="h-4 w-4" />
        안정적으로 연결됨
      </div>
    );
  }

  if (status === "connecting" || status === "requesting_session" || status === "acquiring_media") {
    return (
      <div className="flex items-center gap-2 text-xs text-primary">
        <Loader2 className="h-4 w-4 animate-spin" />
        연결 중...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-2 text-xs text-red-600">
        <AlertCircle className="h-4 w-4" />
        오류 발생
      </div>
    );
  }

  if (status === "disconnecting") {
    return (
      <div className="flex items-center gap-2 text-xs text-subtext">
        <PhoneOff className="h-4 w-4" />
        연결 해제 중
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-subtext">
      <MicOff className="h-4 w-4" />
      대기 중
    </div>
  );
}

