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
import { FeatureEditRoute } from './pages/FeatureEditPage'
import { FeatureInfoRoute } from './pages/FeatureInfoPage'
import { LayerFeaturesRoute } from './pages/LayerFeaturesPage'
import { LayerRoute } from './pages/LayerPage'
import { LayersPage, LayersRoute } from './pages/LayersPage'

export function App() {
	return (
		<div className="App">
			<Router>
				<CivMap height="100vh" />
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/search/:query" element={<SearchPage />} />
					<LayersRoute />
					<LayerRoute />
					<LayerFeaturesRoute />
					<FeatureInfoRoute />
					<FeatureEditRoute />
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
