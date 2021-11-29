import {
	avatarUrlForUser,
	prepareOAuthLoginUrl,
	useDiscordProfile,
} from './DiscordLogin'

export function DiscordUserIcon(
	props: React.DetailedHTMLProps<
		React.ImgHTMLAttributes<HTMLImageElement>,
		HTMLImageElement
	>
) {
	const profile = useDiscordProfile()
	if (!profile) {
		return (
			<img
				src="/images/discord-bw.svg"
				alt="Discord Login"
				title="Log in with Discord"
				onClick={() => (document.location.href = prepareOAuthLoginUrl())}
				{...props}
				style={{ borderRadius: 999, opacity: 0.4, ...props.style }}
			/>
		)
	}
	const avatarUrl = avatarUrlForUser(profile)
	return (
		<img
			src={avatarUrl}
			alt="Discord avatar"
			title={`@${profile.username}#${profile.discriminator}`}
			{...props}
			style={{ borderRadius: 999, ...props.style }}
		/>
	)
}

export function DiscordUserRow() {
	const profile = useDiscordProfile()

	if (!profile) {
		return (
			<div onClick={() => (document.location.href = prepareOAuthLoginUrl())}>
				<img
					src="/images/discord-bw.svg"
					alt="Discord Login"
					style={{ borderRadius: 999 }}
				/>
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
