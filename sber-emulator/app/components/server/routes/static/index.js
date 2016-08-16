const express = require('express');
const path = require('path');
module.exports = function(app) {
    app.use('/doc', express.static(
        path.resolve(__dirname, '../../../../..', 'public/doc')));
    app.use(express.static(
        path.resolve(__dirname, '../../../../..', 'public/frontend')));
};
