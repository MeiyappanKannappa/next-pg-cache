const {createTableIfNotExists, getData, setData, revalidateTag} = require('./pgclient');



module.exports = class CacheHandler {
  options: any;
 
  constructor(options: any) {
    this.options = options
    console.log('');
    (async ()=> await createTableIfNotExists())();
    
  }
 
  async get(key: any) {
    // This could be stored anywhere, like durable storage
    console.debug('getting cache for ',key)
    return getData(key);
  }
 
  async set(key: any, data: any, ctx: any) {
    // This could be stored anywhere, like durable storage
    console.debug('Updating cache for ',key)
    setData(key, data, ctx);
  }
 
  async revalidateTag(tags: any) {
    console.debug('revalidating cache for ',tags)
    revalidateTag(tags);
  }
}