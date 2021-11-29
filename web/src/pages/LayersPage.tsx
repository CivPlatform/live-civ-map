import { Link } from 'react-router-dom'
import { layerSlugFromUrl } from '.'
import { Float } from '../components/Float'
import { useLayerConfigs } from '../state/Layer'

export function LayersPage() {
	const [layerConfigs, setLayerConfigs] = useLayerConfigs()
	// TODO sorted by last used, constant order while tab open
	return (
		<Float>
			<div style={{ padding: '8px 16px' }}>Layers</div>
			<button
				onClick={() => {
					const url = prompt('Enter Layer URL')
					if (!url?.match(/^https?:\/\/.+\..+/)) {
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
				Create from URL...
			</button>
			{layerConfigs.map(({ url }) => (
				<div style={{ display: 'flex', flexDirection: 'row' }}>
					<Link
						to={`/layer/${layerSlugFromUrl(url)}`}
						style={{ padding: 8, paddingLeft: 16, flex: 1 }}
					>
						{layerSlugFromUrl(url)}
						{/* TODO show name; if local alias is set, show local alias, and show name as small muted text */}
					</Link>
					<button title="Toggle visible" style={{ padding: 8 }}>
						:eye:
					</button>
				</div>
			))}
		</Float>
	)
}
