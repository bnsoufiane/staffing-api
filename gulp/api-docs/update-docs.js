'use strict';
/**
 * @fileoverview Grabs swagger spec docs and updates swagger.json.
 */

const swaggerJSDoc = require('swagger-jsdoc');
const glob = require('glob');
const fs = require('fs');
const colors = require('colors');
const gutil = require('gulp-util');


const routesPattern = "resources/*/*-*(schema|routes).js";
const swaggerPath = "api-docs/swagger.json";

gutil.log('Updating', '\'' + swaggerPath + '\'...');

glob(routesPattern, {}, (err, files) => {
  if (err) console.error(`Error fetching files: ${err}`.red);
  else if (!files || !files.length) console.error(`No file found matching the pattern ${routesPattern}.`.red);
  else {
    let swaggerOptions = {
      swaggerDefinition: {
        info: {
          title: "Staffing API",
          description: "Staffing API Sandbox",
          version: "1.0.0"
        },
        schemes: [
          "https"
        ],
        basePath : "/api"
      },
      apis: files
    };

    try {
      let swaggerSpec = swaggerJSDoc(swaggerOptions);
        fs.writeFile(swaggerPath, JSON.stringify(swaggerSpec, null, 2), err => {
          if (err) console.error(`Error updating API documentation: ${err}`.red);
          else gutil.log('Swagger API Docs updated...'.green);
        });
      } catch (err) {
          console.log('Errors:'+JSON.stringify(err));
    }
  }
});
