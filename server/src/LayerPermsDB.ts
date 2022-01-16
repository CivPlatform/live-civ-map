import type { DiscordUser, DiscordUserId, LayerId, LayerUserPerms } from './api'
import { pool } from './db'

/** represented by one db row; not serialized */
type UserPermsRow = LayerUserPerms & { layer_id: LayerId }
/** serialized; as stored in db */
type UserPermsRowStr = Omit<UserPermsRow, 'user'> & { user_str?: string }

const dbReadyP = Promise.all([
	pool.query(`CREATE TABLE IF NOT EXISTS
		user_perms (
			layer_id TEXT NOT NULL,
			user_id TEXT NOT NULL,
			user_str TEXT,
			read BOOLEAN,
			write_self BOOLEAN,
			write_other BOOLEAN,
			manage BOOLEAN,
			last_edited_ts BIGINT NOT NULL,
			PRIMARY KEY (layer, user_id)
		);`),
])

export class LayerPermsDB {
	private readyP: Promise<unknown>

	private permsById = new Map<DiscordUserId, LayerUserPerms>()

	constructor(readonly layerId: LayerId) {
		this.readyP = dbReadyP.then(() =>
			pool
				.query<UserPermsRowStr>(
					'SELECT * FROM user_perms where layer_id = $1;',
					[layerId]
				)
				.then(({ rows }) => {
					for (const { layer_id, user_str, ...row } of rows) {
						const user = user_str
							? (JSON.parse(user_str) as DiscordUser)
							: undefined
						this.permsById.set(row.user_id, { user, ...row })
					}
				})
		)
	}

	async getAllUserPerms() {
		await this.readyP
		return Object.values(this.permsById)
	}

	async getUserPerms(
		user_id: DiscordUserId
	): Promise<LayerUserPerms | undefined> {
		await this.readyP
		return this.permsById.get(user_id)
	}

	async setUserPerms(perms: LayerUserPerms) {
		await this.readyP

		await pool.query(
			`INSERT INTO user_perms (
					layer_id, user_id, user_str, read, write_self, write_other, manage, last_edited_ts
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
				ON CONFLICT (layer_id, user_id) DO UPDATE SET
					user_str = EXCLUDED.user_str,
					read = EXCLUDED.read,
					write_self = EXCLUDED.write_self,
					write_other = EXCLUDED.write_other,
					manage = EXCLUDED.manage,
					last_edited_ts = EXCLUDED.last_edited_ts;`,
			[
				this.layerId,
				perms.user_id,
				perms.user && JSON.stringify(perms.user),
				perms.read,
				perms.write_self,
				perms.write_other,
				perms.manage,
				perms.last_edited_ts,
			]
		)

		this.permsById.set(perms.user_id, perms)

		return perms
	}

	async deleteUserPerms(perms: Pick<LayerUserPerms, 'user_id'>): Promise<void> {
		await this.readyP
		await pool.query(
			'DELETE FROM user_perms WHERE layer_id = $1 AND user_id = $2;',
			[this.layerId, perms.user_id]
		)
		this.permsById.delete(perms.user_id)
	}
}
