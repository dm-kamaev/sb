#!/bin/bash
BASEDIR=$(dirname $0)
echo BASEDIR
node $BASEDIR/../checkOrderStatus.js
