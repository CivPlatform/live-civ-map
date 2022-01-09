import { observer } from 'mobx-react-lite'
import { Link, useNavigate } from 'react-router-dom'
import {
	defaultLayerServer,
	getLayerHostFromUrl,
	getLayerNameFromUrl,
	layerSlugFromUrl,
} from '.'
import { CircleIcon } from '../components/CircleIcon'
import { Float } from '../components/Float'
import { useMobx } from '../model'
import { LayerConfigStore } from '../model/LayerConfig'
import { getDefaultLayerColor } from '../model/LayerState'

export const LayersPage = observer(function LayersPage() {
	const navigate = useNavigate()
	const { layerConfigs, layerStates } = useMobx()

	const byServer: Record<string, LayerConfigStore[]> = {}
	for (const lc of layerConfigs.getAllLayers()) {
		const host = getLayerHostFromUrl(lc.url)
		const bs = byServer[host] || (byServer[host] = [])
		bs.push(lc)
	}
	const servers = Object.values(byServer)
	servers.sort((a, b) =>
		a[0].url.toLowerCase().localeCompare(b[0].url.toLowerCase())
	)

	// TODO sorted by last used, constant order while tab open, newly added layers at the top

	return (
		<Float>
			<div style={{ padding: '8px 16px' }}>Layers</div>
			<input
				type="text"
				placeholder="Create Layer"
				style={{ width: '100%' }}
				onChange={({ target: { value, style } }) => {
					if (!value) {
						style.backgroundColor = 'white'
					} else if (value.match(/^wss?:\/\//) || value.match(/^[^$/?#]+$/)) {
						style.backgroundColor = '#aaffaa'
					} else {
						style.backgroundColor = '#ffaaaa'
					}
				}}
				onKeyDown={(e: any) => {
					if (e.key === 'Enter') {
						let url: string = e.target.value
						if (url.match(/^wss?:\/\//)) {
							if (!url.match(/^wss?:\/\/.+\/.+/))
								return alert('Invalid layer URL: Path must not be empty')
						} else if (url.match(/^https?:\/\//)) {
							if (!url.match(/^https?:\/\/.+\/.+/))
								return alert('Invalid layer URL: Path must not be empty')
							if (!url.match(/.json$/))
								return alert('Invalid layer URL: must end with .json')
						} else if (url.match(/^[A-Za-z0-9_]+:\/\/\S+/)) {
							return alert(
								'Invalid layer URL: Must be WebSocket. ' +
									'Example: "wss://example.com/layer_name"'
							)
						} else {
							const layerName = url
							// either path name, or malformed
							if (!layerName.match(/^[^$/?#]+$/))
								return alert('Invalid layer name: Must not include $/?#')
							url = defaultLayerServer + layerName
						}
						layerConfigs.addLayer(url)
						navigate(`/layer/${layerSlugFromUrl(url)}`)
						e.target.value = ''
						e.target.style.backgroundColor = 'white'
					}
				}}
			/>
			{servers.map((layers) => (
				<div key={layers[0].url}>
					<div style={{ display: 'flex', flexDirection: 'row' }}>
						{getLayerHostFromUrl(layers[0].url)}
					</div>
					{layers.map((layerConfig) => (
						<div
							style={{
								display: 'flex',
								flexDirection: 'row',
								alignItems: 'center',
							}}
							key={layerConfig.url}
						>
							<Link
								to={`/layer/${layerSlugFromUrl(layerConfig.url)}`}
								style={{ padding: 8, paddingLeft: 16, flex: 1 }}
							>
								{getLayerNameFromUrl(layerConfig.url)}
							</Link>
							<CircleIcon
								size="1.5em"
								color={getDefaultLayerColor(layerConfig.url)}
								style={{ display: 'flex', justifyContent: 'center' }}
								title="Default color and number of features in this layer"
							>
								{layerStates.getByUrl(layerConfig.url)?.numFeatures}
							</CircleIcon>
							<button
								title={
									layerConfig.hidden
										? 'Make Layer visible'
										: 'Make Layer invisible'
								}
								onClick={() => layerConfigs.toggleLayerHidden(layerConfig.url)}
								style={{ padding: 8, border: 'none', backgroundColor: 'white' }}
							>
								{layerConfig.hidden ? '<Ø>' : '<O>'}
							</button>
						</div>
					))}
				</div>
			))}
		</Float>
	)
})
