"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pgclient_1 = require("./pgclient");
const pg_1 = __importDefault(require("pg"));
const fs = __importStar(require("fs"));
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
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        client = yield (0, pgclient_1.getPgClient)();
    }));
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should success', () => __awaiter(void 0, void 0, void 0, function* () {
        const createTableQuery = `
        CREATE UNLOGGED TABLE IF NOT EXISTS nextjs_cache (
          key TEXT PRIMARY KEY,
          value jsonb NOT NULL, 
          last_modified BIGINT NOT NULL,
          tags TEXT[] DEFAULT NULL
        );
      `;
        //client.query.mockResolvedValueOnce({ query:"CREATE UNLOGGED TABLE IF NOT EXISTS nextjs_cache", rows: [], rowCount: 0 });
        yield (0, pgclient_1.createTableIfNotExists)();
        expect(client.query).toHaveBeenCalledWith(createTableQuery);
        expect(client.query).toHaveBeenCalledTimes(1);
    }));
    it('should log an error if table creation fails', () => __awaiter(void 0, void 0, void 0, function* () {
        // Mock query failure
        client.query.mockRejectedValueOnce(new Error('Query failed'));
        console.warn = jest.fn();
        yield (0, pgclient_1.createTableIfNotExists)();
        expect(console.warn).toHaveBeenCalledWith('[next-pg-cache] Unable to create table:', expect.any(Error));
    }));
});
describe('getPgClient', () => {
    it('should create a connection pool with SSL enabled', () => __awaiter(void 0, void 0, void 0, function* () {
        // Set env variables for SSL
        process.env.DB_SSL_ENABLED = 'true';
        process.env.CA_CRT_PATH = 'dummy/path';
        process.env.KEY_PATH = 'dummy/key';
        process.env.CERT_PATH = 'dummy/cert';
        const client = yield (0, pgclient_1.getPgClient)();
        expect(client).toBeDefined();
        expect(fs.readFileSync).toHaveBeenCalledTimes(3); // CA, key, cert
    }));
    it('should create a connection pool without SSL', () => __awaiter(void 0, void 0, void 0, function* () {
        process.env.DB_SSL_ENABLED = 'false';
        const client = yield (0, pgclient_1.getPgClient)();
        expect(pg_1.default.Pool).toHaveBeenCalledTimes(2);
        expect(client).toBeDefined();
    }));
    it('should handle missing environment variables gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
        process.env.DB_SSL_ENABLED = 'true';
        process.env.CA_CRT_PATH = '';
        process.env.KEY_PATH = '';
        process.env.CERT_PATH = '';
        const client = yield (0, pgclient_1.getPgClient)();
        expect(pg_1.default.Pool).toHaveBeenCalledTimes(3);
        expect(client).toBeDefined();
    }));
});
describe('queryDatabase', () => {
    let client;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        client = yield (0, pgclient_1.getPgClient)();
    }));
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should execute a query and log the result', () => __awaiter(void 0, void 0, void 0, function* () {
        // Mock successful query
        client.query.mockResolvedValueOnce({ rows: ['result'] });
        console.log = jest.fn();
        yield (0, pgclient_1.queryDatabase)();
        expect(client.query).toHaveBeenCalledWith('SELECT Now()');
        expect(console.log).toHaveBeenCalledWith(['result']);
    }));
    it('should log an error if query execution fails', () => __awaiter(void 0, void 0, void 0, function* () {
        // Mock query failure
        client.query.mockRejectedValueOnce(new Error('Query failed'));
        console.error = jest.fn();
        yield (0, pgclient_1.queryDatabase)();
        expect(console.error).toHaveBeenCalledWith('[next-pg-cache] Error executing query:', expect.any(Error));
    }));
});
describe('Get Cache data', () => {
    let client;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        client = yield (0, pgclient_1.getPgClient)();
    }));
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should return the cached data for a given key', () => __awaiter(void 0, void 0, void 0, function* () {
        const key = '/favicon.ico';
        const fakeData = { key: '/favicon.ico', value: 'some data', last_modified: 12345 };
        // Mock successful query
        client.query.mockResolvedValueOnce({ rows: [fakeData] });
        const result = yield (0, pgclient_1.getData)(key);
        console.log('rrrresult  ', result);
        expect(client.query).toHaveBeenCalledWith(`SELECT * from nextjs_cache where key='${key}'`);
        expect(client.query).toHaveBeenCalledTimes(1);
    }));
    it('should handle errors gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
        const key = 'some-key';
        // Mock query failure
        client.query.mockRejectedValueOnce(new Error('Query failed'));
        console.error = jest.fn();
        const result = yield (0, pgclient_1.getData)(key);
        expect(console.error).toHaveBeenCalledWith('[next-pg-cache] Error executing query:', expect.any(Error));
        expect(result).toBeUndefined();
    }));
});
describe('Set Cache data', () => {
    let mockedPool;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        mockedPool = yield (0, pgclient_1.getPgClient)();
    }));
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should insert or update data in the cache', () => __awaiter(void 0, void 0, void 0, function* () {
        const key = 'some-key';
        const data = 'some-data';
        const ctx = { tags: ['tag1', 'tag2'] };
        // Mock successful query
        mockedPool.query.mockResolvedValueOnce({});
        yield (0, pgclient_1.setData)(key, data, ctx);
        expect(mockedPool.query).toHaveBeenCalledTimes(1);
    }));
    it('should log an error if setting cache data fails', () => __awaiter(void 0, void 0, void 0, function* () {
        const key = 'some-key';
        const data = 'some-data';
        const ctx = { tags: ['tag1'] };
        // Mock query failure
        mockedPool.query.mockRejectedValueOnce(new Error('Query failed'));
        console.error = jest.fn();
        yield (0, pgclient_1.setData)(key, data, ctx);
        expect(console.error).toHaveBeenCalledWith('[next-pg-cache] Error setting cache to postgres:', expect.any(Error));
    }));
});
// Test for revalidateTag
describe('revalidateTag', () => {
    let mockedPool;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        mockedPool = yield (0, pgclient_1.getPgClient)();
    }));
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should delete cache entries by tag', () => __awaiter(void 0, void 0, void 0, function* () {
        const tags = ['tag1', 'tag2'];
        // Mock successful query
        mockedPool.query.mockResolvedValueOnce({});
        console.log = jest.fn();
        yield (0, pgclient_1.revalidateTag)(tags);
        expect(mockedPool.query).toHaveBeenCalledTimes(2);
        expect(console.log).toHaveBeenCalledWith('[next-pg-cache] Cache entries for tags tag1, tag2 invalidated.');
    }));
    it('should log an error if cache invalidation fails', () => __awaiter(void 0, void 0, void 0, function* () {
        const tags = ['tag1'];
        // Mock query failure
        mockedPool.query.mockRejectedValueOnce(new Error('Query failed'));
        console.error = jest.fn();
        yield (0, pgclient_1.revalidateTag)(tags);
        expect(console.error).toHaveBeenCalledWith('[next-pg-cache] Error revalidating cache:', expect.any(Error));
    }));
});
//# sourceMappingURL=pgclient.test.js.map