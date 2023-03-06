/* eslint-disable global-require */
require('dotenv').config()
const MongoClient = require('mongodb').MongoClient;

const getMongoDb = async () => {
    const uri = process.env.MONGO_HOST;
    const client = await MongoClient.connect(uri,
     { useNewUrlParser: true, useUnifiedTopology: true });
    
     return client.db('aerialoop');
};

module.exports = getMongoDb;
