import { Link, useParams } from 'react-router-dom'
import { layerUrlFromSlug } from '.'
import { CreateFeatureMenuItem } from '../components/CreateFeatureMenu'
import { FeaturesSelectList } from '../components/FeaturesSelectList'
import { Float } from '../components/Float'

export function LayerFeaturesPage() {
	const { layerSlug } = useParams()
	const layerUrl = layerUrlFromSlug(layerSlug!)
	const [layerState] = useLayerState(layerUrl)
	// TODO handle layer not loaded
	const features = Object.values(layerState?.featuresById || {})
	return (
		<Float>
			<Link to={`/layer/${layerSlug}`} style={{ padding: '8px 16px' }}>
				Features in Layer {layerUrl}
			</Link>
			<CreateFeatureMenuItem layerUrl={layerUrl} />
			{!features.length && (
				<div
					style={{
						padding: 8,
						paddingLeft: 16,
						textAlign: 'center',
						opacity: 0.5,
					}}
				>
					No features in this layer.
				</div>
			)}
			<FeaturesSelectList
				features={features.map((feature) => ({ feature, layerUrl }))}
				fmtRow={(feature) => <>[Feature name]</>}
			/>
		</Float>
	)
}
