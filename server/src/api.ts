/** can be sent by both client and server; is relayed from client to all other clients */
export type WSRelayedMessage =
	| { type: 'feature:update'; feature: Feature }
	| { type: 'feature:delete'; feature: { id: Feature['id'] } & (Feature | {}) }
	| { type: 'perms:update'; perms: LayerUserPerms[] }
	| { type: 'perms:delete'; userIds: DiscordUserId[] }

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

export interface LayerUserPerms {
	user_id: DiscordUserId
	user: DiscordUser
	last_edited_ts: number
	/** read features created by any user. required to connect */
	read?: boolean
	/** create features, update/delete features created by the same user */
	write_self?: boolean
	/** update/delete features created by other users */
	write_other?: boolean
	/** change permissions of other users; add new users */
	manage?: boolean
}
