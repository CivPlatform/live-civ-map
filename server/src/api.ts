import { OAuth2CodeInfo } from './DiscordLogin'

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
	user_id: DiscordUserId | typeof ANONYMOUS_UID
	user?: DiscordUser | null
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

export const fullPerms: Omit<LayerUserPerms, 'user_id' | 'last_edited_ts'> = {
	read: true,
	write_self: true,
	write_other: true,
	manage: true,
}

/** A LayerUserPerms for this user_id represents the default permissions for users with no own permissions row.
 * This works because Discord user ids are numeric, so no user can have the id "(anonymous)". */
export const ANONYMOUS_UID = '(anonymous)'

export const ANONYMOUS_USER: DiscordUser = {
	id: ANONYMOUS_UID,
	username: ANONYMOUS_UID,
	discriminator: '0000',
}
