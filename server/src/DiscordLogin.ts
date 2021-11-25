import fetch from 'node-fetch'

export interface DiscordUser {
	id: string
	username: string
	discriminator: string
	avatar?: string
}

type UndefinedFields<T> = { [k in keyof T]?: undefined }

export async function fetchDiscordUserData(
	token: string
): Promise<DiscordUser | UndefinedFields<DiscordUser>> {
	try {
		const res = await fetch('https://discord.com/api/users/@me', {
			headers: {
				Authorization: `Bearer ${token}`,
				'User-Agent': `LiveCivMap-server (live-civ-map.netlify.app, v1.0.0)`,
			},
		})
		const { id, username, discriminator, avatar } =
			(await res.json()) as DiscordUser
		// only return interesting fields
		return { id, username, discriminator, avatar }
	} catch (err) {
		console.error(`Failed fetching discord user info:`, err)
		return {}
	}
}
