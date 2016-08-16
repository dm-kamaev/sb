module.exports = function needAuthorization(request, response, next) {
    if (request.user) {
        next();
    } else {
        return response
            .status(401)
            .send([{
                code: 'AuthenticationRequired',
                message: 'Нужно авторизироваться.'
            }]);
    }
};
