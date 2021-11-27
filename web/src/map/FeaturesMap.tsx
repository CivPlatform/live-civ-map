import { useState } from 'react'
import { Marker, Popup, Tooltip, useMapEvents } from 'react-leaflet'
import { MapWSClient, useMapWs } from '../MapWS'
import { EditorCreator } from './EditorCreator'
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
		createdFeatureType: string | null
		setCreatedFeatureType: (state: string | null) => void
	} & LeafMapProps
) {
	const {
		layers,
		controls,
		createdFeatureType,
		setCreatedFeatureType,
		...mapProps
	} = props

	return (
		<LeafMap {...mapProps}>
			{layers.map((l) => (
				<EditableLayer layer={l} controls={controls} key={l.url} />
			))}
			<EditorCreator
				createdFeatureType={createdFeatureType}
				setCreatedFeatureType={setCreatedFeatureType}
			/>
			{props.children}
		</LeafMap>
	)
}

export function MarkerAtClick(props: { controls: MapControls }) {
	const [markerPos, setMarkerPos] = useState<XZ | null>(null)

	useMapEvents({
		click: (e) => {
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

export function EditableLayer(props: { layer: Layer; controls: MapControls }) {
	const { layer, controls } = props

	const layerControl = useMapWs(layer.url)

	if (!layerControl) return null

	const features = layerControl.getAllFeatures()

	return (
		<>
			{features.map((feature) => {
				// TODO select component by geometry
				return (
					<EditableMarker
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

export function EditableMarker(props: {
	feature: Feature<MarkerGeometry>
	controls: MapControls
	layerControl: MapWSClient
}) {
	const { feature, controls, layerControl } = props
	const { onClickFeature } = controls
	const { x, z } = feature

	if (!isFinite(x) || !isFinite(z)) {
		return null
	}

	return (
		<Marker
			position={[z, x]}
			eventHandlers={{
				click: () => onClickFeature && onClickFeature(feature),
				'editable:drawing:commit': (e) => {
					const { lat: z, lng: x } = e.target.getLatLng()
					console.log('x z', x, z)
					layerControl.updateFeature({ ...feature, x, z })
				},
			}}
		>
			{<Popup>hi</Popup>}
		</Marker>
	)
}
