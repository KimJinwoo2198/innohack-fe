import React from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DEFAULT_QUESTION = "팥 대신 슈크림 붕어빵은 더 위험한가요?";

export default function QuestionCTA() {
	const navigate = useNavigate();

	const handleClick = () => {
		navigate("/questions/chat", {
			state: {
				initialQuestion: DEFAULT_QUESTION,
			},
		});
	};

	return (
		<section className="rounded-[32px] border border-[#FFE4ED] bg-white p-6 shadow-[0_20px_45px_rgba(254,117,155,0.15)]">
			<div className="text-center text-[#FF6D92]">
				<p className="text-lg font-semibold">더 알고 싶은 부분이 있다면</p>
				<p className="text-lg font-semibold">편하게 질문해보세요</p>
			</div>
			<button
				type="button"
				onClick={handleClick}
				className="mt-6 flex h-14 w-full items-center justify-between rounded-2xl bg-[linear-gradient(90deg,#FF8AB0_0%,#FF80A1_45%,#FF7392_100%)] px-5 text-left text-sm font-semibold text-white shadow-[0_20px_35px_rgba(255,132,164,0.4)] transition hover:brightness-105"
			>
				<span>{DEFAULT_QUESTION}</span>
				<ArrowRight size={20} />
			</button>
		</section>
	);
}
