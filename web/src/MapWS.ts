import { useEffect, useRef, useState } from 'react'
import { DiscordUser, useDiscordToken } from './DiscordLogin'
import { Feature } from './map/Feature'
import { WSClient } from './ws'

export type WSRelayedMessage = { type: 'map:feature'; feature: Feature }

export type WSClientMessage = WSRelayedMessage

export type WSServerMessage =
	| WSRelayedMessage
	| { type: 'map:state'; features: Feature[] }
	| { type: 'user:list'; users: DiscordUser[] }
	| { type: 'user:join'; user: DiscordUser }

/** connect with current token,
 * keep track of features
 * and other online users,
 * reconnect if token changes,
 * disconnect if no longer used. */
export class MapWSClient extends WSClient<WSServerMessage, WSClientMessage> {
	featuresById: Record<string, Feature> = {}

	private handlers: Record<number, Handler> = {}
	private nextHandlerId = 0

	constructor(url: string) {
		super({
			url,
			onMessage: (msg) => {
				switch (msg.type) {
					case 'map:state': {
						const { features } = msg
						this.featuresById = {}
						features.forEach((f) => (this.featuresById[f.id] = f))
						this.emitChange()
						return
					}
					case 'map:feature': {
						const { feature } = msg
						this.featuresById[feature.id] = feature
						this.emitChange()
						return
					}
				}
			},
		})
		wsClients[this.url] = this
	}

	getAllFeatures() {
		return Object.values(this.featuresById)
	}

	updateFeature(feature: Feature) {
		this.featuresById[feature.id] = feature
		this.send({ type: 'map:feature', feature })
		this.emitChange()
	}

	private emitChange() {
		Object.values(this.handlers).forEach((h) => h())
	}

	registerHandler(handler: Handler) {
		const hid = ++this.nextHandlerId
		this.handlers[hid] = handler
		return () => {
			delete this.handlers[hid]
			if (!Object.keys(this.handlers).length) {
				this.close()
				delete wsClients[this.url]
			}
		}
	}
}

const wsClients: Record<string, MapWSClient> = {}

type Handler = () => any

export function useMapWs(url: string) {
	const token = useDiscordToken()

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [_, setState] = useState(0)

	const ref = useRef<MapWSClient | null>(null)

	useEffect(() => {
		const wsc = wsClients[url] || (wsClients[url] = new MapWSClient(url))
		ref.current = wsc
		const unregister = wsc.registerHandler(() => setState((x) => x + 1))
		return unregister
	}, [url])

	if (token) ref.current?.setToken(token)

	return ref.current
}
