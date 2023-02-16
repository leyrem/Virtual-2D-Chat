const redis = require('redis');

var REDIS_CLIENT = {
  redis_client: null,

  connect: async function()
  {
    try {
      // Asumming there is a redis server running locally
      this.redis_client = redis.createClient();
      await this.redis_client.connect();
      console.log("[REDIS] Connected to Redis!");
    } catch(err) {
      console.error(err);
    }
    
  },

  set_key_value: async function( key, val )
  {
    try {
      await this.redis_client.set(key, val);
      console.log(`[REDIS] Set { ${key} : ${val} }`);
    } catch(e) {
      console.error(e);
    }
  },

  get_value_from_key: async function ( key )
  {
    try {
      const val = await this.redis_client.get(key);
      console.log("[REDIS] Got val: " +  val + ", for key: " + key);
      return val;
    } catch (e) {
      console.error(e);
    }
  },

  quit: async function()
  {
    try {
      await this.redis_client.quit();
      console.log("[REDIS] Disconnected from Redis!");
    } catch (e) {
      console.error(e);
    }
  },
};

module.exports = {REDIS_CLIENT};

// async function nodeRedisDemo() {
//   try {
//     const client = redis.createClient();
//     await client.connect();

//     await client.set('mykey2', 'Hello from node redis');
//     const myKeyValue = await client.get('mykey');
//     console.log(myKeyValue);

//     // const numAdded = await client.zAdd('vehicles', [
//     //   {
//     //     score: 4,
//     //     value: 'car',
//     //   },
//     //   {
//     //     score: 2,
//     //     value: 'bike',
//     //   },
//     // ]);
//     // console.log(`Added ${numAdded} items.`);

//     // for await (const { score, value } of client.zScanIterator('vehicles')) {
//     //   console.log(`${value} -> ${score}`);
//     // }

//     await client.quit();
//   } catch (e) {
//     console.error(e);
//   }
// }

// nodeRedisDemo();