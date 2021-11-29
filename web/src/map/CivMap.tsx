import { EditableFeature, FeatureGeometry } from '../features'
import { Layer, useLayers } from '../state/Layer'
import { useLayerState } from '../state/LayerState'
import { EditorCreator } from './EditorCreator'
import LeafMap, { LeafMapProps } from './LeafMap'

export function CivMap(props: LeafMapProps) {
	const [layers] = useLayers()

	return (
		<LeafMap {...props}>
			{layers.map((l) => (
				<MapLayer layer={l} key={l.url} />
			))}
			<EditorCreator />
			{props.children}
		</LeafMap>
	)
}

export function MapLayer(props: { layer: Layer }) {
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
