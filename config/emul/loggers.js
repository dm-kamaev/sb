var intel = require('intel');
module.exports =
{
    loggers: {
        'main': {
            'handlers': ['terminal'],
            'level': 'TRACE',
        },
        'express': {
            'handlers': ['express'],
            'level': 'TRACE',
        },
        'sequelize': {
            'handlers': ['terminal'],
            'level': 'info'
        },
        'scripts': {
            'handlers': ['terminal'],
            'level': 'TRACE',
        }
    }
};
