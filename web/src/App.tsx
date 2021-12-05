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
import { DiscordUserIcon } from './LoginMenu'
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
				<DiscordUserIcon
					style={{
						zIndex: 1000,
						position: 'absolute',
						top: 8,
						right: 8,
						height: 32,
						width: 32,
						boxShadow: '0 0 8px black',
						backgroundColor: 'white',
						opacity: 1,
					}}
				/>
			</Router>
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
		<div
			style={{
				zIndex: 99999,
				position: 'absolute',
				top: 0,
				right: 0,
				bottom: 0,
				left: 0,
				padding: '1em',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				backgroundColor: 'rgba(0,0,0, 0.5)',
			}}
		>
			<div style={{ maxWidth: 400, padding: '2em', backgroundColor: 'white' }}>
				<h2>This is an early work-in-progress.</h2>
				<p>
					{' '}
					Things look bad, have bugs, and might destroy/publish/corrupt your
					data if you input it.
				</p>
				<button autoFocus onClick={() => setClosed(true)}>
					I will not use it for anything important
				</button>
			</div>
		</div>
	)
}
