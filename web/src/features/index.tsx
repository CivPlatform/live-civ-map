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
	children?: React.ReactNode
}

export function EditableFeature(props: {
	layerUrl: string
	featureId: Feature['id']
	geometry: FeatureGeometry
	children?: React.ReactNode
}) {
	const updateFeature = useUpdateFeature(props.layerUrl)

	const fp = { ...props, updateFeature } // "feature props"

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
