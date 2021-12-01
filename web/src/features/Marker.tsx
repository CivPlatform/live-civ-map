import { Marker } from 'react-leaflet'
import { EditableFeatureProps } from '.'

export type MarkerGeometry = { x: number; z: number }

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
				click: props.onClick,
			}}
		>
			{children}
		</Marker>
	)
}
