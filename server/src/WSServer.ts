import { IncomingMessage } from 'http'
import { URL } from 'url'
import { WebSocket, WebSocketServer } from 'ws'
import { DiscordUser, LayerId, WSClientMessage, WSServerMessage } from './api'
import { fetchDiscordUserData } from './DiscordLogin'

const { PORT = 8080 } = process.env

interface Main {
	handleClientConnected(session: WSSession): any
	handleClientDisconnected(session: WSSession): any
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

			const session = new WSSession(wsc, req, dUser, main)
			this.sessions.push(session)
			wsc.on('close', () => {
				this.sessions = this.sessions.filter((c) => c !== session)
				main.handleClientDisconnected(session)
			})

			main.handleClientConnected(session)
		})
	}
}

export class WSSession {
	wsc: WebSocket
	req: IncomingMessage
	main: Main
	discordUser: DiscordUser
	discordTag: string
	layerId: LayerId

	constructor(
		wsc: WebSocket,
		req: IncomingMessage,
		dUser: DiscordUser,
		main: Main
	) {
		this.wsc = wsc
		this.req = req
		this.main = main
		this.discordUser = dUser
		this.discordTag = `@${dUser.username}#${dUser.discriminator}`

		// req.url may have query parameters
		const url = new URL('ws://host' + req.url)
		this.layerId = url.pathname

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
