import React, { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, HelpCircle, Sparkles, BarChart3 } from "lucide-react";

import Footer from "../components/Footer";
import DefaultFoodImage from "../assets/photo.svg";
import { buildNutritionText, determineIsSafeFromResult } from "../utils/foodResultUtils";
import QuestionCTA from "../components/QuestionCTA";

const safetyColors = {
	warning: {
		bg: "bg-[#FFF4F7]",
		text: "text-[#FE7495]",
		border: "border-[#FFC4D6]",
		iconColor: "#FE7495",
		label: "주의",
		icon: AlertTriangle,
		description: "섭취 전 한 번 더 확인해 주세요.",
	},
	safe: {
		bg: "bg-[#ECFDF3]",
		text: "text-[#0F9D58]",
		border: "border-[#BAF4CF]",
		iconColor: "#0F9D58",
		label: "안전",
		icon: CheckCircle2,
		description: "일반적인 섭취가 권장돼요.",
	},
	unknown: {
		bg: "bg-[#F4F4F5]",
		text: "text-[#4B5563]",
		border: "border-[#E5E7EB]",
		iconColor: "#4B5563",
		label: "정보 없음",
		icon: HelpCircle,
		description: "추가 정보가 필요해요.",
	},
};

export default function ExploreResult() {
	const location = useLocation();
	const navigate = useNavigate();
	const result = location.state?.result;
	const capturedImage = location.state?.imageSrc;

	useEffect(() => {
		if (!result) {
			navigate("/explore", { replace: true });
		}
	}, [navigate, result]);

	const analysis = useMemo(() => {
		if (!result) return null;
		const foodName = result?.food_name ?? "인식된 음식";
		const description = buildNutritionText(result) || "해당 음식에 대한 자세한 정보를 불러오지 못했어요.";
		const cautionPercent = Number(result?.pregnancy_stats?.caution_percent ?? 0.64);
		const cautionLabel =
			result?.pregnancy_stats?.label ?? `비슷한 주수에서 약 ${(cautionPercent * 100).toFixed(0)}%가 ${foodName}을 ‘주의’로 선택했어요.`;
		const isSafeFromSafety = determineIsSafeFromResult(result);
		const safetyKey = isSafeFromSafety === false ? "warning" : isSafeFromSafety === true ? "safe" : "unknown";
		const config = safetyColors[safetyKey];

		return {
			foodName,
			description,
			image: capturedImage ?? result?.image_url ?? result?.food_image ?? DefaultFoodImage,
			cautionPercent: Math.min(Math.max(cautionPercent, 0), 1),
			cautionLabel,
			config,
		};
	}, [capturedImage, result]);

	if (!analysis) {
		return null;
	}

	const { foodName, description, image, cautionPercent, cautionLabel, config } = analysis;
	const StatusIcon = config.icon;

	return (
		<main className="min-h-screen bg-white px-6 pt-10 pb-40 space-y-8">
			<div>
				<div className="flex items-center gap-3">
					<h1 className="text-[28px] font-bold tracking-tight text-[#111827]">{foodName}</h1>
					<span className={`flex items-center gap-2 rounded-full border px-4 py-1 text-sm font-semibold ${config.bg} ${config.text} ${config.border}`}>
						<StatusIcon size={16} color={config.iconColor} />
						{config.label}
					</span>
				</div>
				<p className="mt-1 text-sm text-subtext">{config.description}</p>
			</div>

			<img src={image} alt={foodName} className="mx-auto h-40 w-40 object-contain drop-shadow-lg" />

			<div className="rounded-2xl border border-[#FFD4E2] bg-[#FFF6FA] p-5">
				<div className="flex items-center gap-2 text-[#FE7495]">
					<Sparkles size={18} />
					<p className="text-sm font-semibold">결과 설명</p>
				</div>
				<p className="mt-3 text-sm leading-6 text-[#1F1F21] whitespace-pre-wrap">{description}</p>
			</div>

			<div className="rounded-2xl border border-[#FFD4E2] bg-[#FFFAFC] p-5">
				<div className="flex items-center gap-2 text-[#FE7495]">
					<BarChart3 size={18} />
					<p className="text-sm font-semibold">임산부 통계</p>
				</div>
				<p className="mt-2 text-sm text-[#1F1F21]/80">{cautionLabel}</p>
				<div className="mt-4">
					<div className="flex items-center justify-between text-xs font-semibold text-subtext">
						<span>주의 비율</span>
						<span className="text-[#FE7495]">{Math.round(cautionPercent * 100)}%</span>
					</div>
					<div className="mt-2 h-3 rounded-full bg-[#FFE3EE]">
						<div className="h-full rounded-full bg-[#FE7495]" style={{ width: `${Math.round(cautionPercent * 100)}%` }} />
					</div>
				</div>
			</div>

			<QuestionCTA foodName={foodName} />

			<Footer />
		</main>
	);
}

