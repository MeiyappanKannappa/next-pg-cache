import pg from 'pg';
import * as fs from 'fs';
const { Pool } = pg



export async function getPgClient() {
  const con_details = {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DBNAME,
    password: process.env.POSTGRES_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
    connectionTimeoutMillis: Number(process.env.CONNECTION_TIMEOUT_MILLIS) || 0,
    idleTimeoutMillis:  Number(process.env.IDLE_TIMEOUT_MILLIS) || 10000,
    max: Number(process.env.MAX_CONNECTIONS) || 10,
    allowExitOnIdle: Boolean(process.env.ALLOW_EXIT_ON_IDLE) || false,
  };
  if(process.env.DB_SSL_ENABLED){
    const ssl = {
        rejectUnauthorized: false,
        ca: fs.readFileSync(process.env.CA_CRT_PATH).toString(),
        key: fs.readFileSync(process.env.KEY_PATH).toString(),
        cert: fs.readFileSync(process.env.CERT_PATH).toString(),
    }
    const config = {ssl, ...con_details}
    return new Pool(config);
  }else{
    const con_details = {
      user: process.env.POSTGRES_USER,
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DBNAME,
      password: process.env.POSTGRES_PASSWORD,
      port: 5432
    };
    return new Pool(con_details);
  }
  
}


export async function createTableIfNotExists() {
  try {
    let c = await getPgClient();
    try {
      const createTableQuery = `
        CREATE UNLOGGED TABLE IF NOT EXISTS nextjs_cache (
          key TEXT PRIMARY KEY,
          value jsonb NOT NULL, 
          last_modified BIGINT NOT NULL,
          tags TEXT[] DEFAULT NULL
        );
      `;
      await c.query(createTableQuery);
      //console.log('Cache table created successfully!');
    } catch (queryError) {
      console.warn('[next-pg-cache] Unable to create table:', queryError);
    } 
  } catch (connectionError) {
    console.error('[next-pg-cache] Error connecting to the database:', connectionError);
  }
}


export async  function queryDatabase() {
  let c: pg.Pool ;
  try {
    c = await getPgClient();
    await c.connect(); 
    const result = await c.query('SELECT Now()');
    console.log(result?.rows);
  } catch (error) {
    console.error('[next-pg-cache] Error executing query:', error);
  } 
}

export async function getData(key: string) {
  console.time(`[next-pg-cache] Time to get data from cache for key ${key}`)
  try {
    const c = await getPgClient();
    const fetchQuery = `SELECT * from nextjs_cache where key='${key}'`;
    const result = await c.query(fetchQuery);
    return result?.rows?.[0]
  } catch (error) {
    console.error('[next-pg-cache] Error executing query:', error);
    return
  } finally {
    console.timeEnd(`[next-pg-cache] Time to get data from cache for key ${key}`)
    return
  }
}

export async function setData(key: string, data: string, ctx: any) {
  try {
    console.time(`[next-pg-cache] Time to set cache data ${key}`)
    const c = await getPgClient();
    const lastModified = Date.now();
    const tags = ctx.tags || []; // Handle potential undefined tags
    const upsertQuery = `
      INSERT INTO nextjs_cache (key, value, last_modified, tags)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT(key)
      DO UPDATE SET
        value = EXCLUDED.value,
        last_modified = EXCLUDED.last_modified,
        tags = EXCLUDED.tags
    `;
    await c.query(upsertQuery, [key, JSON.stringify(data), lastModified, tags]);
    
  } catch (error) {
    console.error('[next-pg-cache] Error setting cache to postgres:', error);
    return
  } finally {
    console.timeEnd(`[next-pg-cache] Time to set cache data ${key}`)
    return
  }
}

export async function revalidateTag(tags) {
  let client ;
  try {
    const c = await getPgClient();
    client = await c.connect();
    tags = [tags].flat();

    for (const tag of tags) {
      await c.query(`
        DELETE FROM cache
        WHERE tags @> ARRAY[$1]
      `, [tag]);
    }

    console.log(`[next-pg-cache] Cache entries for tags ${tags.join(', ')} invalidated.`);
  } catch (error) {
    console.error('[next-pg-cache] Error revalidating cache:', error);
    return
  } finally {
    return
  }
}
