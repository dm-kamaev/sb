'use strict';

// Validation
// author: dmitrii kamaev

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const util   = require('util');


module.exports = class Validation {
    constructor (who) {
        if (who === 'user') {
            var schemaUser = new SchemaUser();
            return schemaUser;
        } else {
            throw new Error(`Validation: not specified who to validate "${who}"`);
        }
    }
};


class SchemaUser {
  constructor () {
    const schema = {};
    this.schema = schema;
    var mailRegex = new RegExp([
        '^[a-z0-9\\u007F-\\uffff!#$%&\\\'*+\\/=?' +
        '^_`{|}~-]+(?:\\.' +
        '[a-z0-9\\u007F-\\uffff!#$%&\\\'*+\\/=?^_`{|}~-]+)*@(?:[a-z0-9]' +
        '(?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z]{1,}$'
    ].join(''), 'i');
    schema.email = {
        required: { status: true, text: 'Поле email не может быть пустым' },
        errorText: 'Некорректный email',
        validate: (el) => mailRegex.test(el),
    };

    schema.password = {
        required: { status: true, text: 'Поле пароль не может быть пустым' },
        errorText: 'Минимальная длина пароля 6 символов',
        validate: (el) => el.length >= 6 && el.length <= 36,
    };

    schema.firstName = {
        required: { status: true, text: 'Поле "Имя" пустое' },
        errorText: 'Поле "Имя" содержит больше 20 символов',
        validate: (el) => el.length <= 20,
    };

    schema.lastName = {
        required: { status: true, text: 'Поле "Фамилия" пустое' },
        errorText: 'Поле "Фамилия" содержит больше 20 символов',
        validate: (el) => el.length <= 20,
    };
  }


  getValidationFor (key) {
    var schema = this.schema;
    if (key === 'all') {
        this.selectedSchema = schema;
    } else if (!schema[key]) {
        throw new Error('Error not exist key');
    } else {
        var keysSchema = Object.keys(schema)
        for (var i = 0, l = keysSchema.length; i < l; i++) {
            if (keysSchema[i] === key) {
                this.selectedSchema = { [key]: schema[key] };
                break;
            }
        }
    }
    return this;
  }


  check(hashValues) {
    var selectedSchema = this.selectedSchema;
    var keysSchema = Object.keys(selectedSchema);
    var valErrors = [];
    if (keysSchema.length !== Object.keys(hashValues).length) {
        throw new Error('Not equailent');
    }
    keysSchema.forEach((key) => {
        var schemaEl = selectedSchema[key],
            value    = hashValues[key];
        if (schemaEl.required.status === true) {
            // console.log(key, value);
            if (!value && value !== 0) { valErrors.push(schemaEl.required.text); }
        }
        if (schemaEl.validate) {
            var res = schemaEl.validate(value);
            if (!res) { valErrors.push(schemaEl.errorText); }
        }
    });
    return valErrors;
  }
}

// var user = new module.exports('user');
// console.log(user);

// var userValidate = new User().getValidationFor('password');
// console.log(userValidate);
var res = new module.exports('user').getValidationFor('all').check({
    password:'123125'
});
console.log(res);