export function Popup(props: {
	children?: React.ReactNode
	onClose?: () => void
	maxWidth?: number | string
	style?: React.CSSProperties
}) {
	const { maxWidth = 400 } = props
	return (
		<div
			onClick={props.onClose}
			style={{
				zIndex: 99999,
				position: 'fixed',
				top: 0,
				right: 0,
				bottom: 0,
				left: 0,
				padding: '1em',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				backgroundColor: 'rgba(0,0,0, 0.5)',
			}}
		>
			<div
				onClick={stopEventPropagation} // don't close when clicking inside popup
				style={{
					maxWidth: maxWidth,
					padding: '2em',
					backgroundColor: 'white',
					...props.style,
				}}
			>
				{props.children}
			</div>
		</div>
	)
}

const stopEventPropagation = (e: React.MouseEvent) => e.stopPropagation()
