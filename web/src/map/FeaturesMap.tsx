import { useRef, useState } from 'react'
import { Marker, Tooltip, useMapEvents } from 'react-leaflet'
import { MapWSClient, useMapWs } from '../MapWS'
import { Feature, MarkerGeometry } from './Feature'
import { Layer } from './Layer'
import LeafMap, { LeafMapProps } from './LeafMap'
import { deepFlip, XZ } from './spatial'

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

	return (
		<LeafMap {...mapProps}>
			{layers.map((l) => (
				<CivLayer layer={l} controls={controls} key={l.url} />
			))}
			<MarkerAtClick controls={controls} />
		</LeafMap>
	)
}

function MarkerAtClick(props: { controls: MapControls }) {
	const [markerPos, setMarkerPos] = useState<XZ | null>(null)

	useMapEvents({
		click: (e) => {
			console.log(e)
			const { lat: z, lng: x } = e.latlng
			props.controls.onClickMap?.([x, z])
			setMarkerPos([x, z])
		},
	})

	if (!markerPos) return null
	return (
		<Marker position={deepFlip(markerPos)}>
			<Tooltip direction="bottom" sticky>
				X {markerPos?.[0]} {markerPos?.[1]} Z
			</Tooltip>
		</Marker>
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
			position={[feature.z, feature.x]}
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
