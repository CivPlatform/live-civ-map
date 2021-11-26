import {
	avatarUrlForUser,
	prepareOAuthLoginUrl,
	useDiscordProfile,
} from './DiscordLogin'

export function DiscordUserIcon() {
	const profile = useDiscordProfile()

	if (!profile) {
		return (
			<div onClick={() => (document.location.href = prepareOAuthLoginUrl())}>
				<img src="" alt="" />
				<span>Log in with Discord</span>
			</div>
		)
	}
	const avatarUrl = avatarUrlForUser(profile)
	return (
		<div>
			<img src={avatarUrl} alt="Discord avatar" style={{ borderRadius: 999 }} />
			<span>
				@{profile.username}#{profile.discriminator}
			</span>
		</div>
	)
}
