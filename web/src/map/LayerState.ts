import { useCallback } from 'react'
import { atomFamily, useRecoilState } from 'recoil'
import { v4 as randomUUID } from 'uuid'
import { DiscordUser, useDiscordToken } from '../DiscordLogin'
import { WSClient } from '../ws'
import { Feature } from './Feature'

export interface LayerState {
	url: string
	featuresById: Record<string, Feature>
}

export function useLayerState(url: string) {
	const token = useDiscordToken()
	return useRecoilState(layerStateRecoil([url, token]))
}

export const makeFeatureId = () => randomUUID()

export function useUpdateFeature(url: string) {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [layerState, setLayerState] = useLayerState(url)

	return useCallback(
		(feature: Feature & { id?: Feature['id'] }): Feature => {
			if (!feature.id) feature = { ...feature, id: makeFeatureId() }
			setLayerState((layerState) => {
				const featuresById = {
					...layerState.featuresById,
					[feature.id]: feature,
				}
				return { ...layerState, featuresById }
			})
			return feature
		},
		[setLayerState]
	)
}

export const layerStateRecoil = atomFamily<
	LayerState,
	[string, string | undefined]
>({
	key: 'layer',
	default: ([url, token]) => ({ url, featuresById: {} }),
	effects_UNSTABLE: ([url, token]) => [
		({ setSelf, onSet }) => {
			if (!token) return

			let layerCurrent: LayerState = { url, featuresById: {} }

			const wsc = new WSClient<WSServerMessage, WSClientMessage>({
				url,
				token,
				onMessage: (msg) => {
					switch (msg.type) {
						case 'map:feature': {
							const { feature } = msg
							const featuresById = {
								...layerCurrent.featuresById,
								[feature.id]: feature,
							}
							setSelf((layerCurrent = { ...layerCurrent, featuresById }))
							return
						}
						case 'map:state': {
							const { features } = msg
							const featuresById: LayerState['featuresById'] = {}
							features.forEach((f) => (featuresById[f.id] = f))
							setSelf((layerCurrent = { ...layerCurrent, featuresById }))
							return
						}
					}
				},
			})

			setSelf(layerCurrent)

			onSet((layerNew) => {
				Object.values(layerNew.featuresById)
					.filter((f) => layerCurrent.featuresById[f.id] !== f)
					.forEach((feature) => {
						wsc.send({ type: 'map:feature', feature })
					})
				// TODO delete features in old that are missing from new
				layerCurrent = layerNew
			})

			return () => wsc.close()
		},
	],
})

export type WSClientMessage =
	| { type: 'map:deleteFeature'; id: Feature['id'] }
	| WSRelayedMessage

export type WSRelayedMessage = { type: 'map:feature'; feature: Feature }

export type WSServerMessage =
	| WSRelayedMessage
	| { type: 'map:state'; features: Feature[] }
	| { type: 'user:list'; users: DiscordUser[] }
	| { type: 'user:join'; user: DiscordUser }
