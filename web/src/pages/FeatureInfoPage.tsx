import { Link, useParams } from 'react-router-dom'
import { layerUrlFromSlug } from '.'
import { Float } from '../components/Float'
import { useFeatureInLayer } from '../state/LayerState'

export function FeatureInfoPage() {
	const { layerSlug, featureId } = useParams()
	const layerUrl = layerUrlFromSlug(layerSlug!)
	const { feature } = useFeatureInLayer(layerUrl, featureId!)
	if (!feature) {
		return (
			<Float>
				<div style={{ padding: '8px 16px' }}>Feature not loaded</div>
				<Link to={`/layer/${layerSlug}`} style={{ padding: '8px 16px' }}>
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
			<Link to={`/layer/${layerSlug}`} style={{ padding: '8px 16px' }}>
				in Layer {layerUrl}
			</Link>
			<Link
				to={`/layer/${layerSlug}/feature/${featureId}/edit`}
				style={{ padding: '8px 16px' }}
			>
				Edit
			</Link>
			<div style={{ padding: '8px 16px' }}>{JSON.stringify(feature.data)}</div>
		</Float>
	)
}
