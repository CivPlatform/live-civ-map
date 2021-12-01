export function layerSlugFromUrl(url: string) {
	url = url.replace(/^wss?:\/\//, '')
	return encodeURIComponent(url)
}

export function layerUrlFromSlug(slug: string) {
	slug = decodeURIComponent(slug)
	slug = slug.match(/^localhost[:/].*/) ? 'ws://' + slug : 'wss://' + slug
	return slug
}
