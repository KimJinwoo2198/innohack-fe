import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Sparkles } from "lucide-react";

export default function QuestionChat() {
	const location = useLocation();
	const navigate = useNavigate();
	const initialQuestion = location.state?.initialQuestion ?? "팥 대신 슈크림 붕어빵은 더 위험한가요?";

	const [messages, setMessages] = useState(() => [
		{
			id: "assistant-intro",
			role: "assistant",
			text: "안녕하세요! 궁금하신 내용을 편하게 물어보세요. 식재료의 안전성과 섭취 팁을 알려드릴게요.",
		},
		{ id: "user-initial", role: "user", text: initialQuestion },
		{
			id: "assistant-initial",
			role: "assistant",
			text: "슈크림 붕어빵은 당분과 지방이 높은 편이라 혈당이 빠르게 올라갈 수 있어요. 임신성 당뇨나 위장 트러블이 있다면 작은 양으로 맛만 보시는 걸 추천드려요.",
		},
	]);
	const [input, setInput] = useState("");

	const handleSend = () => {
		const trimmed = input.trim();
		if (!trimmed) return;
		setMessages((prev) => [
			...prev,
			{ id: `user-${Date.now()}`, role: "user", text: trimmed },
			{
				id: `assistant-${Date.now()}`,
				role: "assistant",
				text: "이 부분에 대해서는 아직 모델이 학습 중이에요. 추후 더 정확한 답변을 준비할게요!",
			},
		]);
		setInput("");
	};

	const groupedMessages = useMemo(() => messages, [messages]);

	return (
		<main className="flex min-h-screen flex-col bg-white">
			<header className="sticky top-0 flex items-center gap-3 border-b border-[#F4F4F5] bg-white px-4 py-3">
				<button
					type="button"
					onClick={() => navigate(-1)}
					className="rounded-full border border-[#ffe4ed] p-2 text-[#FF6D92]"
					aria-label="뒤로가기"
				>
					<ArrowLeft size={18} />
				</button>
				<div>
					<p className="text-sm font-semibold text-[#FF6D92]">AI Q&A</p>
					<p className="text-xs text-subtext">영양사에게 묻듯이 편하게 질문해보세요</p>
				</div>
			</header>

			<section className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
				{groupedMessages.map((msg) => (
					<div
						key={msg.id}
						className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
					>
						<div
							className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-6 ${
								msg.role === "user"
									? "rounded-br-sm bg-[linear-gradient(90deg,#FF8AB0_0%,#FF7392_100%)] text-white shadow-[0_10px_20px_rgba(255,132,164,0.35)]"
									: "rounded-bl-sm border border-[#FFE4ED] bg-white text-[#1F1F21]"
							}`}
						>
							{msg.text}
						</div>
					</div>
				))}
			</section>

			<footer className="sticky bottom-0 border-t border-[#F4F4F5] bg-white px-4 py-4">
				<div className="rounded-2xl border border-[#FFE4ED] bg-[#FFF8FA] p-4">
					<div className="mb-3 flex items-center gap-2 text-[#FF6D92] text-sm font-semibold">
						<Sparkles size={16} /> 궁금한 점을 입력해주세요
					</div>
					<div className="flex items-center gap-2">
						<input
							type="text"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							className="flex-1 rounded-xl border border-transparent bg-white px-3 py-2 text-sm text-[#1F1F21]"
							placeholder="예) 붕어빵을 먹을 때 조심할 점이 있을까요?"
						/>
						<button
							type="button"
							onClick={handleSend}
							className="flex items-center gap-1 rounded-xl bg-[linear-gradient(90deg,#FF8AB0_0%,#FF7392_100%)] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(255,132,164,0.4)]"
						>
							보내기
							<Send size={16} />
						</button>
					</div>
				</div>
			</footer>
		</main>
	);
}

