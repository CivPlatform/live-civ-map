import { useState } from 'react'
import {
	BrowserRouter as Router,
	Route,
	Routes,
	useParams,
} from 'react-router-dom'
import './App.css'
import { FeaturesSelectList } from './components/FeaturesSelectList'
import { Float } from './components/Float'
import { Omnibox } from './components/Omnibox'
import { Popup } from './components/Popup'
import { LayerAuthOverlays } from './DiscordAuthOverlay'
import { CivMap } from './map/CivMap'
import { Feature } from './model/Feature'
import { FeatureEditPage } from './pages/FeatureEditPage'
import { FeatureInfoPage } from './pages/FeatureInfoPage'
import { LayerFeaturesPage } from './pages/LayerFeaturesPage'
import { LayerPage } from './pages/LayerPage'
import { LayersPage } from './pages/LayersPage'

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
			</Router>
			<LayerAuthOverlays />
			<BetaOverlay />
		</div>
	)
}

export function HomePage() {
	return <LayersPage />
}

export function SearchPage() {
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
				fmtRow={(feature, layerUrl) => (
					<>
						[Feature name]
						<br />
						<span
							style={{ paddingLeft: '1em', fontSize: '.5em', opacity: 0.5 }}
						>
							in {layerUrl}
						</span>
					</>
				)}
			/>
		</Float>
	)
}

function BetaOverlay() {
	const [closed, setClosed] = useState(false)
	if (closed) return null
	return (
		<Popup onClose={() => setClosed(true)}>
			<h2>This is an early work-in-progress.</h2>
			<p>
				Things look bad, have bugs, everything is public, and your data may be
				lost or corrupted.
			</p>
			<button autoFocus onClick={() => setClosed(true)}>
				I will not use this for anything important
			</button>
		</Popup>
	)
}
