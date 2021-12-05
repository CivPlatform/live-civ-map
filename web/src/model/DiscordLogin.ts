import { autorun, makeAutoObservable, runInAction } from 'mobx'

// react-js only exposes env starting with REACT_APP_ https://create-react-app.dev/docs/adding-custom-environment-variables/
const DISCORD_APP_ID = process.env.REACT_APP_DISCORD_APP_ID
const DISCORD_OAUTH2_REDIRECT_URI =
	process.env.REACT_APP_DISCORD_OAUTH2_REDIRECT_URI || process.env.PUBLIC_URL

export interface DiscordUser {
	id: string
	username: string
	discriminator: string
	avatar?: string
}

export type LoginStatus =
	| { token?: undefined; expiration?: undefined; error?: undefined } // logged out
	| { token: string; expiration: number; error?: undefined }
	| { error: string; token?: undefined; expiration?: undefined }

export class DiscordLoginStore {
	private status: LoginStatus = {}

	profile: DiscordUser | null = null

	get token() {
		return this.status.token
	}

	get avatarUrl() {
		if (!this.profile) return null
		return avatarUrlForUser(this.profile)
	}

	constructor() {
		makeAutoObservable(this)

		autorun(() => {
			fetchDiscordUserProfile(this.token).then((profile) => {
				runInAction(() => {
					this.profile = profile
				})
			})
		})
	}

	setStatus(status: LoginStatus) {
		if (
			this.status.token === status.token &&
			this.status.expiration === status.expiration &&
			this.status.error === status.error
		) {
			return
		}
		this.status = status
	}

	logOut() {
		window.localStorage.removeItem(tokenLSKey)
		this.status = {}
	}

	prepareOAuthLoginUrl() {
		if (!DISCORD_APP_ID) throw new Error(`Missing DISCORD_APP_ID`)
		if (!DISCORD_OAUTH2_REDIRECT_URI)
			throw new Error(`Missing DISCORD_OAUTH2_REDIRECT_URI`)
		if (!window.localStorage)
			throw new Error(`Can't log in: LocalStorage not supported`)

		let { discordCsrfToken, discordCsrfTokenExpiration } =
			getLocalStorageJson(csrfLSKey)
		// preserve existing CSRF token if possible, so if another tab is open using that token it will still work
		const validForAtLeast10Min =
			discordCsrfTokenExpiration > Date.now() + 10 * minuteMs
		if (!validForAtLeast10Min) {
			discordCsrfToken = generateRandomString(32, tokenChars)
			discordCsrfTokenExpiration = Date.now() + hourMs
			window.localStorage.setItem(
				csrfLSKey,
				JSON.stringify({
					discordCsrfToken,
					discordCsrfTokenExpiration,
				})
			)
		}
		return [
			`https://discord.com/api/oauth2/authorize?prompt=none`,
			`client_id=${DISCORD_APP_ID}`,
			`redirect_uri=${encodeURIComponent(DISCORD_OAUTH2_REDIRECT_URI)}`,
			`state=${discordCsrfToken}`,
			`scope=identify`,
			`response_type=token`,
		].join('&')
	}
}

function readStatusFromLocalStorage() {
	const { discordToken, discordTokenExpiration } =
		getLocalStorageJson(tokenLSKey)
	if (discordToken === discordLoginStore.token) return false // no change, ignore
	if (!discordToken) {
		discordLoginStore.logOut()
		return false
	}
	if (!discordTokenExpiration || +discordTokenExpiration < Date.now()) {
		const expiryStr = new Date(+discordTokenExpiration).toISOString()
		console.log(`Discord token expired ${expiryStr}`)
		discordLoginStore.logOut()
		return false
	}
	discordLoginStore.setStatus({
		token: discordToken,
		expiration: discordTokenExpiration,
	})
	return true
}

export function checkUrlParamsLogin() {
	try {
		if (!window.localStorage)
			return console.error(`Can't log in: LocalStorage not supported`)

		const fragmentParams = new URLSearchParams(
			document.location.hash.replace(/^#/, '')
		)
		if (fragmentParams.get('state') && fragmentParams.get('access_token')) {
			// we have a potential discord token, but we need to verify that it was requested by us, to prevent a malicious link from logging us out ("CSRF")
			const { discordCsrfToken, discordCsrfTokenExpiration } =
				getLocalStorageJson(csrfLSKey)
			if (
				!discordCsrfTokenExpiration ||
				discordCsrfTokenExpiration < Date.now()
			) {
				return discordLoginStore.setStatus({ error: `CSRF token expired` })
			}
			if (fragmentParams.get('state') !== discordCsrfToken) {
				return discordLoginStore.setStatus({ error: `Invalid CSRF token` })
			}
			const discordToken = fragmentParams.get('access_token')
			if (!discordToken) {
				return discordLoginStore.setStatus({
					error: `No Discord token received`,
				})
			}

			// good token. store it, and remove from url

			window.localStorage.removeItem(csrfLSKey)
			const newUrl = document.location.href.split('#', 2)[0]
			window.history.replaceState(null, '', newUrl)

			const discordTokenExpiration =
				+(fragmentParams.get('expires_in') || 0) * 1000 + Date.now()

			discordLoginStore.setStatus({
				token: discordToken,
				expiration: discordTokenExpiration,
			})
			window.localStorage.setItem(
				tokenLSKey,
				JSON.stringify({ discordToken, discordTokenExpiration })
			)
			return
		}
	} catch (err) {
		console.error('While performing Discord login:', err)
	}
}

export async function fetchDiscordUserProfile(
	token: string | null | undefined
): Promise<DiscordUser | null> {
	try {
		if (!token) return null
		const res = await fetch('https://discord.com/api/users/@me', {
			headers: {
				Authorization: `Bearer ${token}`,
				'User-Agent': `LiveCivMap-server (live-civ-map.netlify.app, v1.0.0)`,
			},
			mode: 'cors',
		})
		const { id, username, discriminator, avatar } =
			(await res.json()) as DiscordUser
		// only return interesting fields
		return { id, username, discriminator, avatar }
	} catch (err) {
		console.error(`Failed fetching discord user info:`, err)
		return null
	}
}

export function avatarUrlForUser(user: DiscordUser) {
	if (user.avatar) {
		return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
	} else {
		const nr = +user.discriminator % 5
		return `https://cdn.discordapp.com/embed/avatars/${nr}.png`
	}
}

const minuteMs = 60 * 1000
const hourMs = 60 * minuteMs

const tokenChars =
	'1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM_-'

function generateRandomString(n: number, chars: string) {
	const indices =
		window.crypto && window.crypto.getRandomValues
			? Array.from(window.crypto.getRandomValues(new Uint8Array(n)))
			: Array(n)
					.fill(null)
					.map(() => Math.floor(chars.length * Math.random()))
	return indices.map((i) => chars[i % chars.length]).join('')
}

const getLocalStorageJson = (key: string) =>
	JSON.parse(window.localStorage.getItem(key) || '{}')

// TODO move setup into constructor; allow using any localstorage keys

export const discordLoginStore = new DiscordLoginStore()

// TODO LocalStorage is inherently global, but we should inject it for testing

const tokenLSKey = 'LiveCivMap.discordToken'
const csrfLSKey = 'LiveCivMap.discordCsrfToken'

window.addEventListener('storage', () => readStatusFromLocalStorage())
readStatusFromLocalStorage()
