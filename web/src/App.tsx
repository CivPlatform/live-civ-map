import { useState } from 'react'
import {
	BrowserRouter as Router,
	Link,
	Route,
	Routes,
	useNavigate,
	useParams,
} from 'react-router-dom'
import './App.css'
import { CreateFeatureMenuItem } from './components/CreateFeatureMenu'
import { Omnibox } from './components/Omnibox'
import { DiscordUserIcon } from './LoginMenu'
import { CivMap } from './map/CivMap'
import { Feature } from './state/Feature'
import { useLayerConfig, useLayerConfigs } from './state/Layer'
import {
	useDeleteFeature,
	useFeatureInLayer,
	useLayerState,
	useUpdateFeature,
} from './state/LayerState'

export function App() {
	return (
		<div className="App">
			<Router>
				<CivMap height="100vh" />
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/search/:query" element={<SearchPage />} />
					<Route path="/layers" element={<LayersPage />} />
					<Route path="/layer/:layerSlug" element={<LayerPage />} />
					<Route
						path="/layer/:layerSlug/features"
						element={<LayerFeaturesPage />}
					/>
					<Route
						path="/layer/:layerSlug/feature/:featureId"
						element={<FeatureInfoPage />}
					/>
					<Route
						path="/layer/:layerSlug/feature/:featureId/edit"
						element={<FeatureEditPage />}
					/>
					<Route element={<HomePage />} />
				</Routes>
				<Omnibox />
				<DiscordUserIcon
					style={{
						zIndex: 1000,
						position: 'absolute',
						top: 8,
						right: 8,
						height: 32,
						width: 32,
						boxShadow: '0 0 8px black',
					}}
				/>
			</Router>
		</div>
	)
}

function HomePage() {
	return <LayersPage />
}

function SearchPage() {
	const { query } = useParams()
	const features: { layerUrl: string; feature: Feature }[] = [] // TODO search
	return (
		<Float>
			<div style={{ padding: '8px 16px' }}>Results for: {query}</div>
			{!features.length && (
				<div
					style={{
						padding: 8,
						paddingLeft: 16,
						textAlign: 'center',
						opacity: 0.5,
					}}
				>
					No results.
				</div>
			)}
			<FeaturesSelectList
				features={features}
				fmtRow={(feature) => (
					<>
						[Feature name]
						<br />
						<span style={{ fontSize: '.5em', opacity: 0.5 }}>
							in [layerUrl]
						</span>
					</>
				)}
			/>
		</Float>
	)
}

function LayersPage() {
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

function LayerPage() {
	const navigate = useNavigate()
	const { layerSlug } = useParams()
	const layerUrl = layerUrlFromSlug(layerSlug!)
	const [layerConfig, setLayerConfig] = useLayerConfig(layerUrl)
	const [layerState] = useLayerState(layerUrl)
	// TODO handle layer not loaded
	const numFeatures = Object.keys(layerState?.featuresById || {}).length
	return (
		<Float>
			<div style={{ padding: '8px 16px' }}>
				Layer {layerUrl} {layerConfig.alias} [Rename]
			</div>
			<button
				onClick={() =>
					setLayerConfig({ ...layerConfig, hidden: !layerConfig.hidden })
				}
				style={{ padding: '8px 16px' }}
			>
				{layerConfig.hidden ? 'Show' : 'Hide'} Layer
			</button>
			<CreateFeatureMenuItem layerUrl={layerUrl} />
			<Link to={`/layer/${layerSlug}/features`} style={{ padding: '8px 16px' }}>
				Show all {numFeatures} features
			</Link>
			<button
				onClick={() => {
					const ok = window.confirm(`Delete layer? ${layerUrl}`)
					if (!ok) return
					setLayerConfig(null)
					navigate(`/layers`)
				}}
				style={{ padding: '8px 16px' }}
			>
				Forget Layer
			</button>
		</Float>
	)
}

function LayerFeaturesPage() {
	const { layerSlug } = useParams()
	const layerUrl = layerUrlFromSlug(layerSlug!)
	const [layerState] = useLayerState(layerUrl)
	// TODO handle layer not loaded
	const features = Object.values(layerState?.featuresById || {})
	return (
		<Float>
			<div style={{ padding: '8px 16px' }}>Features in Layer {layerUrl}</div>
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
}

function FeatureInfoPage() {
	const { layerSlug, featureId } = useParams()
	const layerUrl = layerUrlFromSlug(layerSlug!)
	const [feature] = useFeatureInLayer(layerUrl, featureId!)
	if (!feature) {
		return (
			<Float>
				<div style={{ padding: '8px 16px' }}>Feature not loaded</div>
				<Link to={`/layer/${layerSlug}`} style={{ padding: '8px 16px' }}>
					Go to Layer {layerUrl}
				</Link>
			</Float>
		)
	}
	return (
		<Float>
			<div style={{ padding: '8px 16px' }}>Feature [name]</div>
			<button onClick={() => 0 /* TODO */} style={{ padding: '8px 16px' }}>
				Show on map
			</button>
			<Link to={`/layer/${layerSlug}`} style={{ padding: '8px 16px' }}>
				in Layer {layerUrl}
			</Link>
			<Link
				to={`/layer/${layerSlug}/feature/${featureId}/edit`}
				style={{ padding: '8px 16px' }}
			>
				Edit
			</Link>
			<div style={{ padding: '8px 16px' }}>{JSON.stringify(feature.data)}</div>
		</Float>
	)
}

function FeatureEditPage() {
	const navigate = useNavigate()
	const { layerSlug, featureId } = useParams()
	const layerUrl = layerUrlFromSlug(layerSlug!)
	const [feature] = useFeatureInLayer(layerUrl, featureId!)
	const updateFeature = useUpdateFeature(layerUrl)
	const deleteFeature = useDeleteFeature(layerUrl)

	if (false) updateFeature(feature!) // XXX use in Data Editor

	if (!feature) {
		return (
			<Float>
				<div style={{ padding: '8px 16px' }}>Feature not loaded</div>
				<Link to={`/layer/${layerSlug}`} style={{ padding: '8px 16px' }}>
					Go to Layer {layerUrl}
				</Link>
			</Float>
		)
	}
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
					deleteFeature(feature)
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
}

const layerSlugFromUrl = (url: string) =>
	url
		.replace(/^wss:\/\//, '')
		.replaceAll('/', '_')
		.replace(/[?#].*/, '')
const layerUrlFromSlug = (slug: string) =>
	(slug.includes(':__') ? slug : 'wss://' + slug).replaceAll('_', '/')

/** below omnibar. vertical */
function Float(props: { children?: React.ReactNode }) {
	return (
		<div
			style={{
				zIndex: 1000,
				position: 'absolute',
				left: 8,
				top: 56,
				maxWidth: 284,
				minWidth: 284,
				padding: '8px 0',
				boxSizing: 'border-box',
				display: 'flex',
				flexDirection: 'column',
				borderRadius: 4,
				backgroundColor: 'white',
				boxShadow: '0 0 4px gray',
			}}
		>
			{props.children}
		</div>
	)
}

function FeaturesSelectList(props: {
	features: { layerUrl: string; feature: Feature }[]
	fmtRow: (f: Feature, layerUrl: string) => React.ReactElement
}) {
	const { features, fmtRow } = props
	const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
	return (
		<>
			{features.map(({ layerUrl, feature }) => (
				<div style={{ display: 'flex', flexDirection: 'row' }}>
					<button
						onClick={() => {
							if (selectedFeatures.includes(feature.id)) {
								setSelectedFeatures((sel) =>
									sel.filter((id) => id !== feature.id)
								)
							} else {
								setSelectedFeatures((sel) => [...sel, feature.id])
							}
						}}
						title="Select"
						style={{ padding: 8 }}
					>
						{selectedFeatures.includes(feature.id) ? '[x]' : '[ ]'}
					</button>
					<Link
						to={`/layer/${layerSlugFromUrl(layerUrl)}/feature/${feature.id}`}
						style={{ padding: 8, paddingLeft: 16, flex: 1 }}
					>
						{fmtRow(feature, layerUrl)}
					</Link>
					<button
						onClick={() => 0 /* TODO */}
						title="Show on map"
						style={{ padding: 8 }}
					>
						:show:
					</button>
				</div>
			))}
			{selectedFeatures.length > 0 && (
				<div
					style={{
						display: 'flex',
						flexDirection: 'row',
						alignItems: 'center',
					}}
				>
					<span style={{ padding: 8, paddingLeft: 16 }}>
						Selected {selectedFeatures.length}:
					</span>
					<button
						onClick={() => 0 /* TODO */}
						style={{ padding: '8px 16px', flex: 1 }}
					>
						Move/Clone
					</button>
					<button
						onClick={() => 0 /* TODO */}
						style={{ padding: '8px 16px', flex: 1 }}
					>
						Delete
					</button>
				</div>
			)}
		</>
	)
}
