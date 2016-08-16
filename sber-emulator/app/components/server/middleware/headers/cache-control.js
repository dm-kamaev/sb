// caching-control headers
module.exports = function(request, response, next) {
    response.set({
        'Cache-Control': 'private, no-cache'
    });
    next();
};
