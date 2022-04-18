import {
	ANONYMOUS_UID,
	ANONYMOUS_USER,
	DiscordUser,
	DiscordUserId,
	LayerUserPerms,
	WSServerMessage,
} from './api'
import { LayerFeaturesDB } from './LayerFeaturesDB'
import { LayerPermsDB } from './LayerPermsDB'

interface WSSession {
	discordUser?: DiscordUser
	send(msg: string): void
}

/** maintains state related to a layer (db cache, related ws sessions) */
export class LayerBoard {
	private readonly featuresDB: LayerFeaturesDB
	private readonly permsDB: LayerPermsDB

	get features() {
		return this.featuresDB
	}

	get perms() {
		return this.permsDB
	}

	// one user may be connected multiple times through different websockets
	private sessions: WSSession[] = []

	constructor(readonly layerId: string) {
		this.featuresDB = new LayerFeaturesDB(layerId)
		this.permsDB = new LayerPermsDB(layerId)
	}

	/** If this layer (id) has not been used by anybody yet.
	 * At least the owner's perms get stored once the layer (id) is created. */
	async hasNoOwner() {
		const perms = await this.perms.getAllUserPerms()
		if (Object.keys(perms).length) return false
		const features = await this.features.getAllFeaturesInLayer()
		if (Object.keys(features).length) return false
		return true
	}

	addSession(session: WSSession) {
		this.sessions.push(session)
	}

	removeSession(session: WSSession) {
		const i = this.sessions.indexOf(session)
		if (i === -1) return
		this.sessions.splice(i, 1)
	}

	getNumSessions() {
		return this.sessions.length
	}

	getUniqueConnectedUsers() {
		const users: Record<DiscordUserId, DiscordUser> = {}
		for (const s of this.sessions) {
			if (s.discordUser) users[s.discordUser.id] = s.discordUser
			else users[ANONYMOUS_UID] = ANONYMOUS_USER // they all get collapsed into one key, but at least that indicates that anonymous user(s) are present
		}
		return Object.values(users)
	}

	/** send the message to all connected sessions except excludedSession */
	async broadcastIfPermsExcept(
		msg: WSServerMessage,
		permKey: keyof LayerUserPerms,
		excludedSession?: WSSession
	) {
		const msgStr = JSON.stringify(msg)
		for (const session of this.sessions) {
			if (session === excludedSession) continue
			const userId = session.discordUser?.id
			const userPerms = await this.perms.getUserPermsOrDefault(userId)
			if (!userPerms?.[permKey]) continue
			session.send(msgStr)
		}
	}
}
