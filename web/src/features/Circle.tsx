import { Circle } from 'react-leaflet'
import { EditableFeatureProps } from '.'

export type CircleGeometry = { x: number; z: number; radius: number }

export function EditableCircle(props: EditableFeatureProps<CircleGeometry>) {
	const { children, geometry } = props
	const { x, z, radius } = geometry

	if (!isFinite(x) || !isFinite(z) || !isFinite(radius)) {
		return null
	}

	return (
		<Circle
			radius={radius}
			center={[z, x]}
			eventHandlers={{
				click: props.onClick,
			}}
		>
			{children}
		</Circle>
	)
}
