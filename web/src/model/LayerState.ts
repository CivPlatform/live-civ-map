import ColorHash from 'color-hash'
import {
	autorun,
	makeAutoObservable,
	observable,
	ObservableMap,
	runInAction,
} from 'mobx'
import { v4 as randomUUID } from 'uuid'
import { WSClient } from '../ws'
import { DiscordUser } from './DiscordLogin'
import { Feature } from './Feature'

export type FeatureCreateDTO = Omit<
	Feature,
	'id' | 'creator_id' | 'created_ts' | 'last_editor_id' | 'last_edited_ts'
>

export type FeatureUpdateDTO = Omit<
	Feature,
	'creator_id' | 'created_ts' | 'last_editor_id' | 'last_edited_ts'
>

export type FeatureDeleteDTO = Pick<Feature, 'id'>

export interface Permissions {}

export const makeFeatureId = () => randomUUID()

const colorHash = new ColorHash()
export const getDefaultLayerColor = (layerUrl: string) =>
	colorHash.hex(layerUrl)

/** injected dependency */
export interface DiscordLoginStore {
	token: string | undefined
	profile: DiscordUser | null
}

interface LayerStateStore {
	featuresById: ObservableMap<string, Feature>
	numFeatures: number

	permissions: Permissions | null

	// these are non-undefined when editing is possible (e.g., websocket-backed)
	createFeature?: (featurePartial: FeatureCreateDTO) => string
	updateFeature?: (featurePartial: FeatureUpdateDTO) => void
	deleteFeature?: (feature: FeatureDeleteDTO) => void
}

export class WSLayerStateStore implements LayerStateStore {
	private wsc: WSClient<WSServerMessage, WSClientMessage>

	private disposeAutoSetToken: () => unknown

	featuresById = observable.map<string, Feature>()
	permissions: Permissions | null = null

	constructor(private readonly login: DiscordLoginStore, readonly url: string) {
		makeAutoObservable<this, 'login' | 'wsc' | 'disposeAutoSetToken'>(this, {
			login: false,
			wsc: false,
			disposeAutoSetToken: false,
		})

		this.wsc = new WSClient<WSServerMessage, WSClientMessage>({
			url,
			onMessage: (msg) => {
				switch (msg.type) {
					case 'feature:update': {
						this.featuresById.set(msg.feature.id, msg.feature)
						return
					}
					case 'feature:delete': {
						this.featuresById.delete(msg.feature.id)
						return
					}
					case 'feature:all': {
						const { features } = msg
						// could also use .replace(values)
						this.featuresById.clear()
						features.forEach((f) => this.featuresById.set(f.id, f))
						return
					}
					case 'permissions:self': {
						this.permissions = msg.permissions
					}
				}
			},
		})

		this.disposeAutoSetToken = autorun(() => {
			this.wsc.setToken(this.login.token)
		})
	}

	dispose() {
		this.disposeAutoSetToken()
		this.wsc.close()
	}

	setToken(token: string | undefined) {
		this.wsc.setToken(token)
		this.permissions = null
	}

	get numFeatures() {
		return this.featuresById.size
	}

	createFeature(featurePartial: FeatureCreateDTO): string {
		if (!this.login.profile) {
			throw new LoggedOutError(
				'Cannot create feature while logged out: ' +
					JSON.stringify(featurePartial)
			)
		}
		const feature: Feature = {
			id: makeFeatureId(),
			creator_id: this.login.profile.id,
			created_ts: Date.now(),
			last_editor_id: this.login.profile.id,
			last_edited_ts: Date.now(),
			data: featurePartial.data || {},
		}
		this.wsc.send({ type: 'feature:update', feature })
		this.featuresById.set(feature.id, feature)
		return feature.id
	}

	updateFeature(featurePartial: FeatureUpdateDTO) {
		if (!this.login.profile) {
			throw new LoggedOutError(
				'Cannot update feature while logged out: ' +
					JSON.stringify(featurePartial)
			)
		}
		const existing = this.featuresById.get(featurePartial.id)
		const feature: Feature = {
			// create if not exists
			id: featurePartial.id,
			creator_id: this.login.profile.id,
			created_ts: Date.now(),
			...existing,
			last_editor_id: this.login.profile.id,
			last_edited_ts: Date.now(),
			data: { ...existing?.data, ...featurePartial.data },
		}
		this.wsc.send({ type: 'feature:update', feature })
		this.featuresById.set(feature.id, feature)
	}

	deleteFeature(feature: FeatureDeleteDTO) {
		if (!this.login.profile) {
			throw new LoggedOutError(
				'Cannot delete feature while logged out: ' + JSON.stringify(feature)
			)
		}
		this.wsc.send({ type: 'feature:delete', feature })
		this.featuresById.delete(feature.id)
	}
}

export class HttpJsonLayerStateStore implements LayerStateStore {
	featuresById = observable.map<string, Feature>()
	permissions: Permissions = {}

	constructor(private readonly login: DiscordLoginStore, readonly url: string) {
		makeAutoObservable<this, 'login'>(this, { login: false })

		fetch(url).then(async (res) => {
			const { features } = await res.json()
			runInAction(() => {
				for (const { id, ...data } of features) {
					this.featuresById.set(id, {
						id,
						data,
						created_ts: 0,
						last_edited_ts: 0,
						creator_id: '',
						last_editor_id: '',
					})
				}
			})
		})
	}

	get numFeatures() {
		return this.featuresById.size
	}
}

export class LayerStatesStore {
	layersByUrl = observable.map<string, LayerStateStore>()

	constructor(private readonly login: DiscordLoginStore) {
		makeAutoObservable<this, 'login'>(this, { login: false })
	}

	getByUrl(layerUrl: string) {
		if (!layerUrl) return undefined
		let layer = this.layersByUrl.get(layerUrl)
		if (layer) return layer
		if (layerUrl.startsWith('ws')) {
			layer = new WSLayerStateStore(this.login, layerUrl)
		} else if (layerUrl.startsWith('http')) {
			layer = new HttpJsonLayerStateStore(this.login, layerUrl)
		} else {
			throw new Error('Cannot load layer state for url: ' + layerUrl)
		}
		this.layersByUrl.set(layerUrl, layer)
		return layer
	}
}

export class LoggedOutError extends Error {}

type WSRelayedMessage =
	| { type: 'feature:update'; feature: Feature }
	| { type: 'feature:delete'; feature: FeatureDeleteDTO }

type WSClientMessage = WSRelayedMessage

type WSServerMessage =
	| WSRelayedMessage
	| { type: 'feature:all'; features: Feature[] }
	| { type: 'permissions:self'; permissions: Permissions }
	| { type: 'user:list'; users: DiscordUser[] }
	| { type: 'user:join'; user: DiscordUser }
