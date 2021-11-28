import { useCallback } from 'react'
import { atomFamily, useRecoilState } from 'recoil'
import { v4 as randomUUID } from 'uuid'
import {
	DiscordUser,
	useDiscordProfile,
	useDiscordToken,
} from '../DiscordLogin'
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

export type FeatureCreateDTO = Omit<
	Feature,
	'id' | 'creator_id' | 'created_ts' | 'last_editor_id' | 'last_edited_ts'
>

export type FeatureUpdateDTO = Omit<
	Feature,
	'creator_id' | 'created_ts' | 'last_editor_id' | 'last_edited_ts'
>

export function useCreateFeature(layerUrl: string) {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [_layerState, setLayerState] = useLayerState(layerUrl)

	const profile = useDiscordProfile()

	return useCallback(
		(featurePartial: FeatureCreateDTO) => {
			if (!profile) {
				console.error('Cannot create feature while logged out', featurePartial)
				return null
			}
			const id = makeFeatureId()
			setLayerState((layerState) => {
				const feature: Feature = {
					id,
					creator_id: profile.id,
					created_ts: Date.now(),
					last_editor_id: profile.id,
					last_edited_ts: Date.now(),
					data: featurePartial.data || {},
				}
				console.log('creating feature', feature)
				const featuresById = {
					...layerState.featuresById,
					[feature.id]: feature,
				}
				return { ...layerState, featuresById }
			})
			return id
		},
		[profile, setLayerState]
	)
}

export function useUpdateFeature(layerUrl: string) {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [_layerState, setLayerState] = useLayerState(layerUrl)

	const profile = useDiscordProfile()

	return useCallback(
		(featurePartial: FeatureUpdateDTO) => {
			if (!profile) {
				console.error('Cannot update feature while logged out', featurePartial)
				return
			}
			setLayerState((layerState) => {
				const existing = layerState.featuresById[featurePartial.id]
				const feature: Feature = {
					...existing,
					last_editor_id: profile.id,
					last_edited_ts: Date.now(),
					data: { ...existing.data, ...featurePartial.data },
				}
				console.log('updating feature', feature)
				const featuresById = {
					...layerState.featuresById,
					[feature.id]: feature,
				}
				return { ...layerState, featuresById }
			})
		},
		[profile, setLayerState]
	)
}

export const layerStateRecoil = atomFamily<
	LayerState,
	[string, string | undefined]
>({
	key: 'layerState',
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
						case 'feature:update': {
							const { feature } = msg
							const featuresById = {
								...layerCurrent.featuresById,
								[feature.id]: feature,
							}
							setSelf((layerCurrent = { ...layerCurrent, featuresById }))
							return
						}
						case 'feature:delete': {
							const { feature } = msg
							const featuresById = { ...layerCurrent.featuresById }
							delete featuresById[feature.id]
							setSelf((layerCurrent = { ...layerCurrent, featuresById }))
							return
						}
						case 'feature:all': {
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
						wsc.send({ type: 'feature:update', feature })
					})
				// TODO delete features in old that are missing from new
				layerCurrent = layerNew
			})

			return () => wsc.close()
		},
	],
})

export type WSRelayedMessage =
	| { type: 'feature:update'; feature: Feature }
	| { type: 'feature:delete'; feature: { id: Feature['id'] } & (Feature | {}) }

export type WSClientMessage = WSRelayedMessage

export type WSServerMessage =
	| WSRelayedMessage
	| { type: 'feature:all'; features: Feature[] }
	| { type: 'user:list'; users: DiscordUser[] }
	| { type: 'user:join'; user: DiscordUser }
