import type { LayerId, WSClientMessage } from './api'
import { LayerBoard } from './LayerBoard'
import { WSServer, WSSession } from './WSServer'

class Main {
	private wsServer = new WSServer(this)

	private layerBoards = new Map<LayerId, LayerBoard>()

	/** indexed by layer */
	private uncacheTimers = new Map<LayerId, NodeJS.Timeout>()

	private getLayer(layerId: string) {
		let layerBoard = this.layerBoards.get(layerId)
		if (!layerBoard) {
			layerBoard = new LayerBoard(layerId)
			this.layerBoards.set(layerId, layerBoard)
		}
		if (this.uncacheTimers.get(layerId)) {
			clearTimeout(this.uncacheTimers.get(layerId)!)
			this.uncacheTimers.delete(layerId)
		}
		return layerBoard
	}

	private uncacheLayer(layerId: string) {
		const layerBoard = this.layerBoards.get(layerId)
		if (!layerBoard) return
		const timeout = setTimeout(() => {
			this.layerBoards.delete(layerId)
		}, 60 * 1000)
		this.uncacheTimers.set(layerId, timeout)
	}

	async handleClientConnected(session: WSSession) {
		const layerBoard = this.getLayer(session.layerId)

		// TODO check authorization for layer

		layerBoard.addSession(session)

		const features = await layerBoard.features.getAllFeaturesInLayer()
		session.send({ type: 'feature:all', features })

		// includes this session's user
		const users = layerBoard.getUniqueConnectedUsers()
		session.send({ type: 'user:list', users })
		layerBoard.broadcastExcept(
			{ type: 'user:join', user: session.discordUser },
			session
		)
	}

	async handleClientDisconnected(session: WSSession) {
		const layerBoard = this.getLayer(session.layerId)
		layerBoard.removeSession(session)
		if (layerBoard.getNumSessions() <= 0) {
			this.uncacheLayer(session.layerId)
		}
	}

	async handleClientPacket(msg: WSClientMessage, session: WSSession) {
		const layerBoard = this.getLayer(session.layerId)
		const userId = session.discordUser.id
		switch (msg.type) {
			case 'feature:update': {
				// input validation
				msg.feature.last_editor_id = userId
				const now = Date.now()
				if (
					msg.feature.last_edited_ts > now ||
					msg.feature.last_edited_ts < now - 10000
				) {
					msg.feature.last_edited_ts = now
				}

				const existing = await layerBoard.features.getFeature(msg.feature.id)

				// TODO check authorization

				if (!existing) {
					msg.feature.creator_id = userId
					await layerBoard.features.createFeature(msg.feature)
				} else {
					msg.feature.creator_id = existing.creator_id
					msg.feature.created_ts = existing.created_ts
					await layerBoard.features.updateFeature(msg.feature)
				}
				layerBoard.broadcastExcept(msg, session)
				return
			}
			case 'feature:delete': {
				const existing = await layerBoard.features.getFeature(msg.feature.id)
				if (!existing) return // nothing to do

				// TODO check authorization

				await layerBoard.features.deleteFeature(msg.feature)
				layerBoard.broadcastExcept(msg, session)
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
