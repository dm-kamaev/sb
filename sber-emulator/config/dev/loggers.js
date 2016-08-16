module.exports =
{
    'loggers': {
        'main': {
            'handlers': ['terminal'],
            'level': 'TRACE',
        },
        'express': {
            'handlers': ['terminal'],
            'level': 'TRACE',
        },
        'sequelize': {
            'handlers': ['terminal'],
            'level': 'TRACE'
        },
        'scripts': {
            'handlers': ['terminal'],
            'level': 'TRACE',
        }
    }
};
