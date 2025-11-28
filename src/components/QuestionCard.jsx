import React from "react";
import ChatImage from "../assets/chatting_bubble.svg"

export const info = {
	"1": {
		time: "12분",
		title: "임신 중 감기약 복용 괜찮을까요?",
		description: "기침이 일주일째라 약을 먹어야 할지 고민이에요. 산부인과 처방이 필요한지...",
		comments: 23,
		body: "임신 18주차인데 감기 증상이 오래가고 있어요. 코막힘과 기침이 심해서 잠도 잘 못자네요. 임산부도 복용 가능한 감기약이 있는지, 병원 처방이 필요한지 궁금합니다. 혹시 집에서 할 수 있는 관리 팁도 알려주세요.",
		answers: [
			{
				author: "소담맘",
				time: "5분 전",
				content: "임산부는 임의로 일반 감기약을 복용하기보다는 산부인과나 내과에서 임산부용으로 처방받는 걸 추천드려요. 증상이 심하면 병원 방문하세요. 수분 섭취와 가습도 도움이 됩니다.",
				likes: 12
			},
			{
				author: "튼튼이아빠",
				time: "방금",
				content: "저희 아내는 병원에서 아세트아미노펜 성분으로 처방받았어요. 임산부 금기 성분만 피하면 괜찮다고 하시더라고요.",
				likes: 4
			}
		]
	},
	"2": {
		time: "2시간",
		title: "철분제는 언제 먹는 게 좋아요?",
		description: "공복에 먹으니 속이 좀 안 좋아요. 식후로 바꿔도 흡수에 문제 없을까요?",
		comments: 12,
		body: "최근 빈혈 판정으로 철분제를 시작했는데 공복 복용이 속이 너무 불편해요. 식후로 먹어도 흡수에 크게 문제 없을까요? 우유나 커피와 같이 먹으면 안 된다고 들었어요.",
		answers: [
			{
				author: "하늘별",
				time: "1시간 전",
				content: "빈 속에서 불편하면 가벼운 식사 후에 드셔도 괜찮아요. 다만 유제품/커피와 함께는 피하세요. 비타민C와 같이 먹으면 흡수에 도움돼요.",
				likes: 9
			}
		]
	},
	"3": {
		time: "어제",
		title: "속쓰림 심할 때 대처법 있을까요?",
		description: "저녁만 먹으면 속이 타는 느낌이 들어요. 음식 추천이나 생활 팁 부탁드려요.",
		comments: 41,
		body: "임신 후반부로 갈수록 위산 역류 때문인지 속쓰림이 심해졌어요. 저녁 식사 후 증상이 특히 심한데, 식단 조절이나 수면 자세 등 도움이 될 만한 팁이 있을까요?",
		answers: [
			{
				author: "보리수",
				time: "16시간 전",
				content: "취침 2~3시간 전에는 식사 피하시고, 침대 상체를 조금 높여서 주무시면 좋아요. 자극적인 음식과 카페인은 줄여보세요.",
				likes: 21
			}
		]
	}
}
export default function QuestionCard({contentId, setContentId, setDetail}) {
	let content = info[contentId];
	
	return <article onClick={() => {setContentId(contentId); setDetail(true)}} className="flex flex-col items-start px-4 py-3 gap-1 bg-box rounded-2xl">
		<section className="flex gap-1 items-end">
			<h1 className="font-semibold text-base">{content.title}</h1>
			<div className="text-subtext text-sm">{content.time}전</div>
		</section>
		<section className="flex justify-between gap-2 items-end">
			<p className="text-subtext text-sm ">
				{content.description}
			</p>
			<div className="flex gap-1 items-center justify-end">
				<img src={ChatImage}/>
				{content.comments}
			</div>
		</section>
	</article>
}