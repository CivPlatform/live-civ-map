import { observer } from 'mobx-react-lite'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getLayerNameFromUrl, layerUrlFromSlug } from '.'
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
	const layerConfig = layerConfigs.getLayer(layerUrl)
	const layerState = useMobx().layerStates.getByUrl(layerUrl)
	return (
		<Float>
			<div style={{ padding: '8px 16px' }}>
				<span style={{ opacity: 0.6 }}>Layer</span>{' '}
				{getLayerNameFromUrl(layerUrl)}{' '}
				{layerConfig?.alias && '("' + layerConfig?.alias + '")'} [Rename]
				<br />
				<span style={{ fontSize: 10, opacity: 0.6 }}>{layerUrl}</span>
			</div>
			{!layerConfig && (
				<div style={{ display: 'flex', alignItems: 'center' }}>
					<span style={{ padding: '8px 16px', flex: 1 }}>
						This is a preview
					</span>
					<button
						onClick={() => layerConfigs.addLayer(layerUrl)}
						style={{ padding: '8px 16px' }}
					>
						Add to my layers
					</button>
				</div>
			)}
			<button
				// TODO show/hide temporary layer without persistent layerConfig
				onClick={() => layerConfigs.toggleLayerHidden(layerUrl)}
				style={{ padding: '8px 16px' }}
			>
				{layerConfig?.hidden ? 'Show' : 'Hide'} Layer
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
			{layerConfig && (
				<button
					onClick={() => {
						const ok = window.confirm(`Forget layer? ${layerUrl}`)
						if (!ok) return
						layerConfigs.forgetLayer(layerUrl)
						navigate(`/layers`)
					}}
					style={{ padding: '8px 16px' }}
				>
					Forget Layer
				</button>
			)}
		</Float>
	)
})
