import { autorun, makeAutoObservable, observable } from 'mobx'
import { v4 as randomUUID } from 'uuid'
import { RootStore } from '.'
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

export class LayerStateStore {
	private wsc: WSClient<WSServerMessage, WSClientMessage>

	featuresById = observable.map<string, Feature>()
	permissions: Permissions | null = null

	constructor(private readonly root: RootStore, readonly url: string) {
		makeAutoObservable<this, 'root' | 'wsc'>(this, { root: false, wsc: false })

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

		autorun(() => this.wsc.setToken(this.root.login.token))
	}

	dispose() {
		this.wsc.close()
	}

	setToken(token: string | undefined) {
		this.wsc.setToken(token)
		this.permissions = null
	}

	createFeature(featurePartial: FeatureCreateDTO): string {
		if (!this.root.login.profile) {
			throw new Error(
				'Cannot create feature while logged out: ' +
					JSON.stringify(featurePartial)
			)
		}
		const feature: Feature = {
			id: makeFeatureId(),
			creator_id: this.root.login.profile.id,
			created_ts: Date.now(),
			last_editor_id: this.root.login.profile.id,
			last_edited_ts: Date.now(),
			data: featurePartial.data || {},
		}
		this.wsc.send({ type: 'feature:update', feature })
		this.featuresById.set(feature.id, feature)
		return feature.id
	}

	updateFeature(featurePartial: FeatureUpdateDTO) {
		if (!this.root.login.profile) {
			console.error('Cannot update feature while logged out', featurePartial)
			return
		}
		const existing = this.featuresById.get(featurePartial.id)
		const feature: Feature = {
			// create if not exists
			id: featurePartial.id,
			creator_id: this.root.login.profile.id,
			created_ts: Date.now(),
			...existing,
			last_editor_id: this.root.login.profile.id,
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

	constructor() {
		makeAutoObservable(this)
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
