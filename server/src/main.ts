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
		const user = session.discordUser

		// TODO create new layer if not exists, set session user as owner

		const userPerms = await layerBoard.perms.getUserPerms(user.id)
		if (!userPerms?.read) return session.close()

		layerBoard.addSession(session)

		const features = await layerBoard.features.getAllFeaturesInLayer()
		session.send({ type: 'feature:all', features })

		if (userPerms?.manage) {
			const allPerms = await layerBoard.perms.getAllUserPerms()
			session.send({ type: 'perms:update', perms: allPerms })
		} else {
			session.send({ type: 'perms:update', perms: [userPerms] })
		}

		// includes this session's user
		const users = layerBoard.getUniqueConnectedUsers()
		session.send({ type: 'user:list', users })
		layerBoard.broadcastExcept({ type: 'user:join', user }, session)

		if (userPerms?.manage) {
			const allPerms = await layerBoard.perms.getAllUserPerms()
			session.send({ type: 'perms:update', perms: allPerms })
		}
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
		const userPerms = await layerBoard.perms.getUserPerms(userId)
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

				if (!existing || existing.creator_id === userId) {
					if (!userPerms?.write_self)
						return session.send({
							type: 'feature:delete',
							feature: msg.feature,
						})
				} else {
					if (!userPerms?.write_other)
						return session.send({ type: 'feature:update', feature: existing })
				}

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

				if (existing.creator_id === userId) {
					if (!userPerms?.write_self)
						return session.send({
							type: 'feature:update',
							feature: existing,
						})
				} else {
					if (!userPerms?.write_other)
						return session.send({ type: 'feature:update', feature: existing })
				}

				await layerBoard.features.deleteFeature(msg.feature)
				layerBoard.broadcastExcept(msg, session)
				return
			}
			case 'perms:update': {
				if (!userPerms?.manage) {
					return session.close() // invalid state on client side
				}

				const now = Date.now() // same timestamp for all
				await Promise.all(
					msg.perms.map(async (perms) => {
						const existing = await layerBoard.perms.getUserPerms(perms.user_id)
						// update in-place in case future code below this refers to msg.perms
						Object.assign(perms, { ...existing, ...perms, last_edited_ts: now })
						await layerBoard.perms.setUserPerms(perms)
					})
				)

				layerBoard.broadcastIfPermsExcept(msg, 'manage', session)
				return
			}
			case 'perms:delete': {
				if (!userPerms?.manage) {
					return session.close() // invalid state on client side
				}

				await Promise.all(
					msg.userIds.map(async (user_id) => {
						await layerBoard.perms.deleteUserPerms({ user_id })
					})
				)

				layerBoard.broadcastIfPermsExcept(msg, 'manage', session)
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
