export interface Feature {
	/** should never be exposed to user */
	id: string
	data: { [k: string]: any }
	creator_id: string
	created_ts: number
	last_editor_id: string
	last_edited_ts: number
}
