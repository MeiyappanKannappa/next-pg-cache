import pg from 'pg';
const { Client } = pg
const { Pool } = pg



async function getPgClient() {
  const con_details = {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DBNAME,
    password: process.env.POSTGRES_PASSWORD,
    port: 5432
  };

  return new Pool(con_details);
}

 async function createTableIfNotExists() {
  try {
    let c = await getPgClient();
    await c.connect(); 
    try {
      await c.query(`
        CREATE TABLE IF NOT EXISTS nextjs_cache (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL, 
          last_modified BIGINT NOT NULL,
          tags TEXT[] DEFAULT NULL
        );
      `);
      //console.log('Cache table created successfully!');
    } catch (queryError) {
      console.error('Error executing query:', queryError);
    } finally {
      c.end(); 
    }
  } catch (connectionError) {
    console.error('Error connecting to the database:', connectionError);
  }
}


async function queryDatabase() {
  let c ;
  try {
    c = await getPgClient();
    await c.connect(); 
    const result = await c.query('SELECT Now()');
    console.log(result.rows);
  } catch (error) {
    console.error('Error executing query:', error);
  } finally {
    // Always release the client back to the pool
    if(c){
      c.release();
    }
    
  }
}

async function getData(key ) {
  console.log("GET DATAAAAAAAAAA", key)
  let client ;
  console.time("Full time to get from DB")
  try {
    const c = await getPgClient();
    client = await c.connect(); 
    console.time("Just DB Query")
    const fetchQuery = `SELECT * from nextjs_cache where key='${key}'`;
    const result = await c.query(fetchQuery);
    console.timeEnd("Just DB Query")
    console.timeEnd("Full time to get from DB")
    return result?.rows?.[0]
  } catch (error) {
    console.error('Error executing query:', error);
    return
  } finally {
    // Always release the client back to the pool
    if(client){
      client.release();
    }
    return
  }
}

async function setData(key, data, ctx) {
  console.log("SET DATAAAAAAAAAA")
  let client ;
  try {
    const c = await getPgClient();
    client = await c.connect(); 
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
    console.log(upsertQuery);
    await c.query(upsertQuery, [key, JSON.stringify(data), lastModified, tags]);

    console.log(`Cache entry inserted for key: ${key}`);
  } catch (error) {
    console.error('Error setting cache to postgres:', error);
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function revalidateTag(tags) {
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

    console.log(`Cache entries for tags ${tags.join(', ')} invalidated.`);
  } catch (error) {
    console.error('Error revalidating cache:', error);
  } finally {
    if (client) {
      client.release();
    }
  }
}
module.exports = {
  createTableIfNotExists,
  queryDatabase,
  getData,
  setData,
  revalidateTag,
};