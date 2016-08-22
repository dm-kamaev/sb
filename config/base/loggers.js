var intel = require('intel');
module.exports =
{
   formatters: {
        'simple': {
            'format': '[%(levelname)s][%(name)s] %(message)s',
            'colorize': true
        },
        'details': {
            'format': '[%(date)s] %(name)s.%(levelname)s: %(message)s',
            'colorize': true
        },
        'sequelize': {
            'format': '[SQL]: %(message)s'
        },
        'express': {
            'format': '%(message)s'
        }
    },
    handlers: {
        'terminal': {
            'class': 'intel/handlers/console',
            'formatter': 'details',
            'level': intel.TRACE
        },
        'sequelize': {
            'class': 'intel/handlers/console',
            'formatter': 'sequelize',
            'level': intel.TRACE
        },
        'express': {
            'class': 'intel/handlers/console',
            'formatter': 'express',
            'level': intel.TRACE
        },
    },
    loggers: {
        'main': {
            'handlers': ['terminal'],
            'level': 'INFO',
        },
        'express': {
            'handlers': ['terminal'],
            'level': 'INFO',
        },
        'sequelize': {
            'handlers': ['terminal'],
            'level': 'VERBOSE'
        },
        'scripts': {
            'handlers': ['terminal'],
            'level': 'TRACE',
        },
        'monthlyPayments': {
            'handlers': ['terminal'],
            'level': 'INFO'
        }
    }
};
