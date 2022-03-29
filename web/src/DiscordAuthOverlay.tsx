import { observer } from 'mobx-react-lite'
import { useCallback } from 'react'
import { Popup } from './components/Popup'
import { useMobx } from './model'
import { prepareOAuthLoginUrl } from './model/DiscordLogin'

export const LayerAuthOverlays = observer(() => {
	const layerConfigs = useMobx().layerConfigs.getAllLayers()
	return (
		<>
			{layerConfigs.map((lc) => (
				<LayerAuthOverlay key={lc.url} layerUrl={lc.url} />
			))}
		</>
	)
})

const LayerAuthOverlay = observer(function LayerAuthOverlay(props: {
	layerUrl: string
}) {
	const { layerUrl } = props
	const layerState = useMobx().layerStates.getByUrl(layerUrl)

	const decline = useCallback(() => {
		// TODO properly interface with layer
		// TODO allow logging in later via button
		layerState!.loginDiscordAppId = undefined
	}, [layerState])

	const logIn = useCallback(() => {
		const url = prepareOAuthLoginUrl(
			layerState!.mapServer,
			layerState!.loginDiscordAppId!
		)
		document.open(url, '_blank')
	}, [layerState])

	if (!layerState) return null // not initialized
	if (layerState.dUser) return null // already logged in
	if (!layerState.loginDiscordAppId) return null // server has not offeret a log-in option (yet)

	return (
		<Popup onClose={decline}>
			<h2>Log in to use layer</h2>
			<p>To use this map layer, you must log in with Discord.</p>
			<p>
				<code>{layerUrl}</code>
			</p>
			<button autoFocus onClick={() => decline()}>
				Disable layer
			</button>
			<button autoFocus onClick={() => logIn()}>
				Log in
			</button>
		</Popup>
	)
})
