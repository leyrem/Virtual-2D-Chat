var REDIS_CLIENT = require('./red.js').REDIS_CLIENT;


REDIS_CLIENT.connect();

REDIS_CLIENT.set_key_value("xd", "xd");