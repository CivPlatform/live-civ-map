import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import { checkUrlParamsLogin } from './DiscordLogin'
import './index.css'

checkUrlParamsLogin()

ReactDOM.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
	document.getElementById('root')
)
