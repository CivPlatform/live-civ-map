import { Link, useNavigate, useParams } from 'react-router-dom'
import { layerUrlFromSlug } from '.'
import { CreateFeatureMenuItem } from '../components/CreateFeatureMenu'
import { Float } from '../components/Float'

export function LayerPage() {
	const navigate = useNavigate()
	const { layerSlug } = useParams()
	const layerUrl = layerUrlFromSlug(layerSlug!)
	const [layerConfig, setLayerConfig] = useLayerConfig(layerUrl)
	const [layerState] = useLayerState(layerUrl)
	// TODO handle layer not loaded
	const numFeatures = Object.keys(layerState?.featuresById || {}).length
	return (
		<Float>
			<div style={{ padding: '8px 16px' }}>
				Layer {layerUrl} {layerConfig.alias} [Rename]
			</div>
			<button
				onClick={() =>
					setLayerConfig({ ...layerConfig, hidden: !layerConfig.hidden })
				}
				style={{ padding: '8px 16px' }}
			>
				{layerConfig.hidden ? 'Show' : 'Hide'} Layer
			</button>
			<CreateFeatureMenuItem layerUrl={layerUrl} />
			<Link to={`/layer/${layerSlug}/features`} style={{ padding: '8px 16px' }}>
				Show all {numFeatures} features
			</Link>
			<button
				onClick={() => {
					const ok = window.confirm(`Delete layer? ${layerUrl}`)
					if (!ok) return
					setLayerConfig(null)
					navigate(`/layers`)
				}}
				style={{ padding: '8px 16px' }}
			>
				Forget Layer
			</button>
		</Float>
	)
}
