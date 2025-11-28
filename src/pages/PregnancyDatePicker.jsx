import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import pregnantWoman from "../assets/pregnant_woman.svg";

const WEEK_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const getMondayBasedWeekday = (jsDayIndex) => (jsDayIndex + 6) % 7;

const buildCalendarMatrix = (anchorDate) => {
	const year = anchorDate.getFullYear();
	const month = anchorDate.getMonth();

	const firstDayOfMonth = new Date(year, month, 1);
	const firstCalendarOffset = getMondayBasedWeekday(firstDayOfMonth.getDay());

	const firstCalendarDate = new Date(firstDayOfMonth);
	firstCalendarDate.setDate(firstDayOfMonth.getDate() - firstCalendarOffset);

	const matrix = [];

	for (let week = 0; week < 6; week += 1) {
		const weekRow = [];

		for (let day = 0; day < 7; day += 1) {
			const cursor = new Date(firstCalendarDate);
			cursor.setDate(firstCalendarDate.getDate() + week * 7 + day);

			weekRow.push({
				date: cursor,
				isCurrentMonth: cursor.getMonth() === month,
			});
		}

		matrix.push(weekRow);
	}

	return matrix;
};

const isSameDate = (left, right) =>
	left &&
	right &&
	left.getFullYear() === right.getFullYear() &&
	left.getMonth() === right.getMonth() &&
	left.getDate() === right.getDate();

const formatMonthLabel = (date) => `${date.getFullYear()}.${date.getMonth() + 1}`;

const ArrowLeftIcon = ({ className = "" }) => (
	<svg
		viewBox="0 0 16 16"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		className={className}
		aria-hidden="true"
		focusable="false"
	>
		<path
			d="M10 3.5 6 8l4 4.5"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

const ArrowRightIcon = ({ className = "" }) => (
	<svg
		viewBox="0 0 16 16"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		className={className}
		aria-hidden="true"
		focusable="false"
	>
		<path
			d="M6 3.5 10 8 6 12.5"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

const DividerLine = ({ className = "" }) => (
	<span className={`${className} block bg-[#E5E7EB]`} role="presentation" aria-hidden="true" />
);

const CalendarDay = ({ cell, selectedDate, onSelect }) => {
	const { date, isCurrentMonth } = cell;
	const isSelected = isCurrentMonth && isSameDate(date, selectedDate);
	const isFirstOfMonth = isCurrentMonth && date.getDate() === 1;

	const wrapperClass = `relative h-6 w-6${isFirstOfMonth ? " overflow-hidden rounded-[40px]" : ""}${
		isSelected ? " rounded-2xl bg-[#FE759B]" : ""
	}`;

	const textClass = isSelected
		? "[font-family:'Sofia_Sans_Semi_Condensed-Medium',Helvetica] text-white"
		: "[font-family:'SF_Pro_Display-Medium',Helvetica] " +
		  (isCurrentMonth ? "text-[#141414]" : "text-transparent");

	return (
		<div className={wrapperClass} role="gridcell">
			<button
				type="button"
				disabled={!isCurrentMonth}
				onClick={() => isCurrentMonth && onSelect(date)}
				className={`${textClass} absolute inset-0 flex items-center justify-center text-sm font-medium leading-[normal]`}
				aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일`}
				aria-current={isSelected ? "date" : undefined}
			>
				{date.getDate()}
			</button>
		</div>
	);
};

const CalendarGrid = ({ calendar, selectedDate, onSelectDate }) => (
	<div className="mt-4 flex w-full flex-col gap-4" role="grid" aria-label="Calendar days">
		{calendar.map((week, weekIndex) => (
			<div
				key={`week-${weekIndex}`}
				className="flex w-full items-center justify-between"
				role="row"
			>
				{week.map((cell) => (
					<CalendarDay
						key={cell.date.toISOString()}
						cell={cell}
						selectedDate={selectedDate}
						onSelect={onSelectDate}
					/>
				))}
			</div>
		))}
	</div>
);

const PregnancyDatePicker = () => {
	const navigate = useNavigate();
	const [anchorDate, setAnchorDate] = useState(() => {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), 1);
	});
	const [selectedDate, setSelectedDate] = useState(null);

	const calendarMatrix = useMemo(
		() => buildCalendarMatrix(anchorDate),
		[anchorDate]
	);

	const goPrevMonth = () =>
		setAnchorDate(
			(prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
		);
	const goNextMonth = () =>
		setAnchorDate(
			(prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
		);

	const handleSelectDate = (candidate) =>
		setSelectedDate(
			new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate())
		);

	const isDisabled = !selectedDate;
	const ctaLabel = selectedDate ? "다음" : "날짜를 선택해주세요";

	return (
		<div className="flex min-h-screen justify-center bg-white px-4 py-20">
			<div className="w-full max-w-[360px] space-y-12">
				<div className="flex items-center justify-center gap-2">
					<img
						className="h-24 w-16 shrink-0 object-contain"
						alt="임신한 여성 이모지"
						src={pregnantWoman}
					/>
					<div className="text-left">
						<p className="text-[24px] font-bold leading-[34px] tracking-[-1.2px] text-black">
							안녕하세요 김민교님,
						</p>
						<p className="text-[24px] font-bold leading-[34px] tracking-[-1.2px] text-black">
							임신 진단일을 알려주세요!
						</p>
					</div>
				</div>

				<p className="text-center text-[15px] font-semibold leading-[28px] tracking-[-0.4px] text-black">
					선택하신 날짜로 오늘의 임신 주차를 정확히 계산해드릴게요.
				</p>

				<section className="rounded-2xl bg-white px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
					<div className="flex items-center justify-between">
						<button type="button" aria-label="Previous month" onClick={goPrevMonth}>
							<ArrowLeftIcon className="h-4 w-4" />
						</button>
						<h2 className="text-center text-sm font-semibold tracking-[0.14px] text-black">
							{formatMonthLabel(anchorDate)}
						</h2>
						<button type="button" aria-label="Next month" onClick={goNextMonth}>
							<ArrowRightIcon className="h-4 w-4" />
						</button>
					</div>

					<DividerLine className="mt-[19px] h-px w-full" />

					<div className="mt-4 flex items-start justify-between" role="row">
						{WEEK_DAYS.map((day) => (
							<div key={day} className="flex w-8 items-start gap-2.5 p-1" role="columnheader">
								<div className="flex-1 text-center text-[10px] font-medium leading-none text-[#5B5B5B]">
									{day}
								</div>
							</div>
						))}
					</div>

					<CalendarGrid
						calendar={calendarMatrix}
						selectedDate={selectedDate}
						onSelectDate={handleSelectDate}
					/>
				</section>

				<button
					type="button"
					disabled={isDisabled}
					onClick={() => !isDisabled && navigate("/home")}
					className={`flex w-full items-center justify-center gap-2.5 rounded-[14px] px-6 py-3 text-[17px] font-bold leading-[22px] text-white transition ${
						isDisabled
							? "cursor-not-allowed bg-[linear-gradient(90deg,rgba(254,118,161,0.5)_0%,rgba(255,107,107,0.5)_100%)]"
							: "bg-[linear-gradient(90deg,#FE76A1_0%,#FF6B6B_100%)] shadow-[0_10px_25px_rgba(254,117,155,0.35)]"
					}`}
				>
					{ctaLabel}
				</button>
			</div>
		</div>
	);
};

export default PregnancyDatePicker;
