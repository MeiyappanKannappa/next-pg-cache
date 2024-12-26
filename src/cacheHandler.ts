import { createTableIfNotExists, getData, setData, revalidateTag } from './pgclient';



module.exports = class CacheHandler {
  options: any;
 
  constructor(options: any) {
    this.options = options
    console.log('');
    (async ()=> await createTableIfNotExists())();
    
  }
 
  async get(key: string) {

    return getData(key);
  }
 
  async set(key: string, data: string, ctx: any) {

    setData(key, data, ctx);
  }
 
  async revalidateTag(tags: any) {
    console.debug('Revalidating cache triggered for ',tags)
    revalidateTag(tags);
  }
}