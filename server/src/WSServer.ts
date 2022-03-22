import { IncomingMessage } from 'http'
import { URL } from 'url'
import { WebSocket, WebSocketServer } from 'ws'
import { DiscordUser, LayerId, WSClientMessage, WSServerMessage } from './api'
import {
	fetchDiscordUserData,
	makeJwt,
	performOAuth2Code,
	verifyJwt,
} from './DiscordLogin'

const { PORT = 8080 } = process.env

interface Main {
	handleClientConnected(session: WSSession): unknown
	handleClientAuthenticated(session: WSSession): unknown
	handleClientDisconnected(session: WSSession): unknown
	handleClientPacket(msg: WSClientMessage, session: WSSession): unknown
}

export class WSServer {
	wss: WebSocketServer
	sessions: WSSession[] = []

	constructor(main: Main) {
		this.wss = new WebSocketServer({ port: +PORT })
		console.log('[WSS] Listening on', +PORT)
		this.wss.on('connection', async (wsc, req) => {
			const session = new WSSession(wsc, req, main)
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
	/** if this is set, the client has authenticated as a Discord account */
	discordUser?: DiscordUser
	clientName: string
	layerId: LayerId

	constructor(
		private wsc: WebSocket,
		req: IncomingMessage,
		private main: Main
	) {
		// req.url may have query parameters
		const url = new URL('ws://host' + req.url)
		this.layerId = url.pathname

		// preliminary, until auth succeeds
		this.clientName = req.socket.remoteAddress!

		wsc.on('close', (code, reason) => {
			this.warn('Closed:', code, reason.toString())
		})
		wsc.on('error', (err) => {
			this.warn('Error:', err)
		})

		this.log('Connected')

		wsc.on('message', async (msgRaw) => {
			const msg = JSON.parse(msgRaw.toString()) as WSClientMessage
			switch (msg.type) {
				case 'auth:discord:code': {
					try {
						const tokenInfo = await performOAuth2Code(msg)
						const user = await fetchDiscordUserData(tokenInfo.token)
						const jwt = makeJwt(user)
						this.send({ type: 'auth:discord:jwt', jwt })
						return this.setAuth(user)
					} catch (err) {
						this.warn(`During auth:discord:code`, err)
						return this.send({ type: 'auth:invalid' })
					}
				}
				case 'auth:discord:jwt': {
					try {
						const user = verifyJwt<DiscordUser>(msg.jwt)
						return this.setAuth(user)
					} catch (err) {
						this.warn(`During auth:discord:jwt`, err)
						return this.send({ type: 'auth:invalid' })
					}
				}
				default:
					return main.handleClientPacket(msg, this)
			}
		})
	}

	private setAuth(dUser: DiscordUser) {
		this.discordUser = dUser
		this.clientName = `@${dUser.username}#${dUser.discriminator}`
		this.log('Authenticated', JSON.stringify(dUser))

		try {
			this.main.handleClientAuthenticated(this)
		} catch (err) {
			console.error(err)
		}
	}

	close() {
		this.wsc.close()
		// close handler will do all clean-up
	}

	log(...args: any[]) {
		console.log(`[WSC] [${this.clientName}]`, ...args)
	}

	warn(...args: any[]) {
		console.error(`[WSC] [${this.clientName}]`, ...args)
	}

	send(msg: string | WSServerMessage) {
		if (this.wsc.readyState === WebSocket.CLOSED) return // cannot send anymore; drop packets
		if (typeof msg !== 'string') msg = JSON.stringify(msg)
		this.wsc.send(msg)
	}
}
