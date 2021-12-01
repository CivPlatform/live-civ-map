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

export function useLayerState(url: string | undefined | null) {
	const token = useDiscordToken()
	return useRecoilState(layerStateRecoil([url, token]))
}

export function useFeatureInLayer(
	layerUrl: string,
	featureId: string
): [Feature | undefined] {
	const [layerState] = useLayerState(layerUrl)
	return [layerState?.featuresById?.[featureId]]
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

export type FeatureDeleteDTO = Pick<Feature, 'id'>

export function useCreateFeature(layerUrl: string | undefined | null) {
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
				if (!layerState) return layerState
				const feature: Feature = {
					id,
					creator_id: profile.id,
					created_ts: Date.now(),
					last_editor_id: profile.id,
					last_edited_ts: Date.now(),
					data: featurePartial.data || {},
				}
				console.log('creating feature', feature)
				return setFeatureInLayerObject(layerState, feature)
			})
			return id
		},
		[profile, setLayerState]
	)
}

export function useUpdateFeature(layerUrl: string | undefined | null) {
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
				if (!layerState) return layerState
				const existing = layerState.featuresById[featurePartial.id]
				const feature: Feature = {
					...existing,
					last_editor_id: profile.id,
					last_edited_ts: Date.now(),
					data: { ...existing.data, ...featurePartial.data },
				}
				console.log('updating feature', feature)
				return setFeatureInLayerObject(layerState, feature)
			})
		},
		[profile, setLayerState]
	)
}

export function useDeleteFeature(layerUrl: string | undefined | null) {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [_layerState, setLayerState] = useLayerState(layerUrl)

	return useCallback(
		(feature: FeatureDeleteDTO) => {
			setLayerState((layerState) => {
				if (!layerState) return layerState
				console.log('deleting feature', feature)
				return deleteFeatureInLayerObject(layerState, feature)
			})
		},
		[setLayerState]
	)
}

function setFeatureInLayerObject(layer: LayerState, feature: Feature) {
	const featuresById = {
		...layer.featuresById,
		[feature.id]: feature,
	}
	return { ...layer, featuresById }
}

function deleteFeatureInLayerObject(
	layer: LayerState,
	feature: FeatureDeleteDTO
) {
	const featuresById = { ...layer.featuresById }
	delete featuresById[feature.id]
	return { ...layer, featuresById }
}

export const layerStateRecoil = atomFamily<
	LayerState | undefined | null,
	[string | undefined | null, string | undefined | null]
>({
	key: 'layerState',
	default: null,
	effects_UNSTABLE: ([url, token]) => [
		({ setSelf, onSet }) => {
			if (!url) return
			if (!token) return

			let layerCurrent: LayerState = { url, featuresById: {} }

			const wsc = new WSClient<WSServerMessage, WSClientMessage>({
				url,
				token,
				onMessage: (msg) => {
					switch (msg.type) {
						case 'feature:update': {
							setSelf(
								(layerCurrent = setFeatureInLayerObject(
									layerCurrent,
									msg.feature
								))
							)
							return
						}
						case 'feature:delete': {
							setSelf(
								(layerCurrent = deleteFeatureInLayerObject(
									layerCurrent,
									msg.feature
								))
							)
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
				layerNew = layerNew || { url, featuresById: {} }
				// detect created/updated
				Object.values(layerNew.featuresById)
					.filter((f) => layerCurrent.featuresById[f.id] !== f)
					.forEach((feature) => {
						wsc.send({ type: 'feature:update', feature })
					})
				// detect deleted
				Object.values(layerCurrent.featuresById)
					.filter((f) => !layerNew!.featuresById[f.id])
					.forEach((feature) => {
						wsc.send({ type: 'feature:delete', feature })
					})
				layerCurrent = layerNew
			})

			return () => wsc.close()
		},
	],
})

export type WSRelayedMessage =
	| { type: 'feature:update'; feature: Feature }
	| { type: 'feature:delete'; feature: FeatureDeleteDTO }

export type WSClientMessage = WSRelayedMessage

export type WSServerMessage =
	| WSRelayedMessage
	| { type: 'feature:all'; features: Feature[] }
	| { type: 'user:list'; users: DiscordUser[] }
	| { type: 'user:join'; user: DiscordUser }
