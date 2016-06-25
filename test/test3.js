'use strict';

var today = new Date();
var tommorow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0, 0);
var beginDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
console.log(today)
console.log(tommorow);
console.log(beginDay);
