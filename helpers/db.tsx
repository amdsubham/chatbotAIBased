import {type GeneratedAlways, Kysely, CamelCasePlugin} from 'kysely'
import {PostgresJSDialect} from 'kysely-postgres-js'
import {DB} from './schema'
import postgres from 'postgres'

// Ensure loadEnv.js is loaded first to set FLOOT_DATABASE_URL
import '../loadEnv.js'

const databaseUrl = process.env.FLOOT_DATABASE_URL || process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('FLOOT_DATABASE_URL or DATABASE_URL must be set')
}

// Log database connection info (without exposing password)
const dbInfo = databaseUrl.match(/postgres(?:ql)?:\/\/([^:]+):[^@]+@([^\/]+)\/(.+)/);
if (dbInfo) {
  console.log(`📊 Database connection: ${dbInfo[1]}@${dbInfo[2]}/${dbInfo[3]}`);
} else {
  console.log(`📊 Database URL: ${databaseUrl.substring(0, 50)}...`);
}

export const db = new Kysely<DB>({
plugins: [new CamelCasePlugin()],
dialect: new PostgresJSDialect({
postgres: postgres(databaseUrl, {
prepare: false,
idle_timeout: 30, // Increased from 10 to 30 seconds
max: 10, // Increased from 3 to 10 connections
max_lifetime: 60 * 30, // 30 minutes
connection: {
  application_name: 'chatbot-auspost-ai-support',
},
}),
}),
})