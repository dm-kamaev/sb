module.exports = {
    'main': {
        'handlers': ['fileRotate'],
        'level': 'INFO'
    },
    'sequelize': {
        'handlers': ['terminal'],
        'level': 'VERBOSE'
    }
}
