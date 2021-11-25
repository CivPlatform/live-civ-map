export type Feature = { id: string; [k: string]: any } // TODO

export class MapDB {
	features: Record<string, Feature> = {
		TODO: { id: 'TODO', geometry: { x: 0, z: 0 } }, // TODO demo
	}

	constructor() {
		// TODO load all from db
	}

	async getAllFeatures(): Promise<Feature[]> {
		return Object.values(this.features)
	}

	async updateFeature(feature: Feature): Promise<Feature> {
		// TODO update db
		this.features[feature.id] = feature
		return feature
	}
}
