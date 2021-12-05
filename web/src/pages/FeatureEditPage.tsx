import { observer } from 'mobx-react-lite'
import { useNavigate, useParams } from 'react-router'
import { Link } from 'react-router-dom'
import { layerUrlFromSlug } from '.'
import { Float } from '../components/Float'
import { useMobx } from '../model'

export const FeatureEditPage = observer(function FeatureEditPage() {
	const navigate = useNavigate()
	const { layerSlug, featureId } = useParams()
	const layerUrl = layerUrlFromSlug(layerSlug!)

	const layer = useMobx().layerStates.getByUrl(layerUrl)

	const feature = layer?.featuresById?.get(featureId!)
	const updateFeature = layer?.updateFeature?.bind(layer)
	const deleteFeature = () => layer?.deleteFeature?.(feature!)

	if (!feature || !updateFeature || !deleteFeature) {
		return (
			<Float>
				<div style={{ padding: '8px 16px' }}>Feature not loaded</div>
				<Link to={`/layer/${layerSlug}`} style={{ padding: '8px 16px' }}>
					Go to Layer {layerUrl}
				</Link>
			</Float>
		)
	}

	if (0) updateFeature(feature!) // XXX use in Data Editor

	return (
		<Float>
			<div style={{ display: 'flex', flexDirection: 'row' }}>
				<div style={{ padding: '8px 16px', flex: 1 }}>Editing Feature</div>
				<Link
					to={`/layer/${layerSlug}/feature/${feature.id}`}
					style={{ padding: '8px 16px' }}
				>
					Stop editing
				</Link>
			</div>
			<button onClick={() => 0 /* TODO */} style={{ padding: '8px 16px' }}>
				Move/Clone to other Layer
			</button>
			<button
				onClick={() => {
					const ok = window.confirm(`Delete feature?`)
					if (!ok) return
					deleteFeature()
					navigate(`/layer/${layerSlug}/features`)
				}}
				style={{ padding: '8px 16px' }}
			>
				Delete feature
			</button>
			<div style={{ padding: '8px 16px' }}>
				Data Editor Here {JSON.stringify(feature.data)}
			</div>
		</Float>
	)
})
