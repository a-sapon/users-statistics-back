const fs = require('fs');
const path = require('path');
const Joi = require('@hapi/joi');
const MongoClient = require('mongodb').MongoClient;
const dbUrl =
  'mongodb+srv://admin:Wa2BEGL0Czs2Xcpn@cluster0-hp8cu.mongodb.net/db-users?retryWrites=true&w=majority';
const usersPath = path.join(__dirname, '..', 'db', 'users.json');
const statsPath = path.join(__dirname, '..', 'db', 'users_statistic.json');
let usersCollection;
let statsCollection;

async function initDB() {
  const client = await MongoClient.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('Connected successfully to db');

  const db = client.db('db-users');
  usersCollection = db.collection('users');
  statsCollection = db.collection('statistics');

  await checkDataInDb(usersCollection, usersPath);
  await checkDataInDb(statsCollection, statsPath);
}

async function checkDataInDb(collection, dataPath) {
  try {
    const dataFromDb = await collection.find({}).toArray();
    if (dataFromDb.length === 0) {
      const dataFromLocalFile = getDataFromLocalFile(dataPath);
      await collection.insertMany(dataFromLocalFile);
      return dataFromLocalFile;
    } else {
      return dataFromDb;
    }
  } catch (err) {
    console.log(err);
  }
}

function getDataFromLocalFile(dataPath) {
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

async function getUsers(req, res, next) {
  try {
    const page = Number(req.query.page);
    const limitNumber = Number(req.query.limit);
    let skipNumber = 0;
    if (page > 1) {
      for (let i = 1; i < page; i++) {
        skipNumber += limitNumber;
      }
    }
    const usersFromDb = await usersCollection
      .find()
      .skip(skipNumber)
      .limit(limitNumber)
      .toArray();
    req.usersFromDb = usersFromDb;
    next();
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const userIds = req.usersFromDb.map((user) => user.id);
    const statsFromDb = await statsCollection
      .find({ user_id: { $in: userIds } })
      .toArray();

    req.usersFromDb.forEach((user) => {
      let clicksNum = 0;
      let viewsNum = 0;
      statsFromDb.forEach((statsObj) => {
        if (statsObj.user_id === user.id) {
          clicksNum += statsObj.clicks;
          viewsNum += statsObj.page_views;
        }
      });

      Object.assign(user, {
        total_clicks: clicksNum,
        total_page_views: viewsNum,
      });
    });

    res.status(200).json(req.usersFromDb);
  } catch (err) {
    next(err);
  }
}

async function getStatsById(req, res, next) {
  try {
    const id = Number(req.params.id);
    const usersFromDb = await usersCollection.find().toArray();
    const requestedUser = usersFromDb.find((user) => user.id === id);
    if (!requestedUser) {
      return res.status(404).json({ message: 'No user found with this id' });
    }
    const requestedUserStats = await statsCollection
      .find({ user_id: id })
      .toArray();

    // Date filter
    if (Object.keys(req.body).length !== 0) {
      const filteredStats = filterStats(
        requestedUserStats,
        req.body.minDate,
        req.body.maxDate
      );
      return res.send({ ...requestedUser, statistic: filteredStats });
    }

    res.send({ ...requestedUser, statistic: requestedUserStats });
  } catch (err) {
    next(err);
  }
}

function filterStats(arr, min, max) {
  return arr.filter((item) => item.date >= min && item.date <= max);
}

function validateDate(req, res, next) {
  if (Object.keys(req.body).length === 0) {
    return next();
  }
  const schema = Joi.object({
    minDate: Joi.string(),
    maxDate: Joi.string()
  });
  const { error, value } = schema.validate(req.body);
  error ? res.status(400).json({ message: error.details[0].message }) : next();
}

module.exports = { initDB, getUsers, getStats, getStatsById, validateDate };
