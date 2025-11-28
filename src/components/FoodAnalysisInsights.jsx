import React, { useEffect, useState } from "react";
import {
	PieChart as PieChartIcon,
	BarChart as BarChartIcon,
	LineChart as LineChartIcon,
	ShieldCheck,
	ShieldAlert,
	Info,
} from "lucide-react";
import {
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	Legend,
	Tooltip,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	LineChart,
	Line,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export function FoodRecommendationChart({ foodName, userWeek }) {
	const [data, setData] = useState([]);
	const [animationActive, setAnimationActive] = useState(false);
	const [chartType, setChartType] = useState("pie");

	useEffect(() => {
		const simulatedData = [
			{ name: "1-12주", value: Math.random() * 100 },
			{ name: "13-24주", value: Math.random() * 100 },
			{ name: "25-36주", value: Math.random() * 100 },
			{ name: "37주 이상", value: Math.random() * 100 },
		];
		setData(simulatedData);
		setAnimationActive(true);
	}, [foodName]);

	const getUserWeekRecommendation = () => {
		if (userWeek <= 12) return data[0]?.value?.toFixed?.(1);
		if (userWeek <= 24) return data[1]?.value?.toFixed?.(1);
		if (userWeek <= 36) return data[2]?.value?.toFixed?.(1);
		return data[3]?.value?.toFixed?.(1);
	};

	const renderChart = () => {
		switch (chartType) {
			case "pie":
				return (
					<PieChart>
						<Pie
							data={data}
							cx="50%"
							cy="50%"
							labelLine={false}
							outerRadius={80}
							fill="#8884d8"
							dataKey="value"
							isAnimationActive={animationActive}
							animationBegin={0}
							animationDuration={1500}
							label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
						>
							{data.map((entry, index) => (
								<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
							))}
						</Pie>
						<Tooltip />
						<Legend />
					</PieChart>
				);
			case "bar":
				return (
					<BarChart data={data}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="name" />
						<YAxis />
						<Tooltip />
						<Legend />
						<Bar dataKey="value" fill="#8884d8" />
					</BarChart>
				);
			case "line":
				return (
					<LineChart data={data}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="name" />
						<YAxis />
						<Tooltip />
						<Legend />
						<Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
					</LineChart>
				);
			default:
				return null;
		}
	};

	return (
		<div className="mt-8 pb-10">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-semibold">임신 주차별 {foodName} 추천 비율</h3>
					<p className="text-sm text-text/80">
						현재 임신 <span className="font-semibold text-text">{userWeek}주차</span>의 추천 비율:{" "}
						<span className="font-semibold text-text">{getUserWeekRecommendation() ?? "-"}%</span>
					</p>
				</div>
				<div className="flex gap-2">
					<button
						onClick={() => setChartType("pie")}
						className={`rounded-lg p-2 text-white ${chartType === "pie" ? "bg-primary" : "bg-gray-400"}`}
					>
						<PieChartIcon size={16} />
					</button>
					<button
						onClick={() => setChartType("bar")}
						className={`rounded-lg p-2 text-white ${chartType === "bar" ? "bg-primary" : "bg-gray-400"}`}
					>
						<BarChartIcon size={16} />
					</button>
					<button
						onClick={() => setChartType("line")}
						className={`rounded-lg p-2 text-white ${chartType === "line" ? "bg-primary" : "bg-gray-400"}`}
					>
						<LineChartIcon size={16} />
					</button>
				</div>
			</div>
			<div className="mt-4 h-[300px] w-full">
				<ResponsiveContainer width="100%" height="100%">
					{renderChart()}
				</ResponsiveContainer>
			</div>
		</div>
	);
}

export function SafetyBadge({ isSafe }) {
	if (isSafe === true || isSafe === "추천" || isSafe === "안전") {
		return (
			<div className="flex items-center gap-1 text-green-600 text-sm">
				<ShieldCheck size={18} /> 섭취 가능
			</div>
		);
	}
	if (isSafe === false || isSafe === "주의" || isSafe === "위험" || isSafe === "금지") {
		return (
			<div className="flex items-center gap-1 text-red-600 text-sm">
				<ShieldAlert size={18} /> 섭취 주의
			</div>
		);
	}
	return (
		<div className="flex items-center gap-1 text-gray-600 text-sm">
			<Info size={18} /> 정보 없음
		</div>
	);
}

export function Section({ title, children }) {
	return (
		<section className="mt-6 rounded-2xl bg-white p-4 shadow-[0_20px_45px_rgba(15,23,42,0.08)]">
			<h4 className="text-base font-semibold mb-2 text-text">{title}</h4>
			<div className="text-sm leading-6 text-text/90">{children}</div>
		</section>
	);
}

