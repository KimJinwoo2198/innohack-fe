export default function Card({ children, className }) {
	return <div className={`w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm ${className}`}>{children}</div>;
}
