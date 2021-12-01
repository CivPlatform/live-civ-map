import { LeafletMouseEventHandlerFn } from 'leaflet'
import { useCallback } from 'react'
import { useMatch, useNavigate } from 'react-router'
import { layerSlugFromUrl } from '../pages'
import { Feature } from '../state/Feature'
import { FeatureUpdateDTO, useUpdateFeature } from '../state/LayerState'
import { CircleGeometry, EditableCircle } from './Circle'
import { EditableLines, LinesGeometry } from './Lines'
import { EditableMapImage, MapImageGeometry } from './MapImage'
import { EditableMarker, MarkerGeometry } from './Marker'
import { EditablePolygon, PolygonsGeometry } from './Polygons'
import { EditableRectBounds, RectBoundsGeometry } from './RectBounds'
import { EditableRectCenter, RectCenterGeometry } from './RectCenter'

export type FeatureGeometry =
	| MarkerGeometry
	| CircleGeometry
	| RectCenterGeometry
	| RectBoundsGeometry
	| LinesGeometry
	| PolygonsGeometry
	| MapImageGeometry

/** shared by all features */
export interface EditableFeatureProps<G extends FeatureGeometry> {
	featureId: Feature['id']
	geometry: G
	updateFeature?: (f: FeatureUpdateDTO) => void
	onClick?: LeafletMouseEventHandlerFn
	children?: React.ReactNode
}

export function EditableFeature(props: {
	layerUrl: string
	featureId: Feature['id']
	geometry: FeatureGeometry
	children?: React.ReactNode
}) {
	const updateFeature = useUpdateFeature(props.layerUrl)

	const navigate = useNavigate()

	const routerMatchEdit = useMatch(
		`/layer/${layerSlugFromUrl(props.layerUrl)}/feature/${props.featureId}/edit`
	)

	const onClick = useCallback(() => {
		const layerSlug = layerSlugFromUrl(props.layerUrl)
		const pathBase = `/layer/${layerSlug}/feature/${props.featureId}`
		navigate(routerMatchEdit ? pathBase + '/edit' : pathBase)
	}, [navigate, routerMatchEdit, props.layerUrl, props.featureId])

	const fp: EditableFeatureProps<FeatureGeometry> = {
		...props,
		onClick,
		updateFeature: routerMatchEdit ? updateFeature : undefined,
	}

	const { geometry: geom } = fp
	// order matters: first matching determines display mode
	if ('x' in geom && 'z' in geom) {
		if ('radius' in geom) return <EditableCircle {...fp} geometry={geom} />
		if ('rect_size' in geom)
			return <EditableRectCenter {...fp} geometry={geom} />
		return <EditableMarker {...fp} geometry={geom} />
	}
	if ('polygons' in geom) return <EditablePolygon {...fp} geometry={geom} />
	if ('lines' in geom) return <EditableLines {...fp} geometry={geom} />
	if ('rectangle' in geom) return <EditableRectBounds {...fp} geometry={geom} />
	if ('map_image' in geom) return <EditableMapImage {...fp} geometry={geom} />
	return null
}

/** Used internally to set up a Leaflet feature for editing. See usages. */
export function setEditable(r: any, enabled: any) {
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
