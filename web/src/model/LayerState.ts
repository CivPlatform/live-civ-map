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
import {
	codeLSKeyForMapServer,
	DiscordUser,
	DiscordUserId,
	jwtLSKeyForMapServer,
	OAuth2CodeInfo,
	redirectUriForMapServer,
} from './DiscordLogin'
import { Feature } from './Feature'
import { LocalStorageStrStore } from './LocalStorage'

export type FeatureCreateDTO = Omit<
	Feature,
	'id' | 'creator_id' | 'created_ts' | 'last_editor_id' | 'last_edited_ts'
>

export type FeatureUpdateDTO = Omit<
	Feature,
	'creator_id' | 'created_ts' | 'last_editor_id' | 'last_edited_ts'
>

export type FeatureDeleteDTO = Pick<Feature, 'id' | 'creator_id'>

export const makeFeatureId = () => randomUUID()

const colorHash = new ColorHash()
export const getDefaultLayerColor = (layerUrl: string) =>
	colorHash.hex(layerUrl)

export interface LayerStateStore {
	/** URL host:port */
	mapServer: string

	featuresById: ObservableMap<string, Feature>
	numFeatures: number

	/** undefined means not known yet, waiting to be informed by server */
	permissions?: LayerPerms
	/** if this is defined, the client has authenticated as a Discord account */
	dUser?: DiscordUser
	/**  */
	loginDiscordAppId?: string

	// these are only defined when editing is possible (e.g., not JSON-backed)
	// TODO don't define when no perms?
	createFeature?: (featurePartial: FeatureCreateDTO) => string
	updateFeature?: (featurePartial: FeatureUpdateDTO) => void
	deleteFeature?: (feature: FeatureDeleteDTO) => void
}

export class WSLayerStateStore implements LayerStateStore {
	private wsc: WSClient<WSServerMessage, WSClientMessage>
	mapServer: string

	dUser?: DiscordUser
	permissions?: LayerPerms
	loginDiscordAppId?: string

	get userIdOrAnon() {
		return this.dUser?.id || ANONYMOUS_UID
	}

	private disposeAutoJWT: () => void
	private disposeAutoCode: () => void
	private jwtLS: LocalStorageStrStore
	private codeLS: LocalStorageStrStore

	featuresById = observable.map<string, Feature>()

	constructor(readonly url: string) {
		makeAutoObservable(this, {
			wsc: false,
			disposeAutoJWT: false,
			disposeAutoCode: false,
			jwtLS: false,
			codeLS: false,
		} as any)

		// `host` includes `:port` if explicitly set; `hostname` would only be the domain name
		this.mapServer = new URL(url).host

		this.wsc = new WSClient<WSServerMessage, WSClientMessage>({
			url,
			onMessage: (msg) => {
				switch (msg.type) {
					case 'auth:info': {
						return runInAction(() => {
							this.loginDiscordAppId = msg.discordAppId
						})
					}
					case 'perms:self': {
						return runInAction(() => {
							this.permissions = msg.perms
							this.dUser = msg.perms.user
						})
					}
					case 'auth:invalid': {
						return runInAction(() => {
							this.dUser = undefined // TODO handle auth:invalid - display reason to user
						})
					}
					case 'auth:discord:jwt': {
						const codeKey = codeLSKeyForMapServer(this.mapServer)
						window.localStorage.removeItem(codeKey)

						const jwtKey = jwtLSKeyForMapServer(this.mapServer)
						window.localStorage.setItem(jwtKey, msg.jwt)
						return
					}
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
					case 'perms:update': {
						return runInAction(() => {
							// TODO store perms
						})
					}
				}
			},
		})

		this.jwtLS = new LocalStorageStrStore(jwtLSKeyForMapServer(this.mapServer))
		this.disposeAutoJWT = autorun(() => {
			const jwt = this.jwtLS.value
			if (jwt) this.wsc.send({ type: 'auth:discord:jwt', jwt })
		})

		this.codeLS = new LocalStorageStrStore(
			codeLSKeyForMapServer(this.mapServer)
		)
		this.disposeAutoCode = autorun(() => {
			const code = this.codeLS.value
			const redirect_uri = redirectUriForMapServer(this.mapServer)
			const scope = 'identify'
			if (code)
				this.wsc.send({ type: 'auth:discord:code', code, redirect_uri, scope })
		})
	}

	dispose() {
		this.disposeAutoJWT()
		this.disposeAutoCode()
		this.jwtLS.dispose()
		this.codeLS.dispose()
		this.wsc.close()
	}

	get numFeatures() {
		return this.featuresById.size
	}

	createFeature(featurePartial: FeatureCreateDTO): string {
		this.checkPerm('write_self', 'create feature')

		const feature: Feature = {
			id: makeFeatureId(),
			creator_id: this.userIdOrAnon,
			created_ts: Date.now(),
			last_editor_id: this.userIdOrAnon,
			last_edited_ts: Date.now(),
			data: featurePartial.data || {},
		}

		this.wsc.send({ type: 'feature:update', feature })
		this.featuresById.set(feature.id, feature)

		return feature.id
	}

	updateFeature(featurePartial: FeatureUpdateDTO) {
		const existing = this.featuresById.get(featurePartial.id)
		const feature: Feature = {
			// create if not exists
			id: featurePartial.id,
			creator_id: this.userIdOrAnon,
			created_ts: Date.now(),
			...existing,
			last_editor_id: this.userIdOrAnon,
			last_edited_ts: Date.now(),
			data: { ...existing?.data, ...featurePartial.data },
		}

		if (feature.creator_id === this.userIdOrAnon) {
			this.checkPerm('write_self', 'update own feature')
		} else {
			this.checkPerm('write_other', "update someone else's feature")
		}

		this.wsc.send({ type: 'feature:update', feature })
		this.featuresById.set(feature.id, feature)
	}

	deleteFeature(feature: FeatureDeleteDTO) {
		if (feature.creator_id === this.userIdOrAnon) {
			this.checkPerm('write_self', 'delete own feature')
		} else {
			this.checkPerm('write_other', "delete someone else's feature")
		}

		this.wsc.send({ type: 'feature:delete', feature })
		this.featuresById.delete(feature.id)
	}

	private checkPerm(perm: keyof LayerPerms, action: string) {
		if (!this.permissions?.[perm]) {
			throw new PermissionError(`Cannot ${action} without ${perm} permission`)
		}
	}
}

export class HttpJsonLayerStateStore implements LayerStateStore {
	mapServer: string
	featuresById = observable.map<string, Feature>()
	permissions: LayerPerms = {}

	constructor(readonly url: string) {
		this.mapServer = new URL(url).host

		makeAutoObservable(this)

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

	constructor() {
		makeAutoObservable(this)
	}

	dispose() {
		throw new Error('Not implemented')
	}

	getByUrl(layerUrl: string) {
		if (!layerUrl) return undefined
		let layer = this.layersByUrl.get(layerUrl)
		if (layer) return layer
		if (layerUrl.startsWith('ws')) {
			layer = new WSLayerStateStore(layerUrl)
		} else if (layerUrl.startsWith('http')) {
			layer = new HttpJsonLayerStateStore(layerUrl)
		} else {
			throw new Error('Cannot load layer state for url: ' + layerUrl)
		}
		this.layersByUrl.set(layerUrl, layer)
		return layer
	}
}

export class LoggedOutError extends Error {}
export class PermissionError extends Error {}

/** can be sent by both client and server; is relayed from client to all other clients */
export type WSRelayedMessage =
	| { type: 'auth:discord:jwt'; jwt: string }
	| { type: 'feature:update'; feature: Feature }
	| { type: 'feature:delete'; feature: { id: Feature['id'] } & (Feature | {}) }
	| { type: 'perms:update'; perms: LayerUserPerms[] }
	| { type: 'perms:delete'; userIds: DiscordUserId[] }

export type WSClientMessage =
	| WSRelayedMessage
	| { type: 'perms:request' }
	| ({ type: 'auth:discord:code' } & OAuth2CodeInfo)

export type WSServerMessage =
	| WSRelayedMessage
	| { type: 'auth:info'; authPerms: LayerUserPerms; discordAppId?: string }
	| { type: 'perms:self'; perms: LayerUserPerms & { user: DiscordUser } }
	| { type: 'auth:invalid' }
	| { type: 'feature:all'; features: Feature[] }
	| { type: 'user:list'; users: DiscordUser[] }
	| { type: 'user:join'; user: DiscordUser }

export type JWTString = string

export type LayerUserPerms = {
	user_id: DiscordUserId | typeof ANONYMOUS_UID
	user: DiscordUser
	last_edited_ts: number
} & LayerPerms

export interface LayerPerms {
	/** read features created by any user. required to connect */
	read?: boolean
	/** create features, update/delete features created by the same user */
	write_self?: boolean
	/** update/delete features created by other users */
	write_other?: boolean
	/** change permissions of other users; add new users */
	manage?: boolean
}

const ANONYMOUS_UID = '(anonymous)'
