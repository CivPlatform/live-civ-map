import { makeAutoObservable, observable, runInAction } from 'mobx'
import { Feature } from '../Feature'
import { LayerPerms, LayerStateStore } from './LayerStateStore'

export class HttpJsonLayerStateStore implements LayerStateStore {
	mapServer: string
	featuresById = observable.map<string, Feature>()
	permissions: LayerPerms = {}

	constructor(readonly url: string) {
		this.mapServer = new URL(url).host

		makeAutoObservable(this)

		fetch(url).then(async (res) => {
			const { features } = await res.json()
			runInAction(() => {
				for (const { id, ...data } of features) {
					this.featuresById.set(id, {
						id,
						data,
						created_ts: 0,
						last_edited_ts: 0,
						creator_id: '',
						last_editor_id: '',
					})
				}
			})
		})
	}

	get numFeatures() {
		return this.featuresById.size
	}
}
