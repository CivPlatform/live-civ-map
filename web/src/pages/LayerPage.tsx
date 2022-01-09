import { observer } from 'mobx-react-lite'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { layerUrlFromSlug } from '.'
import { CircleIcon } from '../components/CircleIcon'
import { CreateFeatureMenuItem } from '../components/CreateFeatureMenu'
import { Float } from '../components/Float'
import { useMobx } from '../model'
import { getDefaultLayerColor } from '../model/LayerState'

export const LayerPage = observer(function LayerPage() {
	const navigate = useNavigate()
	const { layerSlug } = useParams()
	const layerUrl = layerUrlFromSlug(layerSlug!)
	const layerConfigs = useMobx().layerConfigs
	// TODO display if layerConfig not saved locally
	const layerConfig = layerConfigs.getLayer(layerUrl) || { url: layerUrl }
	const layerState = useMobx().layerStates.getByUrl(layerUrl)
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
			<Link
				is="button"
				to={`/layer/${layerSlug}/features`}
				style={{ padding: '8px 16px', display: 'flex', alignItems: 'center' }}
			>
				<span style={{ flex: 1 }}>
					Show all {layerState?.numFeatures} features
				</span>
				<CircleIcon
					size="1em"
					color={getDefaultLayerColor(layerUrl)}
					title="Default color of features in this layer"
				/>
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
