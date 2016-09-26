'use strict';

const config = require('../config/config.json');

const express = require('express');
const http = require('http');
const bodyparser = require('body-parser');
const axios = require('axios');
const router = require('express').Router();

var app = express();

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
    extended: false
}));

app.use('/callback', router);

router.get('/', (req, res, next) => {
    var resp = Promise.all(config.hosts.map(host => {
        return axios.get(host + '/callback', {
            params: req.query,
            validateStatus: function (status) {
                return true
            }
        });
    }));
    resp.then(resultArray => {
        if(resultArray.some(ress => ress.status === 200)) {
            res.sendStatus(200);
            next();
        } else {
            console.log('callback sending failed: '
                + JSON.stringify(resultArray));
            res.sendStatus(500);
            next();
        }
    })
});
var port = config.port || 10000;
app.listen(port);
console.log('Multicaster listening on port ' + port);
