'use strict'

// object for transporting data between the plurality of modules
// dmitrii kamaev


module.exports = class Context {
    /**
     * constructor
     * @param  {[obj || null]} data start data
     * @return {[type]}
     */
    constructor(data) {
      var keys = Object.keys(data || {});
      if (keys.length != 0) {
        keys.forEach(key => this[key] = data[key]);
      }
    }


    /**
     * set
     * @param {[str]} key
     * @param {[any]} val
     * @return {[any]}  return val
     */
    set(key, val) {
        var data = this;
        if (data[key]) {
          throw new Error('context.set => Try twice set by key: "'+key+'"');
        } else {
          data[key] = val;
          return val;
        }
    }

    /**
     * get
     * @param {[str]} key
     * @return {[any]}  return val
     */
    get(key) {
        var data = this;
        var val = data[key];
        if (val || val === '' || val === 0) {
          return val;
        } else {
          throw new Error('context.get => not exist element by key: "'+key+'"');
        }
    }

    /**
     * change data in object by key
     * @param  {[str]} key
     * @param  {[any]} val
     * @return {[any]}  return val
     */
    change(key, val) {
        if(this[key]) {
          this[key] = val;
          return val;
        } else {
          throw new Error('context.change => not exist element by key: "'+key+'"');
        }
    }


    /**
     * check exist data by key in context
     * @param  {[str]} key
     * @return {[boolean]}  return true || false
     */
    exist(key) {
        if(this[key] || this[key] === 0 || this[key] === '' || this[key] === false) {
          return true;
        } else {
          return false;
        }
    }
};