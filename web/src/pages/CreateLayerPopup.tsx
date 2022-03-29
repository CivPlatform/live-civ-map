import { Popup } from '../components/Popup'

export function CreateLayerPopup(props: { onClose?: () => void }) {
	return (
		<Popup
			onClose={props.onClose}
			style={{
				display: 'flex',
				flexDirection: 'row',
				flexWrap: 'wrap',
				width: 600,
				maxWidth: '50%',
			}}
		>
			<div style={{ flex: 1, minWidth: 160, width: '30%', maxWidth: '80vw' }}>
				<h3>Create local Layer</h3>
				<p>stored in your browser</p>
				<input type="text" placeholder="Layer name" style={{ width: '100%' }} />
			</div>
			<div style={{ flex: 1, minWidth: 160, width: '30%', maxWidth: '80vw' }}>
				<h3>Create shared Layer</h3>
				<p>Select a Map Server:</p>
				<select>
					<option selected>Default</option>
				</select>
				<input type="text" placeholder="Layer name" style={{ width: '100%' }} />
			</div>
			<div style={{ flex: 1, minWidth: 160, width: '30%', maxWidth: '80vw' }}>
				<h3>Import Layer</h3>
				<p>
					from <code>wss://</code> or <code>https://...json</code> URL
				</p>
				<input
					type="text"
					placeholder="wss://example.com/layer-name"
					style={{ width: '100%' }}
				/>
			</div>
		</Popup>
	)
}
