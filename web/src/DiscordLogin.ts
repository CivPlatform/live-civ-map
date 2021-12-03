import useLocalStorage from '@rehooks/local-storage'
import useSWRImmutable from 'swr/immutable'

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

export function useDiscordToken() {
	const [state] = useLocalStorage<{ discordToken: string }>(tokenLSKey)
	return state?.discordToken
}

export function useDiscordProfile() {
	const token = useDiscordToken()
	const { data: profile } = useSWRImmutable(
		token || null,
		fetchDiscordUserProfile
	)
	return profile
}

export const tokenLSKey = 'LiveCivMap.discordToken'

type LoginStatus =
	| { token?: undefined; error?: undefined } // logged out
	| { token: string; error?: undefined }
	| { error: string; token?: undefined }

let status: LoginStatus = {}

export const getLoginStatus = () => status

export function logOut() {
	status = {}
	window.localStorage.removeItem(tokenLSKey)
}

function setAuthSuccess(token: string) {
	status = { token }
}

function setAuthError(error: string) {
	status = { error }
}

export function prepareOAuthLoginUrl() {
	if (!DISCORD_APP_ID) throw new Error(`Missing DISCORD_APP_ID`)
	if (!DISCORD_OAUTH2_REDIRECT_URI)
		throw new Error(`Missing DISCORD_OAUTH2_REDIRECT_URI`)
	if (!window.localStorage)
		throw new Error(`Can't log in: LocalStorage not supported`)

	let { discordCsrfToken, discordCsrfTokenExpiration } = getLocalStorageJson(
		'LiveCivMap.discordCsrfToken'
	)
	// preserve existing csrfToken if possible, so if another tab is open using that token it will still work
	const validForAtLeast10Min =
		discordCsrfTokenExpiration > Date.now() + 10 * minuteMs
	if (!validForAtLeast10Min) {
		discordCsrfToken = generateRandomString(32, tokenChars)
		discordCsrfTokenExpiration = Date.now() + hourMs
		window.localStorage.setItem(
			'LiveCivMap.discordCsrfToken',
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

export function checkUrlParamsLogin() {
	try {
		if (!window.localStorage) return
		{
			// check if already logged in
			const { discordToken, discordTokenExpiration } =
				getLocalStorageJson(tokenLSKey)
			if (discordToken) {
				if (discordTokenExpiration && +discordTokenExpiration > Date.now()) {
					return setAuthSuccess(discordToken)
				}
				const expiryStr = new Date(+discordTokenExpiration).toISOString()
				console.log(`Discord token invalid or expired ${expiryStr}`)
			}
		}
		const fragmentParams = new URLSearchParams(
			document.location.hash.replace(/^#/, '')
		)
		if (fragmentParams.get('state') && fragmentParams.get('access_token')) {
			// we have a potential discord token, but we need to verify that it was requested by us, to prevent a malicious link from logging us out ("CSRF")
			const { discordCsrfToken, discordCsrfTokenExpiration } =
				getLocalStorageJson('LiveCivMap.discordCsrfToken')
			if (
				!discordCsrfTokenExpiration ||
				discordCsrfTokenExpiration < Date.now()
			) {
				return setAuthError(`CSRF token expired`)
			}
			if (fragmentParams.get('state') !== discordCsrfToken) {
				return setAuthError(`Invalid CSRF token`)
			}
			const discordToken = fragmentParams.get('access_token')
			if (!discordToken) {
				return setAuthError(`No Discord token received`)
			}

			// good token. store it, and remove from url

			window.localStorage.removeItem('LiveCivMap.discordCsrfToken')
			const newUrl = document.location.href.split('#', 2)[0]
			window.history.replaceState(null, '', newUrl)

			const discordTokenExpiration =
				+(fragmentParams.get('expires_in') || 0) * 1000 + Date.now()

			setAuthSuccess(discordToken)
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
