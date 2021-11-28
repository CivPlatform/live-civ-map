import {
	BrowserRouter as Router,
	Link,
	Route,
	Routes,
	useParams,
} from 'react-router-dom'
import { useSetRecoilState } from 'recoil'
import './App.css'
import { Omnibox } from './components/Omnibox'
import { DiscordUserIcon, DiscordUserRow } from './LoginMenu'
import { CivMap } from './map/CivMap'
import { createdFeatureTypeRecoil } from './map/EditorCreator'
import { useLayers } from './state/Layer'

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
	return (
		<Panel>
			<div style={{ padding: 16 }}>Search {query}</div>
		</Panel>
	)
}

function LayersPage() {
	const [layers] = useLayers()
	return (
		<Float>
			<div style={{ padding: '8px 16px' }}>Layers</div>
			{layers.map(({ url }) => {
				return (
					<Link
						style={{ padding: '8px 16px' }}
						to={`/layer/${layerSlugFromUrl(url)}`}
					>
						{layerSlugFromUrl(url)}
					</Link>
				)
			})}
		</Float>
	)
}

function LayerPage() {
	const { layerSlug } = useParams()
	return (
		<Float>
			<div style={{ padding: 16 }}>Layer {layerSlug}</div>
		</Float>
	)
}

function LayerFeaturesPage() {
	const { layerSlug } = useParams()
	return (
		<Float>
			<div style={{ padding: 16 }}>LayerFeatures {layerSlug}</div>
		</Float>
	)
}

function FeatureInfoPage() {
	const { layerSlug, featureId } = useParams()
	return (
		<Float>
			<div style={{ padding: 16 }}>
				FeatureInfo {layerSlug} {featureId}
			</div>
		</Float>
	)
}

function FeatureEditPage() {
	const { layerSlug, featureId } = useParams()
	return (
		<Float>
			<div style={{ padding: 16 }}>
				FeatureEdit {layerSlug} {featureId}
			</div>
		</Float>
	)
}

const layerSlugFromUrl = (url: string) =>
	url.replace(/^wss:\/\//, '').replaceAll('/', '_')
const layerUrlFromSlug = (slug: string) =>
	slug.includes('://') ? slug : 'wss://' + slug

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

function Panel(props: { children?: React.ReactNode }) {
	return (
		<div
			style={{
				zIndex: 1000,
				position: 'absolute',
				left: 0,
				top: 0,
				paddingTop: 48,
				maxWidth: 300,
				minWidth: 300,
				display: 'flex',
				flexDirection: 'column',
				backgroundColor: 'white',
			}}
		>
			{props.children}
		</div>
	)
}

function Menu() {
	const setCreatedFeatureType = useSetRecoilState(createdFeatureTypeRecoil)

	return (
		<div className="App-Menu" style={{ zIndex: 1000 }}>
			<div>
				<span style={{ textAlign: 'center' }}>{':)'}</span>
				<span>Menu</span>
			</div>
			<div onClick={() => setCreatedFeatureType('marker')}>
				<span style={{ textAlign: 'center' }}>+</span>
				<span>Create Marker</span>
			</div>
			<div onClick={() => setCreatedFeatureType('line')}>
				<span style={{ textAlign: 'center' }}>+</span>
				<span>Create Line</span>
			</div>
			<div onClick={() => setCreatedFeatureType('polygon')}>
				<span style={{ textAlign: 'center' }}>+</span>
				<span>Create Polygon</span>
			</div>
			<div onClick={() => setCreatedFeatureType('rectangle')}>
				<span style={{ textAlign: 'center' }}>+</span>
				<span>Create Rectangle</span>
			</div>
			<div onClick={() => setCreatedFeatureType('map_image')}>
				<span style={{ textAlign: 'center' }}>+</span>
				<span>Overlay Image on Map</span>
			</div>
			<div style={{ opacity: 0.5 }}>
				<span style={{ textAlign: 'center' }}>+</span>
				<span>Create Circle</span>
			</div>
			{/* <div className="App-Menu-Spacer" style={{ flex: 1, minHeight: '1em' }} /> */}
			<DiscordUserRow />
		</div>
	)
}
