import useLocalStorage from '@rehooks/local-storage'
import './App.css'
import { DiscordUserIcon as DiscordUserMenu } from './LoginMenu'
import { FeaturesMap } from './map/FeaturesMap'
import { Layer } from './map/Layer'

function App() {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let [layers, setLayers] = useLocalStorage<Layer[]>('LiveCivMap:layers')
	if (!layers) layers = [{ url: 'ws://localhost:5000/' }]

	return (
		<div className="App">
			<FeaturesMap layers={layers} controls={{}} height="100vh" />
			<div className="App-Menu" style={{ zIndex: 1000 }}>
				<div>
					<img src="" alt="Logo" />
					<span>Menu</span>
				</div>
				<div style={{ flex: 1, minHeight: '1em' }} />
				<DiscordUserMenu />
			</div>
		</div>
	)
}

export default App
