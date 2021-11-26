import { Marker } from 'react-leaflet'
import { useMapWs } from '../MapWS'
import { Feature } from './Feature'
import { Layer } from './Layer'
import LeafMap, { LeafMapProps } from './LeafMap'
import { XZ } from './spatial'

export function FeaturesMap(
	props: {
		layers: Layer[]
		onClickFeature?: (f: Feature) => any
		onClickMap?: (pos: XZ) => any
	} & LeafMapProps
) {
	let { layers, onClickFeature, onClickMap, ...mapProps } = props

	// TODO onClickMap

	return (
		<LeafMap {...mapProps}>
			{layers.map((l) => (
				<CivLayer layer={l} onClickFeature={onClickFeature} key={l.url} />
			))}
		</LeafMap>
	)
}

function CivLayer(props: {
	layer: Layer
	onClickFeature?: (f: Feature) => any
}) {
	const { layer, onClickFeature } = props

	const mws = useMapWs(layer.url)

	const features = mws?.getAllFeatures() || []

	return (
		<>
			{features.map((feature) => {
				// TODO select component by geometry
				return <CivMarker feature={feature} onClickFeature={onClickFeature} />
			})}
		</>
	)
}

function CivMarker(props: {
	feature: Feature
	onClickFeature?: (f: Feature) => any
}) {
	const { feature, onClickFeature } = props
	return (
		<Marker
			position={[feature.geometry.z, feature.geometry.x]}
			eventHandlers={{
				click: () => onClickFeature && onClickFeature(feature),
			}}
			key={feature.id}
		>
			{/* {getTooltip && (
				<Tooltip direction="bottom" sticky>
					{getTooltip(feature)}
				</Tooltip>
			)} */}
		</Marker>
	)
}
