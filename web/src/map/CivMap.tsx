import { EditableFeature, FeatureGeometry } from '../features'
import { LayerConfig, useLayerConfigs } from '../state/Layer'
import { useLayerState } from '../state/LayerState'
import { EditorCreator } from './EditorCreator'
import LeafMap, { LeafMapProps } from './LeafMap'

export function CivMap(props: LeafMapProps) {
	const [layers] = useLayerConfigs()
	// TODO show temp layer from url

	return (
		<LeafMap {...props}>
			{layers
				.filter((l) => !l.hidden)
				.map((l) => (
					<MapLayer layer={l} key={l.url} />
				))}
			<EditorCreator />
			{props.children}
		</LeafMap>
	)
}

export function MapLayer(props: { layer: LayerConfig }) {
	const { layer } = props

	const [layerState] = useLayerState(layer.url)

	if (!layerState) return null

	// TODO perf: use recoil selector
	const features = Object.values(layerState.featuresById)

	return (
		<>
			{features.map((feature) => {
				const geometry = feature.data as FeatureGeometry // TODO
				return (
					<EditableFeature
						layerUrl={layer.url}
						featureId={feature.id}
						geometry={geometry}
						key={feature.id}
					/>
				)
			})}
		</>
	)
}
