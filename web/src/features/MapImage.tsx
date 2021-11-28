import { ImageOverlay } from 'react-leaflet'
import { EditableFeatureProps } from '.'
import { Bounds, deepFlip } from '../map/spatial'

export type MapImageGeometry = { map_image: { url: string; bounds: Bounds } }

export function EditableMapImage(
	props: EditableFeatureProps<MapImageGeometry>
) {
	const { children, geometry } = props
	const { bounds, url } = geometry.map_image

	// TODO better validation
	if (!url || !bounds || bounds.flat(99).length !== 4) {
		return null
	}

	return (
		<ImageOverlay url={url} bounds={deepFlip(bounds)}>
			{children}
		</ImageOverlay>
	)
}
