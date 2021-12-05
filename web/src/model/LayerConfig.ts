import {
	autorun,
	makeAutoObservable,
	observable,
	reaction,
	runInAction,
} from 'mobx'
import { LocalStorageStore } from './LocalStorage'

/** stored to remember known layers in the client's map */
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

	layers = observable.array<LayerConfigStore>()

	constructor(lsKey: string) {
		this.ls = new LocalStorageStore<LayerConfig[]>(lsKey)

		makeAutoObservable(this)

		autorun(() => {
			const value = this.ls.value
			runInAction(() => {
				this.layers.clear()
				for (const { url, hidden, alias } of value || []) {
					const layerConfig = new LayerConfigStore(url)
					layerConfig.hidden = hidden
					layerConfig.alias = alias
					this.layers.push(layerConfig)
				}
			})
		})

		reaction(
			() => {
				return this.layers.map((l) => {
					const { url, hidden, alias } = l
					return { url, hidden, alias }
				})
			},
			(newVal) => runInAction(() => (this.ls.value = newVal))
		)
	}

	getLayer(layerUrl: string) {
		return this.layers.find((l) => l.url === layerUrl)
	}

	rememberLayer(url: string) {
		if (this.layers.find((l) => l.url === url)) return
		this.layers.push(new LayerConfigStore(url))
	}

	forgetLayer(url: string) {
		const existing = this.layers.find((l) => l.url === url)
		if (!existing) return
		this.layers.remove(existing)
	}

	setLayerAlias(url: string, alias: string | null | undefined) {
		this.layers.forEach((l) => {
			if (l.url === url) l.alias = alias || undefined
		})
	}

	setLayerHidden(url: string, hidden: boolean) {
		this.layers.forEach((l) => {
			if (l.url === url) l.hidden = hidden
		})
	}

	toggleLayerHidden(url: string) {
		this.layers.forEach((l) => {
			if (l.url === url) l.hidden = !l.hidden
		})
	}
}
