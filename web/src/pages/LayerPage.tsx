import { observer } from 'mobx-react-lite'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { layerUrlFromSlug } from '.'
import { CreateFeatureMenuItem } from '../components/CreateFeatureMenu'
import { Float } from '../components/Float'
import { useMobx } from '../model'

export const LayerPage = observer(function LayerPage() {
	const navigate = useNavigate()
	const { layerSlug } = useParams()
	const layerUrl = layerUrlFromSlug(layerSlug!)
	const layerConfigs = useMobx().layerConfigs
	// TODO display if layerConfig not saved locally
	const layerConfig = layerConfigs.getLayer(layerUrl) || { url: layerUrl }
	const layerState = useMobx().layerStates.getByUrl(layerUrl)
	const numFeatures = Object.keys(layerState?.featuresById || {}).length
	return (
		<Float>
			<div style={{ padding: '8px 16px' }}>
				Layer {layerUrl} {layerConfig.alias} [Rename]
			</div>
			<button
				onClick={() => layerConfigs.toggleLayerHidden(layerUrl)}
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
					layerConfigs.forgetLayer(layerUrl)
					navigate(`/layers`)
				}}
				style={{ padding: '8px 16px' }}
			>
				Forget Layer
			</button>
		</Float>
	)
})
