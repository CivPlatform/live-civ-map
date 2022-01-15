import PG from 'pg'

const { DATABASE_URL = 'postgres://localhost:5432/postgres' } = process.env

export const pool = new PG.Pool({
	connectionString: DATABASE_URL,
	ssl: DATABASE_URL.includes('//localhost:')
		? undefined
		: { rejectUnauthorized: false }, // heroku fix
})

// pool will emit error on behalf of idle clients (backend error, network partition)
pool.on('error', (err) => {
	console.error('[DB] Unexpected error on idle client:', err)
	process.exit(-1)
})
