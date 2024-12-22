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
//(0, pgclient_1.createTableIfNotExists)();
const CacheHandler = (options) => {
    console.log("Options passed to cache handler ", options);
    const get = (key) => __awaiter(void 0, void 0, void 0, function* () {
        console.debug('getting cache for ', key);
        return (0, pgclient_1.getData)(key);
    });
    const set = (key, data, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        console.debug('Updating cache for ', key);
        (0, pgclient_1.setData)(key, data, ctx);
    });
    const revalidateTag = (tags) => __awaiter(void 0, void 0, void 0, function* () {
        console.debug('revalidating cache for ', tags);
        revalidateTag(tags);
    });
    return {
        get,
        set,
        revalidateTag,
    };
};
exports.default = CacheHandler;
//# sourceMappingURL=cacheHandler.js.map