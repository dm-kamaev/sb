module.exports =
{
    'loggers': {
        'main': {
            'handlers': ['fileRotate'],
            'level': 'INFO',
        },
        'express': {
            'handlers': ['fileRotate'],
            'level': 'INFO',
        },
        'sequelize': {
            'handlers': ['fileRotate'],
            'level': 'INFO'
        },
        'scripts': {
            'handlers': ['fileRotate'],
            'level': 'INFO',
        }
    },
    'fileOptions': {
        'file': '../runtime/chat-api.log',
        'size': '5m', 
        'keep': 10 
    }
};
