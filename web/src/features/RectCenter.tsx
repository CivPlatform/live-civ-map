import { LeafletEvent } from 'leaflet'
import { useCallback } from 'react'
import { Rectangle } from 'react-leaflet'
import { EditableFeatureProps, setEditable } from '.'
import { deepFlip } from '../map/spatial'

export type RectCenterGeometry = { x: number; z: number; rect_size: number }

export function EditableRectCenter(
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
				click: props.onClick,
			}}
		>
			{children}
		</Rectangle>
	)
}
