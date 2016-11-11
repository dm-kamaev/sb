'use strict';
const execSync = require('child_process').execSync;
const path = require('path')
const MONTHLY_PATH = path.join(__dirname, '../../../app/scripts/monthlyPayments.js')

module.exports = function(context, date) {
    return function() {
      return new Promise(function(resolve, reject) {
          execSync(`node ${MONTHLY_PATH} --now '${date}'`,
              (error, stdout, stderr) => {
                  if (error) {
                      console.error(`exec error: ${error}`);
                  }
                  console.log(`stdout: ${stdout}`);
                  console.log(`stderr: ${stderr}`);
              });
          resolve();
      });
    }
}
