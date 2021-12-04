import { makeObservable, observable, observe } from 'mobx'

/** Read/update LocalStorage, parse/stringify as JSON. */
export class LocalStorageStore<T extends {}> {
	/** as serialized in LocalStorage, to compare with new values to check for changes */
	private str: string | null = null

	value: T | undefined = undefined

	constructor(readonly key: string) {
		makeObservable<this, 'value'>(this, { value: observable })

		this.readFromLocalStorage()

		window.addEventListener('storage', this.handleStorageEvent)

		observe(
			() => this.value,
			() => {
				if (this.value === undefined || this.value === null) {
					this.str = null
					window.localStorage.removeItem(this.key)
				} else {
					this.str = JSON.stringify(this.value)
					window.localStorage.setItem(this.key, this.str)
				}
			}
		)
	}

	private handleStorageEvent = (e: StorageEvent) => {
		if (e.key === this.key) this.readFromLocalStorage()
	}

	dispose() {
		window.removeEventListener('storage', this.handleStorageEvent)
	}

	private readFromLocalStorage() {
		const str = window.localStorage.getItem(this.key)
		if (str === this.str) return // no change
		this.str = str
		if (str) this.value = JSON.parse(str)
		else this.value = undefined
	}
}
