import PG from 'pg'
import { v4 as randomUUID } from 'uuid'

export type Feature = { id: string; geometry: Geometry; extra?: any }

export type Geometry = any

export class MapDB {
	private pool: PG.Pool
	private readyP: Promise<void>

	private featuresById: Record<string, Feature> = {}

	constructor(connectionString: string) {
		this.pool = new PG.Pool({ connectionString })

		// pool will emit error on behalf of idle clients (backend error, network partition)
		this.pool.on('error', (err) => {
			console.error('Unexpected error on idle client', err)
			process.exit(-1)
		})

		this.readyP = Promise.all([
			this.pool.query(`CREATE TABLE IF NOT EXISTS
				features (
					id TEXT NOT NULL,
					geometry_str TEXT,
					extra_str TEXT
				);`),
		]).then(async () => {
			const { rows } = await this.pool.query('SELECT * FROM features;')
			for (const { id, geometry_str, extra_str } of rows) {
				const geometry = JSON.parse(geometry_str)
				const extra = JSON.parse(extra_str)
				this.featuresById[id] = { id, geometry, extra }
			}
		})
	}

	close() {
		this.pool.end()
	}

	async getAllFeatures(): Promise<Feature[]> {
		await this.readyP
		return Object.values(this.featuresById)
	}

	async updateFeature(feature: Feature): Promise<Feature> {
		await this.readyP
		let { id, geometry, extra } = feature
		if (!id) id = feature.id = randomUUID()
		const geometry_str = geometry && JSON.stringify(geometry)
		const extra_str = extra && JSON.stringify(extra)

		if (this.featuresById[id]) {
			await this.pool.query(
				'UPDATE features SET geometry_str=$2, extra_str=$3 WHERE id = $1;',
				[id, geometry_str, extra_str]
			)
		} else {
			await this.pool.query(
				'INSERT INTO features (id, geometry_str, extra_str) VALUES ($1, $2, $3);',
				[id, geometry_str, extra_str]
			)
		}

		this.featuresById[id] = feature
		return feature
	}

	async deleteFeature(feature: { id: string }): Promise<void> {
		await this.readyP
		await this.pool.query('DELETE FROM features WHERE id = $1;', [feature.id])
		delete this.featuresById[feature.id]
	}
}
