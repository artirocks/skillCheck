/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const CustomerLoyality = require('./lib/customer-loyality-contract');

module.exports.CustomerLoyality = CustomerLoyality;
module.exports.contracts = [ CustomerLoyality ];
