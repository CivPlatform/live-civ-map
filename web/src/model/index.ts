import { discordLoginStore } from './DiscordLogin'
import { LayerConfigsStore } from './LayerConfig'
import { LayerStatesStore } from './LayerState'

export class RootStore {
	login = discordLoginStore

	layerConfigs = new LayerConfigsStore('LiveCivMap:layers')

	layerStates = new LayerStatesStore()
}
