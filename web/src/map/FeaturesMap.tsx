import { LeafletEvent } from 'leaflet'
import { useCallback } from 'react'
import { Marker, Polygon, Polyline, Popup, Rectangle } from 'react-leaflet'
import { EditorCreator } from './EditorCreator'
import {
	Feature,
	LinesGeometry,
	MarkerGeometry,
	PolygonsGeometry,
	RectBoundsGeometry,
	RectCenterGeometry,
} from './Feature'
import { Layer, useLayers } from './Layer'
import { useLayerState, useUpdateFeature } from './LayerState'
import LeafMap, { LeafMapProps } from './LeafMap'
import { Bounds, deepFlip, xzFromLatLng } from './spatial'

export function FeaturesMap(props: LeafMapProps) {
	const [layers] = useLayers()

	const editorLayer = layers[0] // XXX

	return (
		<LeafMap {...props}>
			{layers.map((l) => (
				<EditableLayer layer={l} key={l.url} />
			))}
			<EditorCreator layer={editorLayer} />
			{props.children}
		</LeafMap>
	)
}

export function EditableLayer(props: { layer: Layer }) {
	const { layer } = props

	const [layerState] = useLayerState(layer.url)

	const updateFeature = useUpdateFeature(layer.url)

	// TODO perf: use recoil selector
	const features = Object.values(layerState.featuresById)

	return (
		<>
			{features.map((feature) => {
				const EditableFeature = getFeatureComponent(feature)
				if (!EditableFeature) return null
				return (
					<EditableFeature
						feature={feature as any} // TODO
						updateFeature={updateFeature}
						key={feature.id}
					/>
				)
			})}
		</>
	)
}

function getFeatureComponent(feature: Feature) {
	// order matters: first matching determines display mode
	// if ('map_image' in feature) return EditableImage
	if ('polygons' in feature) return EditablePolygon
	if ('lines' in feature) return EditableLines
	if ('rectangle' in feature) return EditableRectangleBounds
	if ('x' in feature && 'z' in feature) {
		if ('rect_size' in feature) return EditableRectangleCenter
		// if ('radius' in feature) return EditableCircle
		return EditableMarker
	}
	return null
}

export function EditableMarker(props: {
	feature: Feature<MarkerGeometry>
	updateFeature?: (f: Feature) => void
}) {
	const { feature, updateFeature } = props
	const { x, z } = feature

	if (!isFinite(x) || !isFinite(z)) {
		return null
	}

	return (
		<Marker
			draggable={!!updateFeature}
			position={[z, x]}
			eventHandlers={{
				dragend: (e) => {
					const { lat: z, lng: x } = e.target.getLatLng()
					updateFeature?.({ ...feature, x, z })
				},
			}}
		>
			{<Popup>hi</Popup>}
		</Marker>
	)
}

export function EditableLines(props: {
	feature: Feature<LinesGeometry>
	updateFeature?: (f: Feature) => void
}) {
	const { feature, updateFeature } = props
	const { lines } = feature

	const editHandler = useCallback(
		(e: LeafletEvent) => {
			const lines = xzFromLatLng(e.target.getLatLngs()) as any // XXX normalize nesting depth
			updateFeature?.({ ...feature, lines })
		},
		[feature, updateFeature]
	)

	// TODO better validation
	if (!lines) {
		return null
	}

	return (
		<Polyline
			positions={deepFlip(lines)}
			ref={(r) => setEditable(r, updateFeature)}
			eventHandlers={{
				'editable:drawing:clicked': editHandler,
				'editable:vertex:dragend': editHandler,
				'editable:vertex:deleted': editHandler,
			}}
		>
			{<Popup>hi</Popup>}
		</Polyline>
	)
}

export function EditablePolygon(props: {
	feature: Feature<PolygonsGeometry>
	updateFeature?: (f: Feature) => void
}) {
	const { feature, updateFeature } = props
	const { polygons } = feature

	const editHandler = useCallback(
		(e: LeafletEvent) => {
			const polygons = xzFromLatLng(e.target.getLatLngs()) as any // XXX normalize nesting depth
			updateFeature?.({ ...feature, polygons })
		},
		[feature, updateFeature]
	)

	// TODO better validation
	if (!polygons) {
		return null
	}

	return (
		<Polygon
			positions={deepFlip(polygons)}
			ref={(r) => setEditable(r, updateFeature)}
			eventHandlers={{
				'editable:drawing:clicked': editHandler,
				'editable:vertex:dragend': editHandler,
				'editable:vertex:deleted': editHandler,
			}}
		>
			{<Popup>hi</Popup>}
		</Polygon>
	)
}

export function EditableRectangleBounds(props: {
	feature: Feature<RectBoundsGeometry>
	updateFeature?: (f: Feature) => void
}) {
	const { feature, updateFeature } = props
	const { rectangle } = feature

	const editHandler = useCallback(
		(e: LeafletEvent) => {
			const llbounds = e.target.getBounds()
			const rectangle: Bounds = [
				[llbounds.getWest(), llbounds.getSouth()],
				[llbounds.getEast(), llbounds.getNorth()],
			]
			updateFeature?.({ ...feature, rectangle })
		},
		[feature, updateFeature]
	)

	// TODO better validation
	if (!rectangle) {
		return null
	}

	return (
		<Rectangle
			bounds={deepFlip(rectangle)}
			ref={(r) => setEditable(r, updateFeature)}
			eventHandlers={{
				'editable:vertex:dragend': editHandler,
			}}
		>
			{<Popup>hi</Popup>}
		</Rectangle>
	)
}

export function EditableRectangleCenter(props: {
	feature: Feature<RectCenterGeometry>
	updateFeature?: (f: Feature) => void
}) {
	const { feature, updateFeature } = props
	const { x, z, rect_size } = feature

	const editHandler = useCallback(
		(e: LeafletEvent) => {
			const llbounds = e.target.getBounds()
			const x = (llbounds.getWest() + llbounds.getEast()) / 2
			const z = (llbounds.getNorth() + llbounds.getSouth()) / 2
			const dx = Math.abs(llbounds.getWest() - llbounds.getEast())
			const dz = Math.abs(llbounds.getNorth() - llbounds.getSouth())
			const rect_size = Math.min(dx, dz)
			updateFeature?.({ ...feature, x, z, rect_size })
		},
		[feature, updateFeature]
	)

	if (!isFinite(x) || !isFinite(z) || !isFinite(rect_size)) {
		return null
	}

	return (
		<Rectangle
			bounds={deepFlip([
				[x - rect_size, z - rect_size],
				[x + rect_size, z + rect_size],
			])}
			ref={(r) => setEditable(r, updateFeature)}
			eventHandlers={{
				'editable:vertex:dragend': editHandler,
			}}
		>
			{<Popup>hi</Popup>}
		</Rectangle>
	)
}

function setEditable(r: any, enabled: any) {
	if (!r) return
	setImmediate(() =>
		setImmediate(() => {
			if (enabled) {
				r.enableEdit()
				r.editor.reset()
			} else {
				r.disableEdit()
			}
		})
	)
}
