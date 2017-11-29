'use strict';

const MongoClient = require('mongodb').MongoClient;
const chalk = require('chalk');
const async = require('async');

const url = `mongodb://${process.env.MONGO_SERVER || 'localhost/'}` +
  `${process.env.MONGO_DB || 'staffing'}`;

/**
 * Supported collections, key => mongo collection name,
 * value => corresponding elastic type.
 */
const COLLECTIONS = {
  companydetails: 'company'
};

const collectionName = process.argv[2];

if (!collectionName) {
  console.log(chalk.red('collection not provided.'));
  process.exit();
}

if (!COLLECTIONS[collectionName]) {
  console.log(chalk.red('collection not supported.'));
  process.exit();
}

var es = require('../index');
var essInstance = es({type: COLLECTIONS[collectionName]});

const bulkSize = 5000;
var bulkCursor = 0;

MongoClient.connect(url, (err, db) => {
  if (err) throw new Error(err);
  console.log(chalk.green(`Connected to db at ${url}`));

  start(db);
});

function start(db) {
  essInstance.init()
  .then(_ => importFromMongo(db, _ => {
      db.close();
      console.log(chalk.yellow.bold('\nending script'));
      process.exit(1);
    })
  )
  .catch(err => {throw new Error(err);});
}

function importFromMongo(db, cb) {
  console.log(chalk.yellow(`starting: ${collectionName} ->` +
    `${COLLECTIONS[collectionName]}`));

  var collection = db.collection(collectionName);

  essInstance.count()
  .then(response => {
    if (!response.count) {
      collection.count((err, total) => {
        if (err) throw new Error(err);
        if (total) {
          // Creating and processing bulks.
          async.whilst(
            _ => total > bulkCursor,
            callback => {
              collection.find({}, {_id: false})
              .skip(bulkCursor)
              .limit(bulkSize)
              .toArray((err, companies) => {
                if (err) callback(err, bulkCursor);
                essInstance.bulkInsert(companies)
                .then(response => {
                  delete response.items;
                  bulkCursor += bulkSize;
                  console.log('---------');
                  console.log('bulk number: ', (bulkCursor/bulkSize));
                  console.log('processed: ', bulkCursor);
                  if (response.errors) {
                    console.log(response.errors);
                    callback(`bulk # ${bulkCursor/bulkSize} errored.`);
                  } else {
                    console.log(chalk.green('success'));
                    callback(null, bulkCursor);
                  }
                  console.log('---------');
                })
                .catch(err => callback(err));
              });
            },
            (err, processed) => {
              if (err) {
                console.log(chalk.red.bold('\nend error: '), err);
                cb();
              } else {
                console.log(chalk.green.bold('\nend success: '), processed);
                cb();
              }
            }
          );
          // ---------------------------
        } else {
          console.log(chalk.red(`No record found in '${collectionName}'.`));
          cb();
        }
      })
    } else {
      console.log(chalk.red(`ES index is not empty for type '` +
        `${COLLECTIONS[collectionName]}'.`));
      cb();
    }

  })
  .catch(err => {throw new Error(err);});
}
