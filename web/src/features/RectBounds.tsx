import { LeafletEvent } from 'leaflet'
import { useCallback } from 'react'
import { Rectangle } from 'react-leaflet'
import { EditableFeatureProps, setEditable } from '.'
import { Bounds, deepFlip } from '../map/spatial'

export type RectBoundsGeometry = { rectangle: Bounds }

export function EditableRectBounds(
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
	if (!rectangle || rectangle.flat(99).length !== 4) {
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
