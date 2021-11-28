import { MapDB } from './MapDB.js'
import { WSClientMessage, WSServer, WSSession } from './WSServer.js'

const { DATABASE_URL = 'postgres://localhost:5432/postgres' } = process.env

class Main {
	mapDb = new MapDB(DATABASE_URL)
	wsServer = new WSServer(this)

	async handleClientConnected(session: WSSession) {
		// TODO check authorization for layer

		const features = await this.mapDb.getAllFeaturesInLayer(session.layer)
		session.send({ type: 'feature:all', features })

		// includes this session's user
		const users = this.wsServer.sessions.map((s) => s.discordUser)
		session.send({ type: 'user:list', users })
		this.wsServer.broadcast(
			{ type: 'user:join', user: session.discordUser },
			session
		)
	}

	async handleClientPacket(msg: WSClientMessage, session: WSSession) {
		switch (msg.type) {
			case 'feature:update': {
				// TODO check authorization

				msg.feature.last_editor_id = session.discordUser.id
				const existing = await this.mapDb.getFeature(
					session.layer,
					msg.feature.id
				)
				if (!existing) {
					msg.feature.creator_id = session.discordUser.id
					await this.mapDb.createFeature(session.layer, msg.feature)
				} else {
					msg.feature.creator_id = existing.creator_id
					msg.feature.created_ts = existing.created_ts
					await this.mapDb.updateFeature(session.layer, msg.feature)
				}
				this.wsServer.broadcast(msg, session)
				return
			}
			case 'feature:delete': {
				// TODO check authorization

				await this.mapDb.deleteFeature(session.layer, msg.feature)
				this.wsServer.broadcast(msg, session)
				return
			}
			default: {
				console.error(
					`Unknown message from`,
					session.discordTag,
					JSON.stringify(msg)
				)
				return
			}
		}
	}
}

new Main()
