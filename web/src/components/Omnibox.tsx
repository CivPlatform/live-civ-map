import { useNavigate } from 'react-router'
import { useSearchQuery } from '../state/Search'

export function Omnibox() {
	const navigate = useNavigate()
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
				boxSizing: 'border-box',
				display: 'flex',
				flexDirection: 'row',
				backgroundColor: 'white',
				borderRadius: 4,
				boxShadow: '0 0 4px gray',
			}}
		>
			<button
				title="Menu"
				onClick={() => navigate(`/`)}
				style={{
					height: 40,
					width: 40,
					border: 'none',
					backgroundColor: 'white',
					borderRadius: 4,
					cursor: 'pointer',
				}}
			>
				=
			</button>
			<input
				type="search"
				placeholder="Search"
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
				style={{
					maxHeight: '100%',
					flex: 1,
					border: 'none',
					borderRadius: 4,
				}}
			/>
		</div>
	)
}
