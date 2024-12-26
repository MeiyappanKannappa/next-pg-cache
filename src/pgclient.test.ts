import { getPgClient, createTableIfNotExists, queryDatabase, getData, setData, revalidateTag } from './pgclient';
import pg from 'pg';
import * as fs from 'fs';


jest.mock('pg', () => {
  const mClient = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mClient) };
});

jest.mock('fs', () => ({
    readFileSync: jest.fn().mockReturnValue('dummy-cert'),
}));

describe('Test Table Creation', () => {
  let client;
  beforeEach(async () => {
    client = await getPgClient();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should success', async () => {
    const createTableQuery = `
        CREATE UNLOGGED TABLE IF NOT EXISTS nextjs_cache (
          key TEXT PRIMARY KEY,
          value jsonb NOT NULL, 
          last_modified BIGINT NOT NULL,
          tags TEXT[] DEFAULT NULL
        );
      `;
    //client.query.mockResolvedValueOnce({ query:"CREATE UNLOGGED TABLE IF NOT EXISTS nextjs_cache", rows: [], rowCount: 0 });
    await createTableIfNotExists();
    expect(client.query).toHaveBeenCalledWith(createTableQuery)
    expect(client.query).toHaveBeenCalledTimes(1);

  });

  it('should log an error if table creation fails', async () => {
          // Mock query failure
    client.query.mockRejectedValueOnce(new Error('Query failed'));
    console.warn = jest.fn();
    await createTableIfNotExists();
    expect(console.warn).toHaveBeenCalledWith('[next-pg-cache] Unable to create table:', expect.any(Error));
  });

});

  describe('getPgClient', () => {
    it('should create a connection pool with SSL enabled', async () => {
      // Set env variables for SSL
      process.env.DB_SSL_ENABLED = 'true';
      process.env.CA_CRT_PATH = 'dummy/path';
      process.env.KEY_PATH = 'dummy/key';
      process.env.CERT_PATH = 'dummy/cert';

      const client = await getPgClient();

      expect(client).toBeDefined();
      expect(fs.readFileSync).toHaveBeenCalledTimes(3); // CA, key, cert
    });

    it('should create a connection pool without SSL', async () => {
      process.env.DB_SSL_ENABLED = 'false';

      const client = await getPgClient();

      expect(pg.Pool).toHaveBeenCalledTimes(2);
      expect(client).toBeDefined()
    });

    it('should handle missing environment variables gracefully', async () => {
      process.env.DB_SSL_ENABLED = 'true';
      process.env.CA_CRT_PATH = '';
      process.env.KEY_PATH = '';
      process.env.CERT_PATH = '';

      const client = await getPgClient();

      expect(pg.Pool).toHaveBeenCalledTimes(3);
      expect(client).toBeDefined()
    });
  });

  describe('queryDatabase', () => {
    let client;
    beforeEach(async () => {
        client = await getPgClient();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should execute a query and log the result', async () => {
      // Mock successful query
      client.query.mockResolvedValueOnce({ rows: ['result'] });

      console.log = jest.fn();

      await queryDatabase();

      expect(client.query).toHaveBeenCalledWith('SELECT Now()');
      expect(console.log).toHaveBeenCalledWith(['result']);
    });

    it('should log an error if query execution fails', async () => {
      // Mock query failure
      client.query.mockRejectedValueOnce(new Error('Query failed'));
      console.error = jest.fn();
      await queryDatabase();
      expect(console.error).toHaveBeenCalledWith('[next-pg-cache] Error executing query:', expect.any(Error));
    });
  });
  describe('Get Cache data', () => {
    let client;
    beforeEach(async () => {
        client = await getPgClient();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should return the cached data for a given key', async () => {
        const key = '/favicon.ico';
        const fakeData = { key: '/favicon.ico', value:  'some data' , last_modified: 12345 };
      
        // Mock successful query
        client.query.mockResolvedValueOnce({ rows: [fakeData] });
      
        const result = await getData(key);
        console.log('rrrresult  ',result)
        
        expect(client.query).toHaveBeenCalledWith(`SELECT * from nextjs_cache where key='${key}'`);
        expect(client.query).toHaveBeenCalledTimes(1) 
      });

    it('should handle errors gracefully', async () => {
      const key = 'some-key';

      // Mock query failure
      client.query.mockRejectedValueOnce(new Error('Query failed'));

      console.error = jest.fn();

      const result = await getData(key);

      expect(console.error).toHaveBeenCalledWith('[next-pg-cache] Error executing query:', expect.any(Error));
      
      expect(result).toBeUndefined();
    });
  });


describe('Set Cache data', () => {
    let mockedPool;
    beforeEach(async () => {
        mockedPool = await getPgClient();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should insert or update data in the cache', async () => {
      const key = 'some-key';
      const data = 'some-data';
      const ctx = { tags: ['tag1', 'tag2'] };

      // Mock successful query
      mockedPool.query.mockResolvedValueOnce({});

      await setData(key, data, ctx);
     
      expect(mockedPool.query).toHaveBeenCalledTimes(1)
    });

    it('should log an error if setting cache data fails', async () => {
      const key = 'some-key';
      const data = 'some-data';
      const ctx = { tags: ['tag1'] };

      // Mock query failure
      mockedPool.query.mockRejectedValueOnce(new Error('Query failed'));

      console.error = jest.fn();

      await setData(key, data, ctx);

      expect(console.error).toHaveBeenCalledWith('[next-pg-cache] Error setting cache to postgres:', expect.any(Error));
    });
  });

  // Test for revalidateTag
  describe('revalidateTag', () => {
    let mockedPool;
    beforeEach(async () => {
        mockedPool = await getPgClient();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should delete cache entries by tag', async () => {
      const tags = ['tag1', 'tag2'];

      // Mock successful query
      mockedPool.query.mockResolvedValueOnce({});

      console.log = jest.fn();

      await revalidateTag(tags);

      expect(mockedPool.query).toHaveBeenCalledTimes(2);
      expect(console.log).toHaveBeenCalledWith('[next-pg-cache] Cache entries for tags tag1, tag2 invalidated.');
    });

    it('should log an error if cache invalidation fails', async () => {
      const tags = ['tag1'];

      // Mock query failure
      mockedPool.query.mockRejectedValueOnce(new Error('Query failed'));

      console.error = jest.fn();

      await revalidateTag(tags);

      expect(console.error).toHaveBeenCalledWith('[next-pg-cache] Error revalidating cache:', expect.any(Error));
    });
  });


