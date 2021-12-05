import { values } from 'mobx'
import { observer } from 'mobx-react-lite'
import { EditableFeature, FeatureGeometry } from '../features'
import { useMobx } from '../model'
import { LayerConfig } from '../model/LayerConfig'
import { EditorCreator } from './EditorCreator'
import LeafMap, { LeafMapProps } from './LeafMap'

export const CivMap = observer(function CivMap(props: LeafMapProps) {
	const layerConfigs = useMobx().layerConfigs.layers
	// TODO show temp layer from url

	return (
		<LeafMap {...props}>
			{layerConfigs
				.filter((lc) => !lc.hidden)
				.map((lc) => (
					<MapLayer layerConfig={lc} key={lc.url} />
				))}
			<EditorCreator />
			{props.children}
		</LeafMap>
	)
})

const MapLayer = observer(function MapLayer(props: {
	layerConfig: LayerConfig
}) {
	const { layerConfig } = props

	const layerState = useMobx().layerStates.getByUrl(layerConfig.url)

	if (!layerState) return null

	const features = values(layerState.featuresById)

	return (
		<>
			{features.map((feature) => {
				const geometry = feature.data as FeatureGeometry // TODO
				return (
					<EditableFeature
						layerUrl={layerConfig.url}
						featureId={feature.id}
						geometry={geometry}
						key={feature.id}
					/>
				)
			})}
		</>
	)
})
