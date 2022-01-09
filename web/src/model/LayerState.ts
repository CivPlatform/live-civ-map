import { autorun, makeAutoObservable, observable } from 'mobx'
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

/** injected dependency */
export interface DiscordLoginStore {
	token: string | undefined
	profile: DiscordUser | null
}

export class LayerStateStore {
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

	createFeature(featurePartial: FeatureCreateDTO): string {
		if (!this.login.profile) {
			throw new Error(
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
			console.error('Cannot update feature while logged out', featurePartial)
			return
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
		this.wsc.send({ type: 'feature:delete', feature })
		this.featuresById.delete(feature.id)
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
		if (!layer) {
			layer = new LayerStateStore(this.login, layerUrl)
			this.layersByUrl.set(layerUrl, layer)
		}
		return layer
	}
}

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
