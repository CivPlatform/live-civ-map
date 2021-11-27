import useLocalStorage from '@rehooks/local-storage'
import { useState } from 'react'
import './App.css'
import { DiscordUserIcon as DiscordUserMenu } from './LoginMenu'
import { FeaturesMap } from './map/FeaturesMap'
import { Layer } from './map/Layer'

function App() {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let [layers, setLayers] = useLocalStorage<Layer[]>('LiveCivMap:layers')
	if (!layers) layers = [{ url: 'ws://localhost:5000/' }]

	const [createdFeatureType, setCreatedFeatureType] = useState<string | null>(
		null
	)

	return (
		<div className="App">
			<FeaturesMap
				layers={layers}
				controls={{}}
				createdFeatureType={createdFeatureType}
				setCreatedFeatureType={setCreatedFeatureType}
				height="100vh"
			></FeaturesMap>
			<Menu setCreatedFeatureType={setCreatedFeatureType} />
		</div>
	)
}

export default App

function Menu(props: {
	setCreatedFeatureType: (state: string | null) => void
}) {
	return (
		<div className="App-Menu" style={{ zIndex: 1000 }}>
			<div>
				<span style={{ textAlign: 'center' }}>{':)'}</span>
				<span>Menu</span>
			</div>
			<div onClick={() => props.setCreatedFeatureType('marker')}>
				<span style={{ textAlign: 'center' }}>+</span>
				<span>Create Marker</span>
			</div>
			<div onClick={() => props.setCreatedFeatureType('line')}>
				<span style={{ textAlign: 'center' }}>+</span>
				<span>Create Line</span>
			</div>
			<div onClick={() => props.setCreatedFeatureType('polygon')}>
				<span style={{ textAlign: 'center' }}>+</span>
				<span>Create Polygon</span>
			</div>
			<div onClick={() => props.setCreatedFeatureType('rectangle')}>
				<span style={{ textAlign: 'center' }}>+</span>
				<span>Create Rectangle</span>
			</div>
			<div onClick={() => props.setCreatedFeatureType('map_image')}>
				<span style={{ textAlign: 'center' }}>+</span>
				<span>Overlay Image on Map</span>
			</div>
			<div style={{ opacity: 0.5 }}>
				<span style={{ textAlign: 'center' }}>+</span>
				<span>Create Circle</span>
			</div>
			{/* <div className="App-Menu-Spacer" style={{ flex: 1, minHeight: '1em' }} /> */}
			<DiscordUserMenu />
		</div>
	)
}
