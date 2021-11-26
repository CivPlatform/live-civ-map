import { Marker } from 'react-leaflet'
import { useMapWs } from '../MapWS'
import { Feature } from './features'
import LeafMap, { LeafMapProps } from './LeafMap'
import { XZ } from './spatial'

export function FeaturesMap(
	props: {
		layers: { url: string }[]
		onClickFeature?: (f: Feature) => any
		onClickMap?: (pos: XZ) => any
	} & LeafMapProps
) {
	let { layers, onClickFeature, onClickMap, ...mapProps } = props

	return (
		<LeafMap {...mapProps}>
			{layers.map((l) => (
				<Layer layer={l} onClickFeature={onClickFeature} />
			))}
		</LeafMap>
	)
}

export default FeaturesMap

function Layer(props: {
	layer: { url: string }
	onClickFeature?: (f: Feature) => any
}) {
	const { layer, onClickFeature } = props

	const mws = useMapWs(layer.url)

	const features = mws?.getAllFeatures() || []

	return (
		<>
			{features.map((feature) => {
				return (
					<Marker
						key={feature.id}
						position={[feature.geometry.z, feature.geometry.x]}
						eventHandlers={{
							click: () => onClickFeature && onClickFeature(feature),
						}}
					>
						{/* {getTooltip && (
							<Tooltip direction="bottom" sticky>
								{getTooltip(feature)}
							</Tooltip>
						)} */}
					</Marker>
				)
			})}
		</>
	)
}
