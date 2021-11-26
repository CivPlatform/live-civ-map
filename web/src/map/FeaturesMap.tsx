import { Marker } from 'react-leaflet'
import { MapWSClient, useMapWs } from '../MapWS'
import { Feature, MarkerGeometry } from './Feature'
import { Layer } from './Layer'
import LeafMap, { LeafMapProps } from './LeafMap'
import { XZ } from './spatial'

export interface MapControls {
	onClickFeature?: (f: Feature) => any
	onClickMap?: (pos: XZ) => any
}

export function FeaturesMap(
	props: {
		layers: Layer[]
		controls: MapControls
	} & LeafMapProps
) {
	let { layers, controls, ...mapProps } = props

	// TODO onClickMap

	return (
		<LeafMap {...mapProps}>
			{layers.map((l) => (
				<CivLayer layer={l} controls={controls} key={l.url} />
			))}
		</LeafMap>
	)
}

function CivLayer(props: { layer: Layer; controls: MapControls }) {
	const { layer, controls } = props

	const layerControl = useMapWs(layer.url)

	if (!layerControl) return null

	const features = layerControl.getAllFeatures()

	return (
		<>
			{features.map((feature) => {
				// TODO select component by geometry
				return (
					<CivMarker
						feature={feature as Feature<MarkerGeometry>}
						controls={controls}
						layerControl={layerControl}
						key={feature.id}
					/>
				)
			})}
		</>
	)
}

function CivMarker(props: {
	feature: Feature<MarkerGeometry>
	controls: MapControls
	layerControl: MapWSClient
}) {
	const { feature, controls } = props
	const { onClickFeature } = controls
	return (
		<Marker
			position={[feature.geometry.z, feature.geometry.x]}
			eventHandlers={{
				click: () => onClickFeature && onClickFeature(feature),
			}}
		>
			{/* {getTooltip && (
				<Tooltip direction="bottom" sticky>
					{getTooltip(feature)}
				</Tooltip>
			)} */}
		</Marker>
	)
}
