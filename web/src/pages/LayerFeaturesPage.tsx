import { values } from 'mobx'
import { observer } from 'mobx-react-lite'
import { Link, Route, useParams } from 'react-router-dom'
import { layerUrlFromSlug } from '.'
import { CreateFeatureMenuItem } from '../components/CreateFeatureMenu'
import { FeaturesSelectList } from '../components/FeaturesSelectList'
import { Float } from '../components/Float'
import { useMobx } from '../model'
import { mkLayerPath } from './LayerPage'

export const mkLayerFeaturesPath = (layerUrl: string) =>
	`${mkLayerPath(layerUrl)}/features`

export const LayerFeaturesRoute = () => (
	<Route
		path={mkLayerFeaturesPath(':layerSlug')}
		element={<LayerFeaturesPage />}
	/>
)

export const LayerFeaturesPage = observer(function LayerFeaturesPage() {
	const { layerSlug = '' } = useParams()
	const layerUrl = layerUrlFromSlug(layerSlug)
	const layer = useMobx().layerStates.getByUrl(layerUrl)
	// TODO handle layer not loaded
	const features = values(layer?.featuresById!)
	return (
		<Float>
			<Link to={mkLayerPath(layerUrl)} style={{ padding: '8px 16px' }}>
				Features in Layer {layerUrl}
			</Link>
			<CreateFeatureMenuItem layerUrl={layerUrl} />
			{!features.length && (
				<div
					style={{
						padding: 8,
						paddingLeft: 16,
						textAlign: 'center',
						opacity: 0.5,
					}}
				>
					No features in this layer.
				</div>
			)}
			<FeaturesSelectList
				features={features.map((feature) => ({ feature, layerUrl }))}
				fmtRow={(feature) => <>[Feature name]</>}
			/>
		</Float>
	)
})
