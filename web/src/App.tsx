import { useSetRecoilState } from 'recoil'
import './App.css'
import { DiscordUserIcon as DiscordUserMenu } from './LoginMenu'
import { CivMap } from './map/CivMap'
import { createdFeatureTypeRecoil } from './map/EditorCreator'

export function App() {
	return (
		<div className="App">
			<CivMap height="100vh" />
			<Menu />
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
			<DiscordUserMenu />
		</div>
	)
}
