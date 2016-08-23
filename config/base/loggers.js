module.exports = {
    'main': {
        'handlers': ['fileRotate'],
        'level': 'INFO'
    },
    'sequelize': {
        'handlers': ['terminal'],
        'level': 'VERBOSE'
    },
    'express': {
        'handlers': ['fileRotate'],
        'level': 'INFO',
    },
    'monthlyPayments': {
        'handlers': ['fileRotate'],
        'level': 'INFO'
    },
};
