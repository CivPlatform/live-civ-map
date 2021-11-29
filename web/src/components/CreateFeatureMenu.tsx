import { useState } from 'react'
import { useCreatedFeatureInfo } from '../map/EditorCreator'

export function CreateFeatureMenuItem(props: { layerUrl: string }) {
	const { layerUrl } = props
	const [createPopupOpen, setCreatePopupOpen] = useState(false)
	return (
		<div style={{ position: 'relative', display: 'flex' }}>
			<button
				onClick={() => setCreatePopupOpen((open) => !open)}
				style={{ padding: '8px 16px', flex: 1 }}
			>
				Create feature ...
			</button>
			{createPopupOpen && (
				<CreateFeatureMenu
					layerUrl={layerUrl}
					onClick={() => setCreatePopupOpen(false)}
					style={{
						position: 'absolute',
						left: 300,
						top: 0,
						backgroundColor: 'white',
						padding: 8,
						minWidth: 200,
					}}
				/>
			)}
		</div>
	)
}

export function CreateFeatureMenu(props: {
	layerUrl: string
	onClick?: () => any
	style?: React.CSSProperties
}) {
	const { layerUrl, onClick, style } = props
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [_createdFeatureInfo, setCreatedFeatureInfo] = useCreatedFeatureInfo()

	return (
		<div style={style}>
			<div
				onClick={() => {
					setCreatedFeatureInfo({ layerUrl, type: 'marker' })
					onClick?.()
				}}
			>
				<span>+</span>
				<span>Create Marker</span>
			</div>
			<div
				onClick={() => {
					setCreatedFeatureInfo({ layerUrl, type: 'line' })
					onClick?.()
				}}
			>
				<span>+</span>
				<span>Create Line</span>
			</div>
			<div
				onClick={() => {
					setCreatedFeatureInfo({ layerUrl, type: 'polygon' })
					onClick?.()
				}}
			>
				<span>+</span>
				<span>Create Polygon</span>
			</div>
			<div
				onClick={() => {
					setCreatedFeatureInfo({ layerUrl, type: 'rectangle' })
					onClick?.()
				}}
			>
				<span>+</span>
				<span>Create Rectangle</span>
			</div>
			<div
				onClick={() => {
					setCreatedFeatureInfo({ layerUrl, type: 'map_image' })
					onClick?.()
				}}
			>
				<span>+</span>
				<span>Overlay Image on Map</span>
			</div>
			<div style={{ opacity: 0.5 }}>
				<span>+</span>
				<span>Create Circle</span>
			</div>
		</div>
	)
}
