import { createContext } from 'react'
import { discordLoginStore } from './DiscordLogin'
import { LayerConfigsStore } from './LayerConfig'
import { LayerStatesStore } from './LayerState'

export class RootStore {
	login = discordLoginStore

	layerConfigs = new LayerConfigsStore('LiveCivMap:layers')

	layerStates = new LayerStatesStore()
}

// The defaultValue argument is only used when a component does not have a matching Provider above it in the tree.
// Passing undefined as a Provider value does not cause consuming components to use defaultValue.
export const MobxContext = createContext<RootStore>(undefined!)
