const express = require('express');
const userRouter = require('./users/routes');

// const MongoClient = require('mongodb').MongoClient;
const { initDB } = require('./users/controllers');

module.exports = class UserServer {
  constructor() {
    this.server = null;
    this.port = null;
  }

  start() {
    this.initServer();
    this.initMiddlewares();
    this.initRoutes();
    this.setupDB();
    this.startListening();
  }

  initServer() {
    this.server = express();
    this.port = 5000;
  }

  initMiddlewares() {
    this.server.use(express.json());
  }

  initRoutes() {
    this.server.use(userRouter);
  }

  async setupDB() {
    await initDB()
    // const dbUrl = 'mongodb+srv://admin:Wa2BEGL0Czs2Xcpn@cluster0-hp8cu.mongodb.net/db-users?retryWrites=true&w=majority';
    // const client = await MongoClient.connect(dbUrl);
    // console.log("Connected successfully to db");

    // const db = client.db('db-users');
    // const usersCollection = db.collection('users');
    // const statsCollection = db.collection('statistics');
    // await checkUsersInDb(usersCollection);
    // await checkStatsInDb(statsCollection);
     
    // client.close();
  }

  startListening() {
    this.server.listen(this.port, () => {
      console.log(`Server is running on port ${this.port}`);
    });
  }
};
