/** can be sent by both client and server; is relayed from client to all other clients */
export type WSRelayedMessage =
	| { type: 'feature:update'; feature: Feature }
	| { type: 'feature:delete'; feature: { id: Feature['id'] } & (Feature | {}) }

export type WSClientMessage = WSRelayedMessage

export type WSServerMessage =
	| WSRelayedMessage
	| { type: 'feature:all'; features: Feature[] }
	| { type: 'user:list'; users: DiscordUser[] }
	| { type: 'user:join'; user: DiscordUser }

export type LayerId = string

export type FeatureId = string

export interface Feature {
	id: FeatureId
	creator_id: string
	created_ts: number
	last_editor_id: string
	last_edited_ts: number
	data: any
}

export type DiscordUserId = string

export interface DiscordUser {
	id: DiscordUserId
	username: string
	discriminator: string
	avatar?: string
}
