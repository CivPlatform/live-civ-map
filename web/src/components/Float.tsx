/** below omnibar. vertical */
export function Float(props: { children?: React.ReactNode }) {
	return (
		<div
			style={{
				zIndex: 1000,
				position: 'absolute',
				left: 8,
				top: 56,
				maxWidth: 284,
				minWidth: 284,
				padding: '8px 0',
				boxSizing: 'border-box',
				display: 'flex',
				flexDirection: 'column',
				borderRadius: 4,
				backgroundColor: 'white',
				boxShadow: '0 0 4px gray',
			}}
		>
			{props.children}
		</div>
	)
}
