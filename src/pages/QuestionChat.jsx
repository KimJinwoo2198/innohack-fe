import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
	AlertTriangle,
	ArrowLeft,
	Loader2,
	Send,
	Sparkles,
	WifiOff,
} from "lucide-react";

const DEFAULT_GREETING =
	"안녕하세요! 음식명을 기준으로 안전성과 섭취 팁을 실시간으로 찾아드릴게요.";
const DEFAULT_FOOD_NAME = "인식된 음식";
// 백엔드가 trailing slash 없는 경로(`/chat`)만 허용하므로 slash 제거
const WS_PATH = "/ws/vision/foods/chat";
const DEFAULT_HISTORY_LIMIT = Number(
	import.meta.env?.VITE_FOOD_CHAT_HISTORY_LIMIT ?? 6
);

const deriveWsBase = () => {
	const DEFAULT_ORIGIN = "https://innohack.kimjinwoo.me";
	const raw =
		import.meta.env?.VITE_FOOD_CHAT_WS_BASE ??
		import.meta.env?.VITE_API_BASE_URL ??
		DEFAULT_ORIGIN;

	const normalize = (candidate) => {
		if (!candidate) return null;
		const trimmed = candidate.trim();
		const ensuredProtocol = /^\w+:\/\//.test(trimmed)
			? trimmed
			: `https://${trimmed}`;
		try {
			const parsed = new URL(ensuredProtocol);
			const pathname =
				parsed.pathname && parsed.pathname !== "/"
					? parsed.pathname.replace(/\/$/, "")
					: "";
			if (parsed.protocol === "wss:" || parsed.protocol === "ws:") {
				return `${parsed.protocol}//${parsed.host}${pathname}`;
			}
			if (parsed.protocol === "https:") {
				return `wss://${parsed.host}${pathname}`;
			}
			if (parsed.protocol === "http:") {
				return `ws://${parsed.host}${pathname}`;
			}
			return `wss://${parsed.host}${pathname}`;
		} catch (_) {
			return null;
		}
	};

	return (
		normalize(raw) ??
		normalize(DEFAULT_ORIGIN) ??
		"wss://innohack.kimjinwoo.me"
	);
};

const safeJsonParse = (payload) => {
	try {
		return JSON.parse(payload);
	} catch (error) {
		console.warn("[FoodChat] JSON parse 실패", error);
		return null;
	}
};

const nanoId = () => {
	if (typeof crypto !== "undefined" && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	return `id-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
};

const statusLabelMap = {
	initializing: "안전 정보를 불러오는 중이에요...",
	processing: "답변을 생성하고 있어요...",
	error: "일시적인 오류가 발생했어요.",
};

export default function QuestionChat() {
	const location = useLocation();
	const navigate = useNavigate();
	const initialQuestion = location.state?.initialQuestion ?? "";
	const fallbackFoodFromResult =
		location.state?.result?.food_name &&
		location.state.result.food_name.trim().length > 0
			? location.state.result.food_name.trim()
			: null;
	const initialFoodFromState =
		location.state?.foodName && location.state.foodName.trim().length > 0
			? location.state.foodName.trim()
			: fallbackFoodFromResult;
	const dialectStyle = location.state?.dialectStyle ?? "standard";

	const [foodName, setFoodName] = useState(initialFoodFromState);
	const [input, setInput] = useState(initialQuestion);
	const [messages, setMessages] = useState(() => [
		{
			id: "assistant-greeting",
			role: "assistant",
			text: DEFAULT_GREETING,
		},
	]);
	const [baselineGuidance, setBaselineGuidance] = useState(null);
	const [assistantTyping, setAssistantTyping] = useState(false);
	const [pipelineStatus, setPipelineStatus] = useState("idle");
	const [connectionStatus, setConnectionStatus] = useState("idle");
	const [sessionId, setSessionId] = useState(location.state?.sessionId ?? null);

	const wsBase = useMemo(() => deriveWsBase(), []);
	const wsRef = useRef(null);
	const sendLockRef = useRef(false);
	const connectSocketRef = useRef(null);
	const reconnectTimerRef = useRef(null);
	const reconnectAttemptRef = useRef(0);
	const shouldReconnectRef = useRef(true);
	const sessionIdRef = useRef(sessionId);
	const scrollAnchorRef = useRef(null);

	useEffect(() => {
		sessionIdRef.current = sessionId;
	}, [sessionId]);

	const appendMessage = useCallback((message) => {
		setMessages((prev) => {
			const next = [
				...prev,
				{
					id: message.id ?? nanoId(),
					role: message.role ?? "assistant",
					text: message.text ?? "",
					traceId: message.traceId,
					references: message.references ?? [],
					snippets: message.snippets ?? [],
				},
			];
			if (!Number.isFinite(DEFAULT_HISTORY_LIMIT) || DEFAULT_HISTORY_LIMIT <= 0) {
				return next;
			}
			return next.slice(-DEFAULT_HISTORY_LIMIT);
		});
	}, []);

	useEffect(() => {
		scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, assistantTyping]);

	const buildWsUrl = useCallback(
		(nextSessionId) => {
			const base = (wsBase || "").replace(/\/$/, "");
			const params = new URLSearchParams();
			if (foodName) {
				params.set("food", foodName);
			}
			if (dialectStyle) {
				params.set("dialect_style", dialectStyle);
			}
			if (nextSessionId) {
				params.set("session_id", nextSessionId);
			}
			return `${base}${WS_PATH}?${params.toString()}`;
		},
		[dialectStyle, foodName, wsBase]
	);

	const handleAssistantError = useCallback(
		(payload) => {
			const reason =
				payload?.message ??
				"일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.";
			appendMessage({
				role: "system",
				text: reason,
			});
			setAssistantTyping(false);
		},
		[appendMessage]
	);

	const handleMessage = useCallback(
		(event) => {
			const data = safeJsonParse(event.data);
			if (!data || !data.type) return;

			switch (data.type) {
				case "chat.connected": {
					setConnectionStatus("connected");
					if (data.session_id) {
						setSessionId(data.session_id);
					}
					if (data.food_name && !foodName) {
						setFoodName(data.food_name);
					}
					break;
				}
				case "chat.status": {
					setPipelineStatus(data.status ?? "idle");
					break;
				}
				case "chat.baseline": {
					setBaselineGuidance(data.guidance ?? null);
					if (data.guidance?.safety_summary) {
						appendMessage({
							role: "assistant",
							text: data.guidance.safety_summary,
							id: "assistant-baseline-summary",
						});
					}
					break;
				}
				case "assistant.status": {
					setAssistantTyping(data.status === "processing");
					if (data.status && data.status !== "processing") {
						setPipelineStatus(data.status);
					}
					break;
				}
				case "assistant.reply": {
					setAssistantTyping(false);
					appendMessage({
			role: "assistant",
						text: data.answer ?? "",
						traceId: data.trace_id,
						references: data.references ?? [],
						snippets: data.retrieved_snippets ?? [],
					});
					break;
				}
				case "assistant.error": {
					handleAssistantError(data);
					break;
				}
				default: {
					console.warn("[FoodChat] 처리되지 않은 이벤트", data);
				}
			}
		},
		[appendMessage, foodName, handleAssistantError]
	);

	const teardownSocket = useCallback(() => {
		if (wsRef.current) {
			wsRef.current.close();
			wsRef.current = null;
		}
		if (reconnectTimerRef.current) {
			clearTimeout(reconnectTimerRef.current);
			reconnectTimerRef.current = null;
		}
	}, []);

	const scheduleReconnect = useCallback(() => {
		if (!shouldReconnectRef.current) return;
		reconnectAttemptRef.current += 1;
		const delay = Math.min(
			3000,
			1000 * 2 ** Math.max(0, reconnectAttemptRef.current - 1)
		);
		reconnectTimerRef.current = setTimeout(() => {
			if (typeof connectSocketRef.current === "function") {
				connectSocketRef.current();
			}
		}, delay);
	}, []);

	const handleSocketClose = useCallback(
		(event) => {
			setConnectionStatus("disconnected");
			let closeReason =
				event?.code === 4401
					? "인증 정보가 만료됐어요. 다시 로그인해 주세요."
					: event?.code === 4400
					? "음식명이 전달되지 않아 연결이 종료됐어요."
					: null;

			if (closeReason) {
				appendMessage({
					role: "system",
					text: closeReason,
				});
			}

			if (event?.code >= 4000) {
				setAssistantTyping(false);
			}

			if (shouldReconnectRef.current && (!event || event.code !== 4401)) {
				scheduleReconnect();
			}
		},
		[appendMessage, scheduleReconnect]
	);

	const connectSocket = useCallback(() => {
		if (!foodName) {
			setConnectionStatus("error");
			appendMessage({
				role: "system",
				text: "음식명을 알 수 없어 채팅을 시작할 수 없어요.",
			});
			return;
		}

		try {
			const socket = new WebSocket(buildWsUrl(sessionIdRef.current));
			wsRef.current = socket;
			setConnectionStatus("connecting");

			socket.onopen = () => {
				setConnectionStatus("connected");
				reconnectAttemptRef.current = 0;
				setAssistantTyping(false);
			};

			socket.onmessage = handleMessage;
			socket.onerror = (event) => {
				console.error("[FoodChat] WebSocket 오류", event);
			};
			socket.onclose = handleSocketClose;
		} catch (error) {
			console.error("[FoodChat] WebSocket 연결 실패", error);
			setConnectionStatus("error");
			appendMessage({
				role: "system",
				text: "채팅 서버에 연결할 수 없어요. 네트워크 상태를 확인해 주세요.",
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [appendMessage, buildWsUrl, handleMessage, handleSocketClose, foodName]);

	useEffect(() => {
		connectSocketRef.current = connectSocket;
	}, [connectSocket]);

	useEffect(() => {
		if (!foodName) return undefined;
		shouldReconnectRef.current = true;
		connectSocket();
		return () => {
			shouldReconnectRef.current = false;
			teardownSocket();
		};
	}, [connectSocket, foodName, teardownSocket]);

	const isSocketOpen = () =>
		wsRef.current && wsRef.current.readyState === WebSocket.OPEN;

	const handleSend = () => {
		const trimmed = input.trim();
		if (!trimmed) {
			return;
		}

		if (!baselineGuidance) {
			appendMessage({
				role: "system",
				text: "기본 안전 정보를 불러오는 동안 잠시만 기다려 주세요.",
			});
			return;
		}

		if (!isSocketOpen()) {
			appendMessage({
				role: "system",
				text: "서버와의 연결이 끊어졌어요. 다시 연결 중입니다.",
			});
			if (connectionStatus === "disconnected") {
				connectSocket();
			}
			return;
		}

		if (sendLockRef.current) {
			return;
		}
		sendLockRef.current = true;

		try {
			const traceId = nanoId();
			const payload = {
				type: "user.message",
				message: trimmed,
				trace_id: traceId,
			};

			wsRef.current.send(JSON.stringify(payload));
			appendMessage({
				role: "user",
				text: trimmed,
				traceId,
			});

			setInput("");
		} finally {
			sendLockRef.current = false;
		}
	};

	const renderReferences = (message) => {
		if (
			!Array.isArray(message.references) &&
			!Array.isArray(message.snippets)
		) {
			return null;
		}

		const refs = message.references ?? [];
		const snippets = message.snippets ?? [];
		if (!refs.length && !snippets.length) {
			return null;
		}

		return (
			<div className="mt-2 space-y-2 rounded-xl border border-[#FFE4ED] bg-white px-3 py-2 text-xs text-subtext">
				{refs.length > 0 ? (
					<div>
						<p className="font-semibold text-[#FF6D92]">참고 자료</p>
						<ul className="mt-1 space-y-1">
							{refs.map((reference, idx) => (
								<li key={`ref-${message.id}-${idx}`}>
									<span className="font-medium text-[#1F1F21]">
										{reference.title ?? reference.source ?? "출처 미상"}
									</span>
									{reference.source ? (
										<span className="ml-1 text-[11px] text-subtext">
											({reference.source})
										</span>
									) : null}
									{reference.detail ? (
										<p className="text-[11px] text-subtext">{reference.detail}</p>
									) : null}
								</li>
							))}
						</ul>
					</div>
				) : null}
				{snippets.length > 0 ? (
					<div>
						<p className="font-semibold text-[#FF6D92]">근거 상세</p>
						<ul className="mt-1 space-y-1">
							{snippets.map((snippet, idx) => (
								<li key={`snippet-${message.id}-${idx}`}>
									<p className="text-[11px] leading-5 text-[#1F1F21]">
										{snippet.excerpt ?? ""}
									</p>
									<p className="text-[10px] text-subtext">
										{snippet.source}
										{typeof snippet.page !== "undefined" ? ` · ${snippet.page}p` : ""}
									</p>
								</li>
							))}
						</ul>
					</div>
				) : null}
			</div>
		);
	};

	const canSendMessage =
		connectionStatus === "connected" && Boolean(baselineGuidance);

	const renderBaselineCard = () => {
		if (!foodName || !baselineGuidance) {
			return null;
		}

		const safetyLabel =
			baselineGuidance.is_safe === true
				? "안전"
				: baselineGuidance.is_safe === false
				? "주의"
				: "정보 없음";
		const safetyBadgeClass =
			baselineGuidance.is_safe === true
				? "bg-[#ECFDF3] text-[#0F9D58] border-[#BAF4CF]"
				: baselineGuidance.is_safe === false
				? "bg-[#FFF4F7] text-[#FE7495] border-[#FFC4D6]"
				: "bg-[#F4F4F5] text-[#4B5563] border-[#E5E7EB]";

		return (
			<div className="rounded-2xl border border-[#FFE4ED] bg-[#FFF8FA] p-5 space-y-3">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-xs font-semibold text-[#FF6D92]">분석 음식</p>
						<p className="text-xl font-bold text-[#111827]">
							{foodName ?? DEFAULT_FOOD_NAME}
						</p>
					</div>
					<span
						className={`rounded-full border px-3 py-1 text-xs font-semibold ${safetyBadgeClass}`}
					>
						{safetyLabel}
					</span>
				</div>
				{baselineGuidance.safety_summary ? (
					<p className="text-sm leading-6 text-[#1F1F21] whitespace-pre-wrap">
						{baselineGuidance.safety_summary}
					</p>
				) : null}
				{baselineGuidance.nutritional_advice ? (
					<div className="rounded-xl bg-white/70 px-4 py-3 text-xs text-[#4B5563]">
						{baselineGuidance.nutritional_advice}
					</div>
				) : null}
			</div>
		);
	};

	return (
		<main className="flex min-h-screen flex-col bg-white">
			<header className="sticky top-0 z-10 flex items-center gap-3 border-b border-[#F4F4F5] bg-white px-4 py-3">
				<button
					type="button"
					onClick={() => navigate(-1)}
					className="rounded-full border border-[#ffe4ed] p-2 text-[#FF6D92]"
					aria-label="뒤로가기"
				>
					<ArrowLeft size={18} />
				</button>
				<div className="flex flex-col">
					<span className="text-sm font-semibold text-[#FF6D92]">
						실시간 임산부 Q&A
					</span>
					<span className="text-xs text-subtext">
						{foodName ?? DEFAULT_FOOD_NAME} 관련 궁금증을 질문해보세요
					</span>
				</div>
				<div className="ml-auto text-right text-[11px] font-medium">
					<span
						className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
							connectionStatus === "connected"
								? "bg-[#ECFDF3] text-[#0F9D58]"
								: connectionStatus === "connecting"
								? "bg-[#FFF4F7] text-[#FE7495]"
								: "bg-[#FEF3C7] text-[#92400E]"
						}`}
					>
						{connectionStatus === "connected" ? (
							<>
								<span className="h-2 w-2 rounded-full bg-[#0F9D58]" />
								연결됨
							</>
						) : connectionStatus === "connecting" ? (
							<>
								<Loader2 className="h-3 w-3 animate-spin" />
								연결 중
							</>
						) : (
							<>
								<WifiOff className="h-3 w-3" />
								오프라인
							</>
						)}
					</span>
				</div>
			</header>

			<section className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
				{renderBaselineCard()}

				<div className="space-y-4">
					{messages.map((msg) => (
						<div
							key={msg.id}
							className={`flex ${
								msg.role === "user"
									? "justify-end"
									: msg.role === "system"
									? "justify-center"
									: "justify-start"
							}`}
						>
							<div
								className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${
									msg.role === "user"
										? "rounded-br-sm bg-[linear-gradient(90deg,#FF8AB0_0%,#FF7392_100%)] text-white shadow-[0_10px_20px_rgba(255,132,164,0.35)]"
										: msg.role === "system"
										? "bg-[#FFF4F7] text-[#B45309] border border-[#FFE4ED]"
										: "rounded-bl-sm border border-[#FFE4ED] bg-white text-[#1F1F21]"
								}`}
							>
								{msg.text}
								{msg.role === "assistant" ? renderReferences(msg) : null}
							</div>
						</div>
					))}
					{assistantTyping ? (
						<div className="flex justify-start">
							<div className="flex items-center gap-2 rounded-2xl border border-[#FFE4ED] bg-white px-4 py-3 text-sm text-[#4B5563]">
								<Loader2 className="h-3.5 w-3.5 animate-spin text-[#FE7495]" />
								답변을 작성 중이에요...
							</div>
						</div>
					) : null}
					<div ref={scrollAnchorRef} />
					</div>
			</section>

			<footer className="sticky bottom-0 border-t border-[#F4F4F5] bg-white px-4 py-4">
				<div className="rounded-2xl border border-[#FFE4ED] bg-[#FFF8FA] p-4">
					<div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#FF6D92]">
						<Sparkles size={16} /> 궁금한 점을 입력해주세요
					</div>
					<div className="flex items-center gap-2">
						<input
							type="text"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.isComposing && !e.repeat) {
									e.preventDefault();
									handleSend();
								}
							}}
							className={`flex-1 rounded-xl border border-transparent px-3 py-2 text-sm text-[#1F1F21] outline-none ${
								canSendMessage ? "bg-white" : "bg-gray-100"
							}`}
							placeholder="예) 김밥 속 가공육이 걱정돼요"
						/>
						<button
							type="button"
							onClick={handleSend}
							disabled={!canSendMessage || !input.trim()}
							className={`flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(255,132,164,0.4)] ${
								!canSendMessage || !input.trim()
									? "cursor-not-allowed bg-[#FFBFD1]"
									: "bg-[linear-gradient(90deg,#FF8AB0_0%,#FF7392_100%)]"
							}`}
						>
							보내기
							<Send size={16} />
						</button>
					</div>
					{!canSendMessage ? (
						<div className="mt-2 flex items-center gap-1 text-xs text-subtext">
							<AlertTriangle size={12} className="text-[#FE7495]" />
							<span>기본 안전 정보를 불러온 뒤 질문을 보낼 수 있어요.</span>
						</div>
					) : null}
				</div>
			</footer>
		</main>
	);
}

