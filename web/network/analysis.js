'use strict';

//export module
module.exports = {

    /*
   * Calculate total points collected
   * @param {Object} usePointsTransactions Object with all UsePoints transactions
   */
    totalCertisCollected: function(earnCertisTransactions) {
        return earnCertisTransactions.length;
    },

    /*
   * Calculate total points given
   * @param {Object} usePointsTransactions Object with all EarnPoints transactions
   */
    totalCertisVerified: function(verifiedCertisTransactions) {
        return verifiedCertisTransactions.length;
    }

};
