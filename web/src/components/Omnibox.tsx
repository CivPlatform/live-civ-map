import { useSearchQuery } from '../state/Search'

export function Omnibox() {
	const [searchQuery, setSearchQuery] = useSearchQuery()
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
				title="Menu"
			>
				=
			</button>
			<input
				type="search"
				placeholder="Search"
				style={{
					maxHeight: '100%',
					flex: 1,
					border: 'none',
				}}
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
			/>
		</div>
	)
}
