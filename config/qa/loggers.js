module.exports = {
    'main': {
        'handlers': ['terminal'],
        'level': 'DEBUG'
    },
    'sequelize': {
        'handlers': ['sequelize'],
        'level': 'VERBOSE'
    },
    'express': {
        'handlers': ['terminal'],
        'level': 'DEBUG',
    },
    'scripts': {
        'handlers': ['terminal'],
        'level': 'TRACE',
    }
}
