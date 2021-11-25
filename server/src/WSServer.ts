import { URL } from 'url'
import { WebSocket, WebSocketServer } from 'ws'
import { DiscordUser, fetchDiscordUserData } from './DiscordLogin.js'
import { Feature } from './MapDB.js'

const { PORT = 8080 } = process.env

export type WSRelayedMessage = { type: 'map:feature'; feature: Feature }

export type WSClientMessage = WSRelayedMessage

export type WSServerMessage =
	| WSRelayedMessage
	| { type: 'map:state'; features: Feature[] }
	| { type: 'user:list'; users: DiscordUser[] }
	| { type: 'user:join'; user: DiscordUser }

interface Main {
	handleClientConnected(session: WSSession): any
	handleClientPacket(msg: WSClientMessage, session: WSSession): any
}

export class WSServer {
	wss: WebSocketServer
	sessions: WSSession[] = []

	constructor(main: Main) {
		this.wss = new WebSocketServer({ port: +PORT })
		console.log('[WSS] Listening on', +PORT)
		this.wss.on('connection', async (wsc, req) => {
			const { searchParams } = new URL('ws://host' + req.url)
			const token = searchParams.get('token')
			if (!token) {
				console.error(`[WSC] No token in url:`, req.url)
				return wsc.close()
			}

			const dUser = await fetchDiscordUserData(token)
			if (!dUser.id) {
				console.error(`[WSC] Invalid token`)
				return wsc.close()
			}

			const session = new WSSession(wsc, dUser, main)
			this.sessions.push(session)
			wsc.on('close', () => {
				this.sessions = this.sessions.filter((c) => c !== session)
			})

			main.handleClientConnected(session)
		})
	}

	async broadcast(msg: WSServerMessage, excludeSession?: WSSession) {
		const msgStr = JSON.stringify(msg)
		for (const session of this.sessions) {
			if (session === excludeSession) continue
			session.send(msgStr)
		}
	}
}

export class WSSession {
	wsc: WebSocket
	main: Main
	discordUser: DiscordUser
	discordTag: string

	constructor(wsc: WebSocket, dUser: DiscordUser, main: Main) {
		this.wsc = wsc
		this.main = main
		this.discordUser = dUser
		this.discordTag = `@${dUser.username}#${dUser.discriminator}`

		wsc.on('close', (code, reason) => {
			this.warn('Closed:', code, reason.toString())
		})
		wsc.on('error', (err) => {
			this.warn('Error:', err)
		})

		this.log('Connected')

		wsc.on('message', async (msgRaw) => {
			const msg = JSON.parse(msgRaw.toString()) as WSClientMessage
			return main.handleClientPacket(msg, this)
		})
	}

	log(...args: any[]) {
		console.log(`[WSC] [${this.discordTag}]`, ...args)
	}

	warn(...args: any[]) {
		console.error(`[WSC] [${this.discordTag}]`, ...args)
	}

	send(msg: string | WSServerMessage) {
		if (typeof msg !== 'string') msg = JSON.stringify(msg)
		this.wsc.send(msg)
	}
}
