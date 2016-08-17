module.exports = function(app) {
    require('./static')(app);
    require('./controllers')(app);
};
