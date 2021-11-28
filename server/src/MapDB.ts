import PG from 'pg'
import { v4 as randomUUID } from 'uuid'
import { Feature } from './WSServer'

/** represented by one db row; not serialized */
type FeatureRow = Feature & { layer: string }
/** serialized; as stored in db */
type FeatureRowStr = Omit<FeatureRow, 'data'> & { data_str: string }

export class MapDB {
	private pool: PG.Pool
	private readyP: Promise<void>

	/** in-memory cache */
	private featuresByLayerThenId: Record<string, Record<string, Feature>> = {}

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
					layer TEXT NOT NULL,
					creator_id TEXT NOT NULL,
					created_ts BIGINT NOT NULL,
					last_editor_id TEXT NOT NULL,
					last_edited_ts BIGINT NOT NULL,
					data_str TEXT NOT NULL,
					PRIMARY KEY (id, layer)
				);`),
		]).then(async () => {
			const { rows } = await this.pool.query('SELECT * FROM features;')
			for (const { layer, data_str, ...row } of rows as FeatureRowStr[]) {
				const data = JSON.parse(data_str)

				const layerFeatures =
					this.featuresByLayerThenId[layer] ||
					(this.featuresByLayerThenId[layer] = {})

				layerFeatures[row.id] = { data, ...row }
			}
		})
	}

	close() {
		this.pool.end()
	}

	async getFeature(
		layer: FeatureRow['layer'],
		id: FeatureRow['id']
	): Promise<Feature | undefined> {
		await this.readyP
		return this.featuresByLayerThenId[layer]?.[id]
	}

	async getAllFeaturesInLayer(layer: FeatureRow['layer']): Promise<Feature[]> {
		await this.readyP
		return Object.values(this.featuresByLayerThenId[layer] || {})
	}

	async createFeature(
		layer: FeatureRow['layer'],
		feature: Feature
	): Promise<Feature> {
		await this.readyP
		feature = { ...feature, id: feature.id || randomUUID() }

		const layerFeatures =
			this.featuresByLayerThenId[layer] ||
			(this.featuresByLayerThenId[layer] = {})

		if (layerFeatures[feature.id]) {
			const msg = `Cannot create feature for existing id ${feature.id} in layer ${layer}`
			throw new Error(msg)
		}

		const data_str = JSON.stringify(feature.data)

		await this.pool.query(
			`INSERT INTO features (
					id, layer, creator_id, created_ts, last_editor_id, last_edited_ts, data_str
				) VALUES ($1, $2, $3, $4, $5, $6, $7);`,
			[
				feature.id,
				layer,
				feature.creator_id,
				feature.created_ts,
				feature.last_editor_id,
				feature.last_edited_ts,
				data_str,
			]
		)

		layerFeatures[feature.id] = feature

		return feature
	}

	async updateFeature(
		layer: FeatureRow['layer'],
		feature: Feature
	): Promise<Feature> {
		await this.readyP
		let { id, data } = feature
		if (!id) throw new Error('Invalid feature: missing id')

		const layerFeatures =
			this.featuresByLayerThenId[layer] ||
			(this.featuresByLayerThenId[layer] = {})

		if (!layerFeatures[feature.id]) {
			const msg = `Cannot update feature for unknown id ${feature.id} in layer ${layer}`
			throw new Error(msg)
		}

		const data_str = JSON.stringify(data)

		// fails if unknown id
		await this.pool.query(
			`UPDATE features SET
						data_str = $3,
						last_editor_id = $4,
						last_edited_ts = $5
						WHERE id = $1 AND layer = $2;`,
			[id, layer, data_str, feature.last_editor_id, feature.last_edited_ts]
		)

		layerFeatures[feature.id] = feature

		return feature
	}

	async deleteFeature(
		layer: FeatureRow['layer'],
		feature: Pick<Feature, 'id'>
	): Promise<void> {
		await this.readyP
		await this.pool.query(
			'DELETE FROM features WHERE id = $1 AND layer = $2;',
			[feature.id, layer]
		)
		delete this.featuresByLayerThenId[layer]?.[feature.id]
	}
}
