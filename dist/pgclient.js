"use strict";
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
exports.createTableIfNotExists = createTableIfNotExists;
exports.queryDatabase = queryDatabase;
exports.getData = getData;
exports.setData = setData;
exports.revalidateTag = revalidateTag;
const pg_1 = __importDefault(require("pg"));
const { Pool } = pg_1.default;
const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'admin',
    port: Number(process.env.PORT) || 5432, // Default PostgreSQL port
});
function createTableIfNotExists() {
    return __awaiter(this, void 0, void 0, function* () {
        let client;
        try {
            client = yield pool.connect().catch(console.error);
            yield client.query(`
      CREATE TABLE IF NOT EXISTS nextjs_cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL, 
        last_modified BIGINT NOT NULL,
        tags TEXT[] DEFAULT NULL
      );
    `).catch((err) => console.error(err));
            console.log('Table created successfully!');
        }
        catch (error) {
            console.error('Unable to create cache table:', error);
        }
        finally {
            if (client) {
                client.release();
            }
        }
    });
}
function queryDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        let client;
        try {
            client = yield pool.connect();
            const result = yield client.query('SELECT Now()');
            console.log(result.rows);
        }
        catch (error) {
            console.error('Error executing query:', error);
        }
        finally {
            // Always release the client back to the pool
            if (client) {
                client.release();
            }
        }
    });
}
function getData(key) {
    return __awaiter(this, void 0, void 0, function* () {
        let client;
        try {
            client = yield pool.connect();
            const result = yield client.query(`SELECT * from nextjs_cache where key=${key}`);
            console.log(result.rows);
        }
        catch (error) {
            console.error('Error executing query:', error);
        }
        finally {
            // Always release the client back to the pool
            if (client) {
                client.release();
            }
        }
    });
}
function setData(key, data, ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        let client;
        try {
            client = yield pool.connect();
            const lastModified = Date.now();
            const tags = ctx.tags || []; // Handle potential undefined tags
            yield client.query(`
      INSERT INTO cache (key, value, last_modified, tags)
      VALUES ($1, $2, $3, $4)
    `, [key, JSON.stringify(data), lastModified, tags]);
            console.log(`Cache entry inserted for key: ${key}`);
        }
        catch (error) {
            console.error('Error setting cache to postgres:', error);
        }
        finally {
            if (client) {
                client.release();
            }
        }
    });
}
function revalidateTag(tags) {
    return __awaiter(this, void 0, void 0, function* () {
        let client;
        try {
            client = yield pool.connect();
            tags = [tags].flat();
            for (const tag of tags) {
                yield client.query(`
        DELETE FROM cache
        WHERE tags @> ARRAY[$1]
      `, [tag]);
            }
            console.log(`Cache entries for tags ${tags.join(', ')} invalidated.`);
        }
        catch (error) {
            console.error('Error revalidating cache:', error);
        }
        finally {
            if (client) {
                client.release();
            }
        }
    });
}
//# sourceMappingURL=pgclient.js.map