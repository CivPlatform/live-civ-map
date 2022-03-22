import { makeAutoObservable, reaction, runInAction } from 'mobx'

/** Read/update LocalStorage. */
export class LocalStorageStrStore {
	value: string | null = null

	private disposeReaction: () => void

	constructor(readonly key: string) {
		makeAutoObservable(this, { disposeReaction: false } as any)

		this.readFromLocalStorage()

		window.addEventListener('storage', this.handleStorageEvent)

		this.disposeReaction = reaction(
			() => this.value,
			(value) =>
				runInAction(() => {
					if (value) {
						window.localStorage.setItem(this.key, value)
					} else {
						window.localStorage.removeItem(this.key)
					}
				})
		)
	}

	private handleStorageEvent = (e: StorageEvent) => {
		if (e.key === this.key) this.readFromLocalStorage()
	}

	dispose() {
		window.removeEventListener('storage', this.handleStorageEvent)
		this.disposeReaction()
	}

	private readFromLocalStorage() {
		const newValue = window.localStorage.getItem(this.key)
		if (this.value === newValue) return // no change
		runInAction(() => (this.value = newValue))
	}
}

/** Read/update LocalStorage, parse/stringify as JSON. */
export class LocalStorageStore<T extends {}> {
	private ls: LocalStorageStrStore

	constructor(readonly key: string) {
		this.ls = new LocalStorageStrStore(key)
		makeAutoObservable(this)
	}

	dispose() {
		this.ls.dispose()
	}

	get value(): T {
		return JSON.parse(this.ls.value || '{}')
	}

	set value(value: T) {
		this.ls.value = JSON.stringify(value)
	}
}
