import { Link } from 'react-router-dom'
import { layerSlugFromUrl } from '.'
import { Float } from '../components/Float'
import { LayerConfig, useLayerConfigs } from '../state/Layer'

export function LayersPage() {
	const [layerConfigs, setLayerConfigs] = useLayerConfigs()
	const byServer: Record<string, LayerConfig[]> = {}
	for (const lc of layerConfigs) {
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
					} else if (layerConfigs.find((l) => l.url === url)) {
						alert('Layer is already on the map.')
					} else {
						const layerConfig = { url }
						setLayerConfigs([layerConfig, ...layerConfigs])
					}
				}}
				style={{ padding: '8px 16px' }}
			>
				Import Layer from URL ...
			</button>
			{servers.map((layers) => (
				<div>
					<div
						style={{ display: 'flex', flexDirection: 'row' }}
						key={layers[0].url}
					>
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
								onClick={() => {
									setLayerConfigs(
										layerConfigs.map((lc) =>
											lc.url === layerConfig.url
												? { ...lc, hidden: !lc.hidden }
												: lc
										)
									)
								}}
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
}
