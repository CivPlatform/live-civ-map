import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Link, Route } from 'react-router-dom'
import { getLayerHostFromUrl, getLayerNameFromUrl, layerSlugFromUrl } from '.'
import { CircleIcon } from '../components/CircleIcon'
import { Float } from '../components/Float'
import { useMobx } from '../model'
import { LayerConfigStore } from '../model/LayerConfig'
import { getDefaultLayerColor } from '../model/LayerState'
import { CreateLayerPopup } from './CreateLayerPopup'
import { mkLayerPath } from './LayerPage'

export const layersPath = `/layers`

export const LayersRoute = () => (
	<Route path={layersPath} element={<LayersPage />} />
)

export const LayersPage = observer(function LayersPage() {
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
			<CreateLayerButton />
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
								to={mkLayerPath(layerSlugFromUrl(layerConfig.url))}
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

function CreateLayerButton() {
	const [state, setState] = useState(false)
	return (
		<>
			<button onClick={() => setState(true)} style={{ padding: 8, flex: 1 }}>
				Create or import Layer ...
			</button>
			{state && <CreateLayerPopup onClose={() => setState(false)} />}
		</>
	)
}
