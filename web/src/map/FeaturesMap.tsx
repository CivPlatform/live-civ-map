import { EditableFeature, FeatureGeometry } from '../features'
import { EditorCreator } from './EditorCreator'
import { Layer, useLayers } from './Layer'
import { useLayerState, useUpdateFeature } from './LayerState'
import LeafMap, { LeafMapProps } from './LeafMap'

export function FeaturesMap(props: LeafMapProps) {
	const [layers] = useLayers()

	const editorLayer = layers[0] // XXX

	return (
		<LeafMap {...props}>
			{layers.map((l) => (
				<EditableLayer layer={l} key={l.url} />
			))}
			<EditorCreator layer={editorLayer} />
			{props.children}
		</LeafMap>
	)
}

export function EditableLayer(props: { layer: Layer }) {
	const { layer } = props

	const [layerState] = useLayerState(layer.url)

	const updateFeature = useUpdateFeature(layer.url)

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
