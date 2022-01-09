export const CircleIcon = ({
	size,
	color,
	...props
}: {
	size: number | string
	color: string
	children?: React.ReactNode
	style?: React.CSSProperties
	title?: string
}) => (
	<div
		{...props}
		style={{
			display: 'inline-block',
			width: size,
			height: size,
			borderRadius: size,
			backgroundColor: color,
			...props.style,
		}}
	/>
)
