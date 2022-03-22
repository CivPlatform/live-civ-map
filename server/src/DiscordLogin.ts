import jwt from 'jsonwebtoken'
import fetch from 'node-fetch'
import { URLSearchParams } from 'url'

const { DISCORD_APP_ID, DISCORD_APP_SECRET, JWT_SECRET } = process.env

export const discordAppId = DISCORD_APP_ID

export interface DiscordUser {
	id: string
	username: string
	discriminator: string
	avatar?: string
}

export async function fetchDiscordUserData(
	token: string
): Promise<DiscordUser> {
	const res = await fetch('https://discord.com/api/users/@me', {
		headers: {
			Authorization: `Bearer ${token}`,
			'User-Agent': `LiveCivMap-server (live-civ-map.netlify.app, v1.0.0)`,
		},
	})
	if (!res.ok)
		throw new Error(`Discord API request failed: ${res.statusText} ${res.url}`)
	// only return interesting fields
	const { id, username, discriminator, avatar } = (await res.json()) as any
	return { id, username, discriminator, avatar }
}

export interface DiscordTokenInfo {
	token: string
	token_expiry: number
}

export interface OAuth2CodeInfo {
	code: string
	redirect_uri: string
	scope: string
}

export async function performOAuth2Code(
	args: OAuth2CodeInfo
): Promise<DiscordTokenInfo> {
	if (!DISCORD_APP_ID) throw new Error(`Must configure DISCORD_APP_ID`)
	if (!DISCORD_APP_SECRET) throw new Error(`Must configure DISCORD_APP_SECRET`)
	const beforeRequestTs = Date.now()
	const res = await fetch('https://discord.com/api/oauth2/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			code: args.code,
			redirect_uri: args.redirect_uri,
			scope: args.scope,
			client_id: DISCORD_APP_ID,
			client_secret: DISCORD_APP_SECRET,
		}).toString(),
	})
	if (!res.ok)
		throw new Error(`Discord API request failed: ${res.statusText} ${res.url}`)
	const { access_token, expires_in } = (await res.json()) as any
	return {
		token: access_token,
		token_expiry: beforeRequestTs + expires_in * 1000,
	}
}

const JWT_ALG = 'HS384'

export function makeJwt<T extends string | object | Buffer>(payload: T) {
	if (!JWT_SECRET) throw new Error(`Cannot make JWT: empty JWT_SECRET`)
	return jwt.sign(payload, JWT_SECRET, { algorithm: JWT_ALG })
}

export function verifyJwt<T extends object>(token: string): T & jwt.JwtPayload {
	if (!JWT_SECRET) throw new Error(`Cannot read JWT: empty JWT_SECRET`)
	// make sure to reject any other algorithms, such as "none"
	const payload = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALG] })
	return payload as T & jwt.JwtPayload
}
