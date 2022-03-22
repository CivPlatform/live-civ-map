import { LeafletEvent } from 'leaflet'
import { useCallback } from 'react'
import { Polyline } from 'react-leaflet'
import { EditableFeatureProps, setEditable } from '.'
import { deepFlip, XZ, xzFromLatLng } from '../map/spatial'

export type LinesGeometry = { lines: XZ[][] }

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

	if (!checkValidMultiLine(lines) && !checkValidLine(lines)) {
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
				click: props.onClick,
			}}
		>
			{children}
		</Polyline>
	)
}

export function checkValidMultiLine(line: any): boolean {
	return line && line.length && line.every(checkValidLine)
}
export function checkValidLine(line: any): boolean {
	return line && line.length >= 2 && line.every(checkValidPos)
}
function checkValidPos(pos: any): boolean {
	return (
		pos &&
		pos.length === 2 &&
		Number.isFinite(pos[0]) &&
		Number.isFinite(pos[1])
	)
}
