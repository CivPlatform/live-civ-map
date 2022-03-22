const PUBLIC_URL = window.location.origin

export type DiscordUserId = string

export interface DiscordUser {
	id: DiscordUserId
	username: string
	discriminator: string
	avatar?: string
}

export interface OAuth2CodeInfo {
	code: string
	redirect_uri: string
	scope: string
}

export function avatarUrlForUser(user: DiscordUser) {
	if (user.avatar) {
		return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
	} else {
		const nr = +user.discriminator % 5
		return `https://cdn.discordapp.com/embed/avatars/${nr}.png`
	}
}

export function logOut(mapServer: string) {
	window.localStorage.removeItem(jwtLSKeyForMapServer(mapServer))
	window.localStorage.removeItem(codeLSKeyForMapServer(mapServer))
	window.localStorage.removeItem(csrfLSKeyForMapServer(mapServer))
}

export const jwtLSKeyForMapServer = (mapServer: string) =>
	'CivMap.discordLogin.JWT.' + mapServer

export const codeLSKeyForMapServer = (mapServer: string) =>
	'CivMap.discordLogin.code.' + mapServer

const csrfLSKeyForMapServer = (mapServer: string) =>
	'CivMap.discordLogin.CSRF.' + mapServer

export const redirectUriForMapServer = (mapServer: string) =>
	PUBLIC_URL + '/discordLogin.html?mapServer=' + mapServer

/** Also writes CSRF token to LocalStorage.
 * @returns {string} Discord OAuth2 login URL for this `mapServer` */
export function prepareOAuthLoginUrl(mapServer: string, discordAppId: string) {
	if (!mapServer) throw new Error(`Missing mapServer`)
	if (!PUBLIC_URL) throw new Error(`Missing PUBLIC_URL`)
	if (!window.localStorage)
		throw new Error(`Can't log in: LocalStorage not supported`)

	let token = generateRandomString(32, csrfTokenChars)

	// preserve existing CSRF token if possible, so if another tab is open using that token it will still work
	const existStr = window.localStorage.getItem(csrfLSKeyForMapServer(mapServer))
	const exist = JSON.parse(existStr || '{}')
	if (exist.validUntil > Date.now() && exist.token?.length === 32) {
		token = exist.token
	}

	const hourMs = 60 * 60 * 1000
	const validUntil = Date.now() + hourMs
	const csrfStr = JSON.stringify({ token, validUntil })
	window.localStorage.setItem(csrfLSKeyForMapServer(mapServer), csrfStr)

	return [
		`https://discord.com/api/oauth2/authorize?response_type=token`,
		`client_id=${discordAppId}`,
		`redirect_uri=${encodeURIComponent(redirectUriForMapServer(mapServer))}`,
		`state=${token}`,
		`scope=identify`,
		`prompt=none`,
	].join('&')
}

const csrfTokenChars =
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
