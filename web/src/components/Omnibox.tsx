import { useNavigate } from 'react-router'

export function Omnibox() {
	const navigate = useNavigate()
	return (
		<div
			style={{
				zIndex: 2000,
				position: 'absolute',
				left: 8,
				top: 8,
				maxWidth: 284,
				minWidth: 284,
				height: 40,
				padding: '0 8px',
				boxSizing: 'border-box',
				display: 'flex',
				flexDirection: 'row',
				backgroundColor: 'white',
				borderRadius: 4,
				boxShadow: '0 0 4px gray',
			}}
		>
			<button
				style={{
					height: 40,
					width: 40,
					border: 'none',
					backgroundColor: 'white',
					cursor: 'pointer',
				}}
			>
				M
			</button>
			<input
				type="search"
				placeholder="Search"
				style={{
					maxHeight: '100%',
					flex: 1,
					border: 'none',
				}}
				onChange={(e) => navigate(`/search/${e.target.value}`)}
			/>
		</div>
	)
}
