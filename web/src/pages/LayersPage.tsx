import { observer } from 'mobx-react-lite'
import { Link } from 'react-router-dom'
import { layerSlugFromUrl } from '.'
import { Float } from '../components/Float'
import { useMobx } from '../model'
import { LayerConfigStore } from '../model/LayerConfig'

export const LayersPage = observer(function LayersPage() {
	const layerConfigs = useMobx().layerConfigs

	const byServer: Record<string, LayerConfigStore[]> = {}
	for (const lc of layerConfigs.layers) {
		const bs = byServer[lc.url] || (byServer[lc.url] = [])
		bs.push(lc)
	}
	const servers = Object.values(byServer)
	servers.sort((a, b) =>
		a[0].url.toLowerCase().localeCompare(b[0].url.toLowerCase())
	)

	// TODO sorted by last used, constant order while tab open

	return (
		<Float>
			<div style={{ padding: '8px 16px' }}>Layers</div>
			<button
				onClick={() => {
					const url = prompt('Enter Layer URL')
					if (!url?.match(/^wss?:\/\/.+\..+/)) {
						alert('Invalid URL. No layer created.')
					} else if (layerConfigs.getLayer(url)) {
						alert('Layer is already on the map.')
					} else {
						layerConfigs.rememberLayer(url)
					}
				}}
				style={{ padding: '8px 16px' }}
			>
				Import Layer from URL ...
			</button>
			{servers.map((layers) => (
				<div key={layers[0].url}>
					<div style={{ display: 'flex', flexDirection: 'row' }}>
						{new URL(layers[0].url).host}
					</div>
					{layers.map((layerConfig) => (
						<div
							style={{ display: 'flex', flexDirection: 'row' }}
							key={layerConfig.url}
						>
							<Link
								to={`/layer/${layerSlugFromUrl(layerConfig.url)}`}
								style={{ padding: 8, paddingLeft: 16, flex: 1 }}
							>
								{new URL(layerConfig.url).pathname.substr(1)}
							</Link>
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
