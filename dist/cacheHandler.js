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
Object.defineProperty(exports, "__esModule", { value: true });
const pgclient_1 = require("./pgclient");
module.exports = class CacheHandler {
    constructor(options) {
        this.options = options;
        console.log('');
        (() => __awaiter(this, void 0, void 0, function* () { return yield (0, pgclient_1.createTableIfNotExists)(); }))();
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, pgclient_1.getData)(key);
        });
    }
    set(key, data, ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, pgclient_1.setData)(key, data, ctx);
        });
    }
    revalidateTag(tags) {
        return __awaiter(this, void 0, void 0, function* () {
            console.debug('Revalidating cache triggered for ', tags);
            (0, pgclient_1.revalidateTag)(tags);
        });
    }
};
//# sourceMappingURL=cacheHandler.js.map