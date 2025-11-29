import React from "react";
import { useNavigate } from "react-router-dom";

const CTA_BUTTON_LABEL = "질문하기";

export default function QuestionCTA({ foodName, dialectStyle = "standard" }) {
	const navigate = useNavigate();

	const handleClick = () => {
		navigate("/questions/chat", {
			state: {
				foodName,
				dialectStyle,
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
				className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-[linear-gradient(90deg,#FF8AB0_0%,#FF80A1_45%,#FF7392_100%)] px-5 text-base font-semibold text-white shadow-[0_20px_35px_rgba(255,132,164,0.4)] transition hover:brightness-105"
			>
				<span>{CTA_BUTTON_LABEL}</span>
			</button>
		</section>
	);
}
