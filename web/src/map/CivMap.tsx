import { EditableFeature, FeatureGeometry } from '../features'
import { Layer, useLayers } from '../state/Layer'
import { useLayerState, useUpdateFeature } from '../state/LayerState'
import { EditorCreator } from './EditorCreator'
import LeafMap, { LeafMapProps } from './LeafMap'

export function CivMap(props: LeafMapProps) {
	const [layers] = useLayers()

	const editorLayer = layers[0] // XXX

	return (
		<LeafMap {...props}>
			{layers.map((l) => (
				<MapLayer layer={l} key={l.url} />
			))}
			<EditorCreator layer={editorLayer} />
			{props.children}
		</LeafMap>
	)
}

export function MapLayer(props: { layer: Layer }) {
	const { layer } = props

	const [layerState] = useLayerState(layer.url)

	const updateFeature = useUpdateFeature(layer.url)
	if (!layerState) return null

	// TODO perf: use recoil selector
	const features = Object.values(layerState.featuresById)

	return (
		<>
			{features.map((feature) => {
				const geometry = feature.data as FeatureGeometry // TODO
				return (
					<EditableFeature
						featureId={feature.id}
						geometry={geometry}
						updateFeature={updateFeature}
						key={feature.id}
					/>
				)
			})}
		</>
	)
}
