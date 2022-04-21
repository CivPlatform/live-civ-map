import { observer } from 'mobx-react-lite'
import { Link, Route, useParams } from 'react-router-dom'
import { featureIdFromSlug, featureSlugFromId, layerUrlFromSlug } from '.'
import { Float } from '../components/Float'
import { useMobx } from '../model'
import { mkFeatureEditPath } from './FeatureEditPage'
import { mkLayerPath } from './LayerPage'

export const mkFeaturePath = (layerUrl: string, featureId: string) =>
	`${mkLayerPath(layerUrl)}/feature/${featureSlugFromId(featureId)}`

export const mkFeatureInfoPath = mkFeaturePath

export const FeatureInfoRoute = () => (
	<Route
		path={mkFeatureInfoPath(':layerSlug', ':featureSlug')}
		element={<FeatureInfoPage />}
	/>
)

export const FeatureInfoPage = observer(function FeatureInfoPage() {
	const { layerSlug = '', featureSlug = '' } = useParams()
	const layerUrl = layerUrlFromSlug(layerSlug)
	const featureId = featureIdFromSlug(featureSlug)

	const layer = useMobx().layerStates.getByUrl(layerUrl)
	const feature = layer?.featuresById?.get(featureId)

	if (!feature) {
		return (
			<Float>
				<div style={{ padding: '8px 16px' }}>Feature not loaded</div>
				<Link to={mkLayerPath(layerUrl)} style={{ padding: '8px 16px' }}>
					Go to Layer {layerUrl}
				</Link>
			</Float>
		)
	}
	return (
		<Float>
			<div style={{ padding: '8px 16px' }}>Feature [name]</div>
			<button onClick={() => 0 /* TODO */} style={{ padding: '8px 16px' }}>
				Show on map
			</button>
			<Link to={mkLayerPath(layerUrl)} style={{ padding: '8px 16px' }}>
				in Layer {layerUrl}
			</Link>
			<Link
				to={mkFeatureEditPath(layerUrl, featureId)}
				style={{ padding: '8px 16px' }}
			>
				Edit
			</Link>
			<div style={{ padding: '8px 16px' }}>{JSON.stringify(feature.data)}</div>
		</Float>
	)
})
