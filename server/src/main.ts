import { MapDB } from './MapDB.js'
import { WSClientMessage, WSServer, WSSession } from './WSServer.js'

const { DATABASE_URL = '' } = process.env
if (!DATABASE_URL) throw new Error(`Missing DATABASE_URL`)

class Main {
	mapDb = new MapDB(DATABASE_URL)
	wsServer = new WSServer(this)

	async handleClientConnected(session: WSSession) {
		// TODO check authorization

		const features = await this.mapDb.getAllFeatures()
		session.send({ type: 'map:state', features })

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
			case 'map:feature': {
				await this.mapDb.updateFeature(msg.feature)
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
