import React from "react";
import { Link, useLocation } from "react-router-dom";
import { BookCheck, Camera, HouseHeart } from "lucide-react";

export default function Footer() {
	const isIos = navigator.userAgent.includes("iPhone");
	const location = useLocation();

	const items = [
		{ path: "/questions", icon: BookCheck, text: "질문" },
		{ path: "/explore", icon: Camera, text: "탐색" },
		{ path: "/home", icon: HouseHeart, text: "홈" },
	];

	return (
		<footer className={`fixed z-[9999] bottom-0 left-0 w-full flex items-center justify-around rounded-t-2xl border-t bg-white/95 backdrop-blur safe-bottom ${isIos ? "h-20" : "h-16"}`}>
			{items.map((item, index) => (
				<Item key={index} icon={item.icon} text={item.text} path={item.path} active={location.pathname === item.path} />
			))}
		</footer>
	);
}

function Item({ icon: Icon, text, active, path }) {
	return (
		<Link
			className={`flex h-16 w-16 items-center justify-center text-text transition-colors hover:text-[#FE7495] ${
				active ? "text-primary" : "text-subtext"
			}`}
			to={path}
			aria-label={text}
			title={text}>
			<Icon className="h-11 w-11" strokeWidth={2.4} />
		</Link>
	);
}
