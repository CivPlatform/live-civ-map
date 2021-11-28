import { FeatureUpdateDTO } from '../map/LayerState'
import { CircleGeometry, EditableCircle } from './Circle'
import { EditableLines, LinesGeometry } from './Lines'
import { EditableMapImage, MapImageGeometry } from './MapImage'
import { EditableMarker, MarkerGeometry } from './Marker'
import { EditablePolygon, PolygonsGeometry } from './Polygons'
import { EditableRectBounds, RectBoundsGeometry } from './RectBounds'
import { EditableRectCenter, RectCenterGeometry } from './RectCenter'

export interface Feature {
	/** should never be exposed to user */
	id: string
	data: { [k: string]: any }
	creator_id: string
	created_ts: number
	last_editor_id: string
	last_edited_ts: number
}

export type FeatureGeometry =
	| MarkerGeometry
	| CircleGeometry
	| RectCenterGeometry
	| RectBoundsGeometry
	| LinesGeometry
	| PolygonsGeometry
	| MapImageGeometry

export interface EditableFeatureProps<G extends FeatureGeometry> {
	featureId: Feature['id']
	geometry: G
	updateFeature?: (f: FeatureUpdateDTO) => void
	children?: React.ReactNode
}

export function EditableFeature(props: EditableFeatureProps<FeatureGeometry>) {
	const { geometry: geom } = props
	// order matters: first matching determines display mode
	if ('x' in geom && 'z' in geom) {
		if ('radius' in geom) return <EditableCircle {...props} geometry={geom} />
		if ('rect_size' in geom)
			return <EditableRectCenter {...props} geometry={geom} />
		return <EditableMarker {...props} geometry={geom} />
	}
	if ('polygons' in geom) return <EditablePolygon {...props} geometry={geom} />
	if ('lines' in geom) return <EditableLines {...props} geometry={geom} />
	if ('rectangle' in geom)
		return <EditableRectBounds {...props} geometry={geom} />
	if ('map_image' in geom)
		return <EditableMapImage {...props} geometry={geom} />
	return null
}

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
