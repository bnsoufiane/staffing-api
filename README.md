# Staffing **API**

1. Install local packages

`sudo npm install`

2. Make sure gulp is installed globally

`npm install -g gulp`


####Local Development

This application is built and tested using node v4.4.3. The node v5.x.x is not supported.

1. Copy `user_constants.json.example` to `user_constants.json` and fill out details.
```JavaScript
{
  "user": "hassaan",
  "AWS_access_key": "ADD YOUR ACCESS KEY",
  "AWS_secret": "ADD YOUR SECRET"
}
```

2. Make sure mongodb is running in your local machine

3. Run `monogo` to enter mongo shell and run `db.copyDatabase('staffing', 'staffing', '104.154.52.147:27017');`.
It will copy live database into localhost.

4. Rename `.env.example` to `.env` and add all environment variables:

```
AWS_ACCESS_KEY=AKIAIEBGD2UM6T6IJDAQ
AWS_SECRET=oKtIDMvZPQeGDvj4bHS9yuvEyMy/VhQkEyhJsXFy
SENDGRID_API_KEY=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
MONGO_DB=staffing
MONGO_SERVER=104.154.52.147:27017
```

Make sure to source it:

    `source .env`

Use the following test user to login at front-end:

```
user: hhsadiq
password: hhsadiq
```

5. Inject the client side directory `public` from client repo. Kindly refer to client repo for 
injecting details. You can ignore this step if you don't want client repo to be served in local development

6. Start local development

    `gulp --dev`
    
7. You can copy the collection of staffing apis to postman (chrome rest client) from here 
https://www.getpostman.com/collections/cf812b3cfad337fe6d5d. To use this, make sure postman is installed
in your system.

#### Elasticsearch
1. Some of the resources are being mainained in elasticsearch like *companies* and *businesses*. To set up elasticsearch locally, please install elasticsearch on your system, (please prefer installing it properly rather than just extracting the tar). After installation you can run elasticsearch as a service, to verify that elastic is up and running locally you can ping `http://localhost:9200`.
2. **Please set environment variable `APP_ENV='development'` to point locally running API to locally running elastic, otherwise your local API would point to production's elastic which is to be avoided.**.
3. Now to create/populate elasticsearch index, you can run the script called `mongo-to-elastic.js` in `./services/elasticsearch/scripts`. You can run this script like so,
```
node mongo-to-elastic.js <name-of-mongo-collection-to-import-from>
```
For example to move *companies* from mongo to elastic you should run `node mongo-to-elastic.js companies`.
    
#### Swagger docs

Swagger docs uri: `/api/docs`

#### Deploying to production

1. Make Sure `public` directory is injected. Kindly refer to 
[client repo](https://github.com/punchagency/staffing-client) for injecting details.

2. Clone the `app.yaml.example`, rename it to `app.yaml` and add api keys/secrets by replacing `ADD INFO HERE`

3. Make sure pre-requisites are met [described here](https://cloud.google.com/nodejs/getting-started/hello-world)

4. `cd path/to/staffing-api`

5. `gcloud preview app deploy`
