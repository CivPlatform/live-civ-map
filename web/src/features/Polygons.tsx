import { LeafletEvent } from 'leaflet'
import { useCallback } from 'react'
import { Polygon } from 'react-leaflet'
import { EditableFeatureProps, setEditable } from '.'
import { deepFlip, XZ, xzFromLatLng } from '../map/spatial'

export type PolygonsGeometry = { polygons: XZ[][] }

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

	if (!checkValidMultiPoly(polygons)) {
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
				click: props.onClick,
			}}
		>
			{children}
		</Polygon>
	)
}

export function checkValidMultiPoly(poly: any): boolean {
	return poly && poly.length && poly.every(checkValidPoly)
}
export function checkValidPoly(poly: any): boolean {
	return poly && poly.length >= 3 && poly.every(checkValidPos)
}
function checkValidPos(pos: any): boolean {
	return (
		pos &&
		pos.length === 2 &&
		Number.isFinite(pos[0]) &&
		Number.isFinite(pos[1])
	)
}
