'use strict'

// author: dm-kamaev
// additional method

/**
 * implement methods
 * @param  {[Promise]} objPromise
 */
module.exports = function (objPromise) {
  objPromise.series = implementSerires;
  return objPromise;
};


function implementSerires(promises) {
    const ret = Promise.resolve(null), res = [];

    return promises.reduce(function(result, provider, index) {
        return result.then(() => {
            return provider.then(val => res[index] = val);
        });
    }, ret).then(() => res);
}