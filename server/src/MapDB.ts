import PG from 'pg'
import { v4 as randomUUID } from 'uuid'

export interface Feature {
	id: string
	creator_id: string
	created_ts: number
	last_editor_id: string
	last_edited_ts: number
	data: any
}

type FeatureRow = Omit<Feature, 'data'> & { data_str: string }

export class MapDB {
	private pool: PG.Pool
	private readyP: Promise<void>

	private featuresById: Record<string, Feature> = {}

	constructor(connectionString: string) {
		this.pool = new PG.Pool({
			connectionString,
			ssl: connectionString.includes('//localhost:')
				? undefined
				: { rejectUnauthorized: false }, // heroku fix
		})

		// pool will emit error on behalf of idle clients (backend error, network partition)
		this.pool.on('error', (err) => {
			console.error('Unexpected error on idle client', err)
			process.exit(-1)
		})

		this.readyP = Promise.all([
			this.pool.query(`CREATE TABLE IF NOT EXISTS
				features (
					id TEXT NOT NULL,
					creator_id TEXT NOT NULL,
					created_ts BIGINT NOT NULL,
					last_editor_id TEXT NOT NULL,
					last_edited_ts BIGINT NOT NULL,
					data_str TEXT
				);`),
		]).then(async () => {
			const { rows } = await this.pool.query('SELECT * FROM features;')
			for (const { data_str, ...row } of rows as FeatureRow[]) {
				const data = JSON.parse(data_str)
				this.featuresById[row.id] = { data, ...row }
			}
		})
	}

	close() {
		this.pool.end()
	}

	async getFeature(id: Feature['id']): Promise<Feature | undefined> {
		await this.readyP
		return this.featuresById[id]
	}

	async getAllFeatures(): Promise<Feature[]> {
		await this.readyP
		return Object.values(this.featuresById)
	}

	async createFeature(feature: Feature): Promise<Feature> {
		await this.readyP
		const id = (feature.id = feature.id || randomUUID())
		const data_str = JSON.stringify(feature.data)

		await this.pool.query(
			`INSERT INTO features (
					id, creator_id, created_ts, last_editor_id, last_edited_ts, data_str
				) VALUES ($1, $2, $3, $4, $5, $6);`,
			[
				id,
				feature.creator_id,
				feature.created_ts,
				feature.last_editor_id,
				feature.last_edited_ts,
				data_str,
			]
		)

		this.featuresById[id] = feature
		return feature
	}

	async updateFeature(feature: Feature): Promise<Feature> {
		await this.readyP
		let { id, data } = feature
		if (!id) throw new Error('Invalid feature: missing id')
		const data_str = JSON.stringify(data)

		// fails if unknown id
		await this.pool.query(
			`UPDATE features SET
						data_str = $2,
						last_editor_id = $3,
						last_edited_ts = $4
						WHERE id = $1;`,
			[id, data_str, feature.last_editor_id, feature.last_edited_ts]
		)

		this.featuresById[id] = feature
		return feature
	}

	async deleteFeature(feature: { id: Feature['id'] }): Promise<void> {
		await this.readyP
		await this.pool.query('DELETE FROM features WHERE id = $1;', [feature.id])
		delete this.featuresById[feature.id]
	}
}
