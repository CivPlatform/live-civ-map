import { makeAutoObservable, observable } from 'mobx'
import { HttpJsonLayerStateStore } from './HttpJsonLayerStateStore'
import { LayerStateStore } from './LayerStateStore'
import { WSLayerStateStore } from './WSLayerStateStore'

export class LayerStatesStore {
	layersByUrl = observable.map<string, LayerStateStore>()

	constructor() {
		makeAutoObservable(this)
	}

	dispose() {
		throw new Error('Not implemented')
	}

	getByUrl(layerUrl: string) {
		if (!layerUrl) return undefined
		let layer = this.layersByUrl.get(layerUrl)
		if (layer) return layer
		if (layerUrl.startsWith('ws')) {
			layer = new WSLayerStateStore(layerUrl)
		} else if (layerUrl.startsWith('http')) {
			layer = new HttpJsonLayerStateStore(layerUrl)
		} else {
			throw new Error('Cannot load layer state for url: ' + layerUrl)
		}
		this.layersByUrl.set(layerUrl, layer)
		return layer
	}
}
