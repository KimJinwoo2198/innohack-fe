export const extractTextFromAny = (input) => {
	if (input == null) return "";
	if (typeof input === "string") return input;
	if (typeof input === "number" || typeof input === "boolean") return String(input);
	if (Array.isArray(input)) {
		return input.map(extractTextFromAny).filter(Boolean).join("\n");
	}
	if (typeof input === "object") {
		if (typeof input.answer === "string") return input.answer;
		if (typeof input.content === "string") return input.content;
		return Object.values(input).map(extractTextFromAny).filter(Boolean).join("\n");
	}
	return "";
};

export const normalizeIsSafe = (input) => {
	if (input == null) return undefined;
	if (typeof input === "boolean") return input;
	if (typeof input === "number") return input !== 0;
	if (Array.isArray(input)) {
		for (const item of input) {
			const value = normalizeIsSafe(item);
			if (typeof value === "boolean") {
				return value;
			}
		}
		return undefined;
	}
	if (typeof input === "object") {
		if (Object.prototype.hasOwnProperty.call(input, "is_safe")) {
			return normalizeIsSafe(input.is_safe);
		}
		if (Object.prototype.hasOwnProperty.call(input, "answer")) {
			return normalizeIsSafe(input.answer);
		}

		const text = Object.values(input)
			.map((value) => (typeof value === "string" ? value : ""))
			.join(" ")
			.toLowerCase();

		if (text) {
			const hasNegative = /(주의|위험|금지|피해|피하|불가|금물|나쁨|해로움|avoid|unsafe|not\s+recommended|no)/.test(text);
			const hasPositive = /(안전|추천|가능|괜찮|권장|safe|ok|okay|yes|recommended)/.test(text);
			if (hasNegative && !hasPositive) return false;
			if (hasPositive && !hasNegative) return true;
		}
		return undefined;
	}
	if (typeof input === "string") {
		const normalized = input.toLowerCase().trim();
		if (["true", "1", "yes", "y", "추천", "안전", "safe", "ok", "okay", "가능", "괜찮음", "권장"].includes(normalized)) {
			return true;
		}
		if (
			[
				"false",
				"0",
				"no",
				"n",
				"주의",
				"위험",
				"금지",
				"불가",
				"unsafe",
				"avoid",
				"피함",
				"불가능",
				"금물",
				"not recommended",
			].includes(normalized)
		) {
			return false;
		}
		const hasNegative = /(주의|위험|금지|피해|피하|불가|금물|나쁨|해로움|avoid|unsafe|not\s+recommended|no)/.test(normalized);
		const hasPositive = /(안전|추천|가능|괜찮|권장|safe|ok|okay|yes|recommended)/.test(normalized);
		if (hasNegative && !hasPositive) return false;
		if (hasPositive && !hasNegative) return true;
		return undefined;
	}
	return undefined;
};

export const buildNutritionText = (result) => {
	if (!result) return "";
	const direct = result?.nutritional_advice?.answer ?? result?.nutritional_advice;
	if (direct) return extractTextFromAny(direct);
	const { food_name, safety_info, is_safe, ...rest } = result || {};
	return extractTextFromAny(rest);
};

export const determineIsSafeFromResult = (result) => {
	if (!result) return undefined;
	const candidates = [
		result?.safety_info?.is_safe,
		result?.safety?.is_safe,
		result?.is_safe,
		result?.safety_info?.answer,
		result?.safety?.answer,
		result?.safety_info,
		result?.safety,
	];
	for (const candidate of candidates) {
		const normalized = normalizeIsSafe(candidate);
		if (typeof normalized === "boolean") return normalized;
	}
	return undefined;
};

