import { v4 as randomUUID } from 'uuid'
import { Feature, FeatureId, LayerId } from './api'
import { pool } from './db'

/** represented by one db row; not serialized */
type FeatureRow = Feature & { layer: LayerId }
/** serialized; as stored in db */
type FeatureRowStr = Omit<FeatureRow, 'data'> & { data_str: string }

const dbReadyP = Promise.all([
	pool.query(`CREATE TABLE IF NOT EXISTS
		features (
			id TEXT NOT NULL,
			layer TEXT NOT NULL,
			creator_id TEXT NOT NULL,
			created_ts BIGINT NOT NULL,
			last_editor_id TEXT NOT NULL,
			last_edited_ts BIGINT NOT NULL,
			data_str TEXT NOT NULL,
			PRIMARY KEY (id, layer)
		);`),
])

/** caches tables in memory, writes changes back to db */
export class LayerFeaturesDB {
	private readyP: Promise<unknown>

	private featuresById = new Map<FeatureId, Feature>()

	constructor(readonly layerId: LayerId) {
		this.readyP = dbReadyP.then(() =>
			pool
				.query('SELECT * FROM features where layer = $1;', [layerId])
				.then(({ rows }) => {
					for (const { layer, data_str, ...row } of rows as FeatureRowStr[]) {
						const data = JSON.parse(data_str)
						this.featuresById.set(row.id, { data, ...row })
					}
				})
		)
	}

	async getFeature(id: FeatureId): Promise<Feature | undefined> {
		await this.readyP
		return this.featuresById.get(id)
	}

	async getAllFeaturesInLayer(): Promise<Feature[]> {
		await this.readyP
		return Object.values(this.featuresById)
	}

	async createFeature(feature: Feature): Promise<Feature> {
		await this.readyP

		feature = { ...feature, id: feature.id || randomUUID() }

		if (this.featuresById.has(feature.id)) {
			const msg = `Cannot create feature for existing id ${feature.id} in layer ${this.layerId}`
			throw new Error(msg)
		}

		const data_str = JSON.stringify(feature.data)

		await pool.query(
			`INSERT INTO features (
					id, layer, creator_id, created_ts, last_editor_id, last_edited_ts, data_str
				) VALUES ($1, $2, $3, $4, $5, $6, $7);`,
			[
				feature.id,
				this.layerId,
				feature.creator_id,
				feature.created_ts,
				feature.last_editor_id,
				feature.last_edited_ts,
				data_str,
			]
		)

		this.featuresById.set(feature.id, feature)

		return feature
	}

	async updateFeature(feature: Feature): Promise<Feature> {
		await this.readyP
		let { id, data } = feature
		if (!id) throw new Error('Invalid feature: missing id')

		if (!this.featuresById.has(feature.id)) {
			const msg = `Cannot update feature for unknown id ${feature.id} in layer ${this.layerId}`
			throw new Error(msg)
		}

		const data_str = JSON.stringify(data)

		// fails if unknown id
		await pool.query(
			`UPDATE features SET
						data_str = $3,
						last_editor_id = $4,
						last_edited_ts = $5
						WHERE id = $1 AND layer = $2;`,
			[
				id,
				this.layerId,
				data_str,
				feature.last_editor_id,
				feature.last_edited_ts,
			]
		)

		this.featuresById.set(feature.id, feature)

		return feature
	}

	async deleteFeature(feature: Pick<Feature, 'id'>): Promise<void> {
		await this.readyP
		await pool.query('DELETE FROM features WHERE id = $1 AND layer = $2;', [
			feature.id,
			this.layerId,
		])
		this.featuresById.delete(feature.id)
	}
}
