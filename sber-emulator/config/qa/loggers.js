module.exports =
{
    'loggers': {
        'main': {
            'handlers': ['fileRotate'],
            'level': 'DEBUG',
        },
        'express': {
            'handlers': ['fileRotate'],
            'level': 'DEBUG',
        },
        'sequelize': {
            'handlers': ['fileRotate'],
            'level': 'DEBUG'
        },
        'scripts': {
            'handlers': ['fileRotate'],
            'level': 'DEBUG',
        }
    },
    'fileOptions': {
        'file': '../runtime/chat-api.log',
        'size': '5m', 
        'keep': 3 
    }
};
