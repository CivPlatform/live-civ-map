import { Marker, Tooltip } from 'react-leaflet'
import { useRecoilValue } from 'recoil'
import { Feature, featuresState } from './features'
import LeafMap, { LeafMapProps } from './LeafMap'
import { deepFlip, XZ } from './spatial'

export function FeaturesMap(
	props: {
		onClickFeature?: (f: Feature) => any
		onClickMap?: (pos: XZ) => any
	} & LeafMapProps
) {
	let { onClickFeature, onClickMap, ...mapProps } = props
	const features = useRecoilValue(featuresState)

	return (
		<LeafMap {...mapProps}>
			{features.map((feature) => {
				const { x, z } = feature.geometry
				return (
					<Marker
						key={feature.id}
						position={[z, x]}
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
		</LeafMap>
	)
}

export default FeaturesMap
