import type { DiscordUser, DiscordUserId, WSServerMessage } from './api'
import { LayerFeaturesDB } from './LayerFeaturesDB'

interface WSSession {
	discordUser: DiscordUser
	send(msg: string): void
}

/** maintains state related to a layer (db cache, related ws sessions) */
export class LayerBoard {
	private readonly featuresDB: LayerFeaturesDB

	get features() {
		return this.featuresDB
	}

	// one user may be connected multiple times through different websockets
	private sessions: WSSession[] = []

	constructor(readonly layerId: string) {
		this.featuresDB = new LayerFeaturesDB(layerId)
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
		this.sessions.forEach((s) => (users[s.discordUser.id] = s.discordUser))
		return Object.values(users)
	}

	/** send the message to all connected sessions except excludedSession */
	async broadcastExcept(msg: WSServerMessage, excludedSession?: WSSession) {
		const msgStr = JSON.stringify(msg)
		for (const session of this.sessions) {
			if (session === excludedSession) continue
			session.send(msgStr)
		}
	}
}
