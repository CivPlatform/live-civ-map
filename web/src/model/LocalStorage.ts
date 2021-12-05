import { makeAutoObservable, reaction, runInAction } from 'mobx'

/** Read/update LocalStorage, parse/stringify as JSON. */
export class LocalStorageStrStore {
	value: string | null = null

	constructor(readonly key: string) {
		makeAutoObservable(this)

		this.readFromLocalStorage()

		window.addEventListener('storage', this.handleStorageEvent)

		reaction(
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
