import { observer } from 'mobx-react-lite'
import { Link, useNavigate } from 'react-router-dom'
import { layerSlugFromUrl } from '.'
import { Float } from '../components/Float'
import { useMobx } from '../model'
import { LayerConfigStore } from '../model/LayerConfig'

export const LayersPage = observer(function LayersPage() {
	const navigate = useNavigate()
	const layerConfigs = useMobx().layerConfigs

	const byServer: Record<string, LayerConfigStore[]> = {}
	for (const lc of layerConfigs.getAllLayers()) {
		const host = new URL(lc.url).host
		const bs = byServer[host] || (byServer[host] = [])
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
						if (!url.match(/^wss?:\/\//)) {
							// either path name, or malformed
							if (!url.match(/^[^$/?#]+$/))
								return alert('Invalid Layer URL. Must not include $/?#')
							url = 'wss://civmap.herokuapp.com/' + url
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
