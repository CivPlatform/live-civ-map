import { LeafletEvent } from 'leaflet'
import { useCallback } from 'react'
import {
	Circle,
	ImageOverlay,
	Marker,
	Polygon,
	Polyline,
	Rectangle,
} from 'react-leaflet'
import { EditorCreator } from './EditorCreator'
import {
	CircleGeometry,
	Feature,
	FeatureGeometry,
	LinesGeometry,
	MapImageGeometry,
	MarkerGeometry,
	PolygonsGeometry,
	RectBoundsGeometry,
	RectCenterGeometry,
} from './Feature'
import { Layer, useLayers } from './Layer'
import { FeatureUpdateDTO, useLayerState, useUpdateFeature } from './LayerState'
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
				const geometry = feature.data as FeatureGeometry // TODO
				return (
					<EditableFeature
						featureId={feature.id}
						geometry={geometry}
						updateFeature={updateFeature}
						key={feature.id}
					/>
				)
			})}
		</>
	)
}

interface EditableFeatureProps<G extends FeatureGeometry> {
	featureId: Feature['id']
	geometry: G
	updateFeature?: (f: FeatureUpdateDTO) => void
	children?: React.ReactNode
}

function EditableFeature(props: EditableFeatureProps<FeatureGeometry>) {
	const { geometry: geom } = props
	// order matters: first matching determines display mode
	if ('x' in geom && 'z' in geom) {
		if ('radius' in geom) return <EditableCircle {...props} geometry={geom} />
		if ('rect_size' in geom)
			return <EditableRectangleCenter {...props} geometry={geom} />
		return <EditableMarker {...props} geometry={geom} />
	}
	if ('polygons' in geom) return <EditablePolygon {...props} geometry={geom} />
	if ('lines' in geom) return <EditableLines {...props} geometry={geom} />
	if ('rectangle' in geom)
		return <EditableRectangleBounds {...props} geometry={geom} />
	if ('map_image' in geom)
		return <EditableMapImage {...props} geometry={geom} />
	return null
}

export function EditableMarker(props: EditableFeatureProps<MarkerGeometry>) {
	const { children, geometry, featureId, updateFeature } = props
	const { x, z } = geometry

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
					const data = { x, z }
					updateFeature?.({ id: featureId, data })
				},
			}}
		>
			{children}
		</Marker>
	)
}

export function EditableCircle(props: EditableFeatureProps<CircleGeometry>) {
	const { children, geometry } = props
	const { x, z, radius } = geometry

	if (!isFinite(x) || !isFinite(z) || !isFinite(radius)) {
		return null
	}

	return (
		<Circle radius={radius} center={[z, x]}>
			{children}
		</Circle>
	)
}

export function EditableLines(props: EditableFeatureProps<LinesGeometry>) {
	const { children, geometry, featureId, updateFeature } = props
	const { lines } = geometry

	const editHandler = useCallback(
		(e: LeafletEvent) => {
			const lines = xzFromLatLng(e.target.getLatLngs()) as any // XXX normalize nesting depth
			const data = { lines }
			updateFeature?.({ id: featureId, data })
		},
		[featureId, updateFeature]
	)

	// TODO better validation
	if (!lines || lines.flat(99).length < 4) {
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
			{children}
		</Polyline>
	)
}

export function EditablePolygon(props: EditableFeatureProps<PolygonsGeometry>) {
	const { children, geometry, featureId, updateFeature } = props
	const { polygons } = geometry

	const editHandler = useCallback(
		(e: LeafletEvent) => {
			const polygons = xzFromLatLng(e.target.getLatLngs()) as any // XXX normalize nesting depth
			const data = { polygons }
			updateFeature?.({ id: featureId, data })
		},
		[featureId, updateFeature]
	)

	// TODO better validation
	if (!polygons || polygons.flat(99).length < 6) {
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
			{children}
		</Polygon>
	)
}

export function EditableRectangleCenter(
	props: EditableFeatureProps<RectCenterGeometry>
) {
	const { children, geometry, featureId, updateFeature } = props
	const { x, z, rect_size } = geometry

	const editHandler = useCallback(
		(e: LeafletEvent) => {
			const llbounds = e.target.getBounds()
			const x = (llbounds.getWest() + llbounds.getEast()) / 2
			const z = (llbounds.getNorth() + llbounds.getSouth()) / 2
			const dx = Math.abs(llbounds.getWest() - llbounds.getEast())
			const dz = Math.abs(llbounds.getNorth() - llbounds.getSouth())
			const rect_size = Math.min(dx, dz)
			const data = { x, z, rect_size }
			updateFeature?.({ id: featureId, data })
		},
		[featureId, updateFeature]
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
			{children}
		</Rectangle>
	)
}

export function EditableRectangleBounds(
	props: EditableFeatureProps<RectBoundsGeometry>
) {
	const { children, geometry, featureId, updateFeature } = props
	const { rectangle } = geometry

	const editHandler = useCallback(
		(e: LeafletEvent) => {
			const llbounds = e.target.getBounds()
			const rectangle: Bounds = [
				[llbounds.getWest(), llbounds.getSouth()],
				[llbounds.getEast(), llbounds.getNorth()],
			]
			const data = { rectangle }
			updateFeature?.({ id: featureId, data })
		},
		[featureId, updateFeature]
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
			{children}
		</Rectangle>
	)
}

export function EditableMapImage(
	props: EditableFeatureProps<MapImageGeometry>
) {
	const { children, geometry } = props
	const { bounds, url } = geometry.map_image

	// TODO better validation
	if (!url || !bounds) {
		return null
	}

	return (
		<ImageOverlay url={url} bounds={deepFlip(bounds)}>
			{children}
		</ImageOverlay>
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
