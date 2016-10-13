'use strict';

// Validation user's data
// author: dmitrii kamaev

const i18n = require('../../../components/i18n');


module.exports = class userValidation {
  /**
   * declaration schema:
   * schema[key] = {
   *     "required"  // if there is a string, it will be displayed if there is no variable
   *     "errorText" // text if error validate
   *     "validate"  // function for validation ( return true || false )
   * }
   *
   * @return {[type]} [description]
   */
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
        required:  i18n.__('Поле "email" не может быть пустым'),
        errorText: i18n.__('Некорректный email'),
        validate: (el) => mailRegex.test(el),
    };

    schema.password = {
        required:  i18n.__('Поле "пароль" не может быть пустым'),
        errorText: i18n.__('Минимальная длина пароля 6 символов, а максимальная 36'),
        validate: (el) => el.length >= 6 && el.length <= 36,
    };

    schema.firstName = {
        required:  i18n.__('Поле "Имя" пустое'),
        errorText: i18n.__('Поле "Имя" содержит больше 20 символов'),
        validate: (el) => el.length <= 20,
    };

    schema.lastName = {
        required:  i18n.__('Поле "Фамилия" пустое'),
        errorText: i18n.__('Поле "Фамилия" содержит больше 20 символов'),
        validate: (el) => el.length <= 20,
    };
  }

  /**
   * get validation for select field
   * determine who will check
   * @param  {[string]} key  if "all" select all fields,
   * else current field (example:"password")
   * @return {[obj]}   this
   */
  getValidationFor (key) {
    var schema = this.schema;
    if (!key || key === 'all') {
        this.selectedSchema = schema;
    } else if (!schema[key]) {
        throw new Error('Not exist key in schema '+key);
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

  /**
   * check selected fields
   * TODO: maybe added order keys
   * @param  {[obj]} hashValues { email: "test@example.ru", password: "123213", ... }
   * @return {[array || boolean]} if errors exist return array's error, else return false
   */
  check(hashValues) {
    var selectedSchema = this.selectedSchema;
    var keysSchema = Object.keys(selectedSchema);
    var valErrors = [];
    var keysValues = Object.keys(hashValues);
    if (keysSchema.length !== keysValues.length) {
        throw new Error(
            'Not equailent => keys schema: ['+keysSchema.join(', ')+']; input keys '+
            '['+keysValues.join(', ')+'];'
        );
    }
    keysSchema.forEach((key) => {
        var schemaEl = selectedSchema[key],
            value    = hashValues[key];
        if (schemaEl.required && !value && value !== 0) {
            return valErrors.push(schemaEl.required);
        }
        if (schemaEl.validate) {
            var res = schemaEl.validate(value);
            if (!res) { valErrors.push(schemaEl.errorText); }
        }
    });
    return (valErrors.length) ? valErrors : false;
  }
}