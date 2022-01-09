import { values } from 'mobx'
import { observer } from 'mobx-react-lite'
import { EditableFeature, FeatureGeometry } from '../features'
import { useMobx } from '../model'
import { EditorCreator } from './EditorCreator'
import LeafMap, { LeafMapProps } from './LeafMap'

export const CivMap = observer(function CivMap(props: LeafMapProps) {
	const layerConfigs = useMobx().layerConfigs.getAllLayers()
	// TODO show temp layer from url

	return (
		<LeafMap {...props}>
			{layerConfigs
				.filter((lc) => !lc.hidden)
				.map((lc) => (
					<MapLayer layerUrl={lc.url} key={lc.url} />
				))}
			<EditorCreator />
			{props.children}
		</LeafMap>
	)
})

const MapLayer = observer(function MapLayer(props: { layerUrl: string }) {
	const { layerUrl } = props

	const layerState = useMobx().layerStates.getByUrl(layerUrl)

	if (!layerState) return null

	const features = values(layerState.featuresById)

	return (
		<>
			{features.map((feature) => {
				const geometry = feature.data as FeatureGeometry // TODO
				return (
					<EditableFeature
						layerUrl={layerUrl}
						featureId={feature.id}
						geometry={geometry}
						key={feature.id}
					/>
				)
			})}
		</>
	)
})
