import { ObservableMap } from 'mobx'
import { v4 as randomUUID } from 'uuid'
import { DiscordUser } from '../DiscordLogin'
import { Feature } from '../Feature'

export interface LayerStateStore {
	/** URL host:port */
	mapServer: string

	featuresById: ObservableMap<string, Feature>
	numFeatures: number

	/** undefined means not known yet, waiting to be informed by server */
	permissions?: LayerPerms
	/** if this is defined, the client has authenticated as a Discord account */
	dUser?: DiscordUser
	/** if the layer provides log-in, this is the Discord App to authenticate against */
	loginDiscordAppId?: string

	// these are only defined when editing is possible (e.g., not JSON-backed)
	// TODO don't define when no perms?
	createFeature?: (featurePartial: FeatureCreateDTO) => string
	updateFeature?: (featurePartial: FeatureUpdateDTO) => void
	deleteFeature?: (feature: FeatureDeleteDTO) => void
}

export interface LayerPerms {
	/** read features created by any user. required to connect */
	read?: boolean
	/** create features, update/delete features created by the same user */
	write_self?: boolean
	/** update/delete features created by other users */
	write_other?: boolean
	/** change permissions of other users; add new users */
	manage?: boolean
}

export type FeatureCreateDTO = Omit<
	Feature,
	'id' | 'creator_id' | 'created_ts' | 'last_editor_id' | 'last_edited_ts'
>

export type FeatureUpdateDTO = Omit<
	Feature,
	'creator_id' | 'created_ts' | 'last_editor_id' | 'last_edited_ts'
>

export type FeatureDeleteDTO = Pick<Feature, 'id' | 'creator_id'>

export const makeFeatureId = () => randomUUID()
