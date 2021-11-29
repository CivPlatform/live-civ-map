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
import { FeatureEditPage } from './pages/FeatureEditPage'
import { FeatureInfoPage } from './pages/FeatureInfoPage'
import { LayerFeaturesPage } from './pages/LayerFeaturesPage'
import { LayerPage } from './pages/LayerPage'
import { LayersPage } from './pages/LayersPage'
import { Feature } from './state/Feature'

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
