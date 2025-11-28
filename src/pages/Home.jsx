import { useBlocker } from "react-router-dom";

import Footer from "../components/Footer";
import Card from "../components/Card";
import Kid from "../assets/kid.svg";
import ArrowRight from "../assets/arrow_right.svg";
import ChattingBubble from "../assets/chatting_bubble.svg";

export default function Home() {
	// useBlocker(({ currentLocation, nextLocation }) => currentLocation.pathname !== nextLocation.pathname);

	// realistic sample data
	const today = new Date();
	const dueDate = new Date(today.getFullYear(), today.getMonth() + 5, 10);
	const dDay = Math.max(0, Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
	const nameProgress = 70; // % 진행도

	const questions = [
		{
			title: "임신 중 감기약 복용 괜찮을까요?",
			excerpt: "기침이 일주일째라 약을 먹어야 할지 고민이에요. 산부인과 처방이 필요한지...",
			comments: 23,
			time: "10분 전",
		},
		{
			title: "철분제는 언제 먹는 게 좋아요?",
			excerpt: "공복에 먹으니 속이 좀 안 좋아요. 식후로 바꿔도 흡수에 문제 없을까요?",
			comments: 12,
			time: "2시간 전",
		},
		{
			title: "속쓰림 심할 때 대처법 있을까요?",
			excerpt: "저녁만 먹으면 속이 타는 느낌이 드네요. 음식 추천이나 생활 팁 부탁드려요.",
			comments: 41,
			time: "어제",
		},
	];

	const meals = [
		{ type: "아침", items: ["플레인 요거트", "오트밀", "블루베리", "호두"] },
		{ type: "점심", items: ["현미밥", "연어 샐러드", "시금치나물", "두부조림"] },
		{ type: "저녁", items: ["닭가슴살 채소볶음", "고구마", "그릭요거트"] },
	];

	return (
		<main className="flex flex-col mx-5 mt-8 mb-28 gap-6">
			<header className="flex items-center justify-between">
				<h1 className="text-2xl font-bold tracking-tight">안녕하세요</h1>
				<span className="text-sm text-subtext">오늘도 건강한 하루</span>
			</header>
			<div className="flex flex-col gap-6">
				<Card className="flex flex-col gap-3">
					<div className="flex w-full items-center justify-between">
						<div className="flex gap-3 items-center w-full">
							<img src={Kid} alt="아이 이모지" />
							<div className="flex flex-col">
								<span className="text-xs text-subtext">출산까지</span>
								<span className="text-primary font-bold text-lg">D - {dDay}</span>
							</div>
						</div>
						<img src={ArrowRight} alt="오른쪽 화살표" />
					</div>
					<div className="flex items-center gap-2">
						<span className="text-xs text-subtext">이름 결정 진행도</span>
						<div className="relative flex-grow h-2 bg-gray-200 rounded">
							<div className="absolute top-0 left-0 h-full bg-primary rounded" style={{ width: `${nameProgress}%` }}></div>
						</div>
						<span className="text-xs text-subtext">{nameProgress}%</span>
					</div>
				</Card>

				<section className="flex flex-col gap-3">
					<div className="flex justify-between items-center">
						<h2 className="text-xl font-semibold">질문답변</h2>
						<button className="text-subtext text-sm">더보기</button>
					</div>

					<div className="flex flex-col gap-3">
						{questions.map((q, idx) => (
							<Card key={idx}>
								<span className="font-semibold">{q.title}</span>
								<div className="flex justify-between w-full text-sm items-center">
									<span className="text-subtext truncate max-w-[70%]">{q.excerpt}</span>
									<div className="flex gap-2 items-center">
										<span className="text-subtext">{q.time}</span>
										<div className="flex gap-1 items-center">
											<img src={ChattingBubble} alt="채팅 버블 이모지" />
											<span>{q.comments}</span>
										</div>
									</div>
								</div>
							</Card>
						))}
					</div>
				</section>

				<section className="flex flex-col gap-3">
					<h2 className="text-xl font-semibold">추천 식단</h2>
					<div className="flex overflow-x-auto gap-3 pb-1">
						{meals.map((meal, idx) => (
							<Card key={idx} className="min-w-36">
								<span className="font-medium">{meal.type}</span>
								<ul className="text-sm text-text/80 list-disc list-inside">
									{meal.items.map((item, i) => (
										<li key={i}>{item}</li>
									))}
								</ul>
							</Card>
						))}
					</div>
				</section>
			</div>

			<Footer />
		</main>
	);
}