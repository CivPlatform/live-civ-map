/** connect with current Discord token,
 * reconnect if token changes. */
export class WSClient<WSServerMessage, WSClientMessage> {
	readonly url: string
	status: WsStatus
	ws?: WebSocket
	shouldClose = false

	private token?: string

	onMessage: (msg: WSServerMessage) => any
	onStatus?: (status: WsStatus) => any

	constructor(args: {
		url: string
		token?: string
		onMessage: (msg: WSServerMessage) => any
		onStatus?: (status: WsStatus) => any
	}) {
		this.url = args.url
		this.token = args.token
		this.onMessage = args.onMessage
		this.onStatus = args.onStatus

		this.status = { status: 'connecting', ts: Date.now() }
		this.startWebsocketConnection()
	}

	setToken(token: string | undefined) {
		if (this.token === token) return
		if (this.ws) {
			this.ws.close(0, 'token changed')
			this.ws = undefined
		}
		this.token = token
		this.startWebsocketConnection()
	}

	close() {
		this.shouldClose = true
		this.ws?.close()
	}

	send(msg: WSClientMessage) {
		const msgStr = JSON.stringify(msg)
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(msgStr)
		} else if (!this.shouldClose) {
			// TODO remember and resend
		}
	}

	log(...args: any[]) {
		console.log(`[WS] [${this.url}]`, ...args)
	}

	private updateStatus(status: WsStatus) {
		this.status = status
		if (this.onStatus) this.onStatus(status)
	}

	private startWebsocketConnection() {
		if (this.ws) return
		if (this.shouldClose) return
		if (!this.token) return

		const ws = new WebSocket(this.url + '?token=' + this.token)
		this.updateStatus({ status: 'connecting', ts: Date.now() })

		ws.onopen = () => {
			this.log('Connected')
			this.updateStatus({ status: 'connected', ts: Date.now() })
		}

		ws.onclose = ({ code, reason }) => {
			this.log('Closed:', code, reason)
			if (this.ws === ws) this.ws = undefined
			this.updateStatus({
				status: 'closed',
				ts: Date.now(),
				code,
				reason,
			})
			setTimeout(() => this.startWebsocketConnection(), 5000)
		}

		ws.onerror = (event) => {
			this.log('Error:', event)
			this.updateStatus({ status: 'error', ts: Date.now(), event })
			ws.close()
		}

		ws.onmessage = (packet) => {
			const msg = JSON.parse(packet.data)
			if (!msg.ts) msg.ts = Date.now()
			this.onMessage(msg)
		}

		this.ws = ws
	}
}

export type WsStatus =
	| {
			status: 'connecting'
			ts: number
			code?: undefined
			reason?: undefined
			event?: undefined
	  }
	| {
			status: 'connected'
			ts: number
			code?: undefined
			reason?: undefined
			event?: undefined
	  }
	| {
			status: 'closed'
			ts: number
			code: number
			reason: string
			event?: undefined
	  }
	| {
			status: 'error'
			ts: number
			code?: undefined
			reason?: undefined
			event: any
	  }
