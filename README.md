# next-pg-cache

A Next.js handler for caching database queries using PostgreSQL.

This package provides a middleware solution for Next.js applications to leverage PostgreSQL as a caching layer. By caching database query results, you can significantly improve the performance and scalability of your application.

## Installation
Install the package using npm:

Bash
```
npm install nextjs-pg-cache
```

## Usage
### 1. Install the middleware:

In your next.config.js file, add the following configuration:

JavaScript
```
module.exports = {
  cacheHandler: require.resolve('nextjs-pg-cache'),
  cacheMaxMemorySize: 0, // Disable in-memory cache (optional)
};
```
### 2. (Optional) Create the cache table:

You can optionally create a table in your PostgreSQL database to store the cached data. Run the following SQL script to create the table named nextjs_cache:

SQL
```
CREATE UNLOGGED TABLE IF NOT EXISTS public.nextjs_cache (
  key character varying COLLATE pg_catalog."default" NOT NULL,
  value jsonb NOT NULL,
  last_modified bigint NOT NULL,
  tags text[] COLLATE pg_catalog."default",
  CONSTRAINT nextjs_cache_pkey PRIMARY KEY (key)
);
```
### 3. Caching database queries:

The middleware automatically caches the results of database queries executed within your Next.js application. You don't need to modify your existing code to leverage the cache.

### 4. Configuration options:

cacheMaxMemorySize (optional): Controls the maximum size (in bytes) of the in-memory cache. Setting it to 0 disables the in-memory cache and relies solely on the PostgreSQL database for caching.

Below are required and optional env
```
# MANDATORY ENV
POSTGRES_USER=postgres
POSTGRES_PASSWORD=admin
POSTGRES_DBNAME=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
# OPTIONAL ENV PARAMS
CONNECTION_TIMEOUT_MILLIS= DEFAULT 0,
IDLE_TIMEOUT_MILLIS= DEFAULT 10000,
MAX_CONNECTIONS= DEFAULT 10,
ALLOW_EXIT_ON_IDLE= DEFAULT false,

DB_SSL_ENABLED=true
# IF DB_SSL_ENABLED true
CA_CRT_PATH=<CA_CERT_PATH>
KEY_PATH=<KEY_PATH>
CERT_PATH=<CERT_PATH>
```

### 5. Reporting issues:

Please report any issues or feature requests on the GitHub repository:

[[Create Issue Here]](https://github.com/MeiyappanKannappa/next-pg-cache/issues)
