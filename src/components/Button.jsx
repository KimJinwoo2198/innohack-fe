import PropTypes from "prop-types";

export default function Button({ disabled, className, children, ...props }) {
	return (
		<button
			className={`px-5 py-3 text-white font-semibold rounded-xl cursor-pointer shadow-sm active:scale-[0.98] transition-transform duration-150 ${disabled ? "cursor-not-allowed bg-disabled opacity-90" : "bg-primary"} ${className}`}
			disabled={disabled}
			{...props}
		>
			{children}
		</button>
	);
}

Button.propTypes = {
	disabled: PropTypes.bool,
	children: PropTypes.node.isRequired,
};
