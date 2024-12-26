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
exports.getPgClient = getPgClient;
exports.createTableIfNotExists = createTableIfNotExists;
exports.queryDatabase = queryDatabase;
exports.getData = getData;
exports.setData = setData;
exports.revalidateTag = revalidateTag;
const pg_1 = __importDefault(require("pg"));
const fs = __importStar(require("fs"));
const { Pool } = pg_1.default;
function getPgClient() {
    return __awaiter(this, void 0, void 0, function* () {
        const con_details = {
            user: process.env.POSTGRES_USER,
            host: process.env.POSTGRES_HOST,
            database: process.env.POSTGRES_DBNAME,
            password: process.env.POSTGRES_PASSWORD,
            port: Number(process.env.DB_PORT) || 5432,
            connectionTimeoutMillis: Number(process.env.CONNECTION_TIMEOUT_MILLIS) || 0,
            idleTimeoutMillis: Number(process.env.IDLE_TIMEOUT_MILLIS) || 10000,
            max: Number(process.env.MAX_CONNECTIONS) || 10,
            allowExitOnIdle: Boolean(process.env.ALLOW_EXIT_ON_IDLE) || false,
        };
        if (process.env.DB_SSL_ENABLED) {
            const ssl = {
                rejectUnauthorized: false,
                ca: fs.readFileSync(process.env.CA_CRT_PATH).toString(),
                key: fs.readFileSync(process.env.KEY_PATH).toString(),
                cert: fs.readFileSync(process.env.CERT_PATH).toString(),
            };
            const config = Object.assign({ ssl }, con_details);
            return new Pool(config);
        }
        else {
            const con_details = {
                user: process.env.POSTGRES_USER,
                host: process.env.POSTGRES_HOST,
                database: process.env.POSTGRES_DBNAME,
                password: process.env.POSTGRES_PASSWORD,
                port: 5432
            };
            return new Pool(con_details);
        }
    });
}
function createTableIfNotExists() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let c = yield getPgClient();
            try {
                yield c.query(`
        CREATE UNLOGGED TABLE IF NOT EXISTS nextjs_cache (
          key TEXT PRIMARY KEY,
          value jsonb NOT NULL, 
          last_modified BIGINT NOT NULL,
          tags TEXT[] DEFAULT NULL
        );
      `);
                //console.log('Cache table created successfully!');
            }
            catch (queryError) {
                console.warn('[nxt-pg-cache] Unable to create table:', queryError);
            }
        }
        catch (connectionError) {
            console.error('nxt-pg-cache] Error connecting to the database:', connectionError);
        }
    });
}
function queryDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        let c;
        try {
            c = yield getPgClient();
            yield c.connect();
            const result = yield c.query('SELECT Now()');
            console.log(result.rows);
        }
        catch (error) {
            console.error('nxt-pg-cache] Error executing query:', error);
        }
    });
}
function getData(key) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        console.time(`nxt-pg-cache] Time to get data from cache for key ${key}`);
        try {
            const c = yield getPgClient();
            const fetchQuery = `SELECT * from nextjs_cache where key='${key}'`;
            const result = yield c.query(fetchQuery);
            return (_a = result === null || result === void 0 ? void 0 : result.rows) === null || _a === void 0 ? void 0 : _a[0];
        }
        catch (error) {
            console.error('nxt-pg-cache] Error executing query:', error);
            return;
        }
        finally {
            console.timeEnd(`nxt-pg-cache] Time to get data from cache for key ${key}`);
            return;
        }
    });
}
function setData(key, data, ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.time(`nxt-pg-cache] Time to set cache data ${key}`);
            const c = yield getPgClient();
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
            yield c.query(upsertQuery, [key, JSON.stringify(data), lastModified, tags]);
        }
        catch (error) {
            console.error('nxt-pg-cache] Error setting cache to postgres:', error);
            return;
        }
        finally {
            console.timeEnd(`nxt-pg-cache] Time to set cache data ${key}`);
            return;
        }
    });
}
function revalidateTag(tags) {
    return __awaiter(this, void 0, void 0, function* () {
        let client;
        try {
            const c = yield getPgClient();
            client = yield c.connect();
            tags = [tags].flat();
            for (const tag of tags) {
                yield c.query(`
        DELETE FROM cache
        WHERE tags @> ARRAY[$1]
      `, [tag]);
            }
            console.log(`nxt-pg-cache] Cache entries for tags ${tags.join(', ')} invalidated.`);
        }
        catch (error) {
            console.error('nxt-pg-cache] Error revalidating cache:', error);
            return;
        }
        finally {
            return;
        }
    });
}
//# sourceMappingURL=pgclient.js.map