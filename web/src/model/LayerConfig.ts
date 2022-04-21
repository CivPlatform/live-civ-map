import {
	autorun,
	keys,
	makeAutoObservable,
	observable,
	reaction,
	runInAction,
	values,
} from 'mobx'
import { LocalStorageStore } from './LocalStorage'

/** client's config for known layers */
export type LayerConfig = { url: string; hidden?: boolean; alias?: string }

export class LayerConfigStore implements LayerConfig {
	hidden?: boolean
	alias?: string

	constructor(public url: string) {
		makeAutoObservable(this)
	}
}

export class LayerConfigsStore {
	private ls: LocalStorageStore<LayerConfig[]>

	layersByUrl = observable.map<string, LayerConfigStore>()

	constructor(lsKey: string) {
		this.ls = new LocalStorageStore<LayerConfig[]>(lsKey)

		makeAutoObservable(this)

		autorun(() => {
			const value = this.ls.value
			runInAction(() => {
				this.layersByUrl.clear()
				for (const { url, hidden, alias } of value || []) {
					const layerConfig = new LayerConfigStore(url)
					layerConfig.hidden = hidden
					layerConfig.alias = alias
					this.layersByUrl.set(url, layerConfig)
				}
			})
		})

		reaction(
			() => {
				return values(this.layersByUrl).map((l) => {
					const { url, hidden, alias } = l
					return { url, hidden, alias }
				})
			},
			(newVal) => runInAction(() => (this.ls.value = newVal))
		)
	}

	getAllLayerUrls() {
		return keys(this.layersByUrl)
	}

	getAllLayers() {
		return values(this.layersByUrl)
	}

	getLayer(layerUrl: string) {
		return this.layersByUrl.get(layerUrl)
	}

	addLayer(url: string) {
		if (this.layersByUrl.has(url)) return
		this.layersByUrl.set(url, new LayerConfigStore(url))
	}

	forgetLayer(url: string) {
		this.layersByUrl.delete(url)
	}

	setLayerAlias(url: string, alias: string | null | undefined) {
		const layer = this.layersByUrl.get(url)
		if (layer) layer.alias = alias || undefined
	}

	setLayerHidden(url: string, hidden: boolean) {
		const layer = this.layersByUrl.get(url)
		if (layer) layer.hidden = hidden
	}

	toggleLayerHidden(url: string) {
		const layer = this.layersByUrl.get(url)
		if (layer) layer.hidden = !layer.hidden
	}
}
