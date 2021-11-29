export const layerSlugFromUrl = (url: string) =>
	url
		.replace(/^wss:\/\//, '')
		.replaceAll('/', '_') // XXX this is destructive; how else can we escape slashes?
		.replace(/[?#].*/, '')

export const layerUrlFromSlug = (slug: string) =>
	(slug.includes(':__') ? slug : 'wss://' + slug).replaceAll('_', '/')
