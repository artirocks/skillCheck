/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
const allEmployersKey = 'all-employers';
const earnCertificatesTransactionsKey = 'earn-certis-transactions';
const verifyCertificatesTransactionsKey = 'verify-certis-transactions';


// allPartnersKey  =>  allEmployersKey
// 



class EmployeeVerification extends Contract {

    async instantiate(ctx) {
        console.info('============= START : Initialize Ledger ===========');

        await ctx.stub.putState('instantiate', Buffer.from('INIT-LEDGER'));
        await ctx.stub.putState(allEmployersKey, Buffer.from(JSON.stringify([])));
        await ctx.stub.putState(earnCertificatesTransactionsKey, Buffer.from(JSON.stringify([])));
        await ctx.stub.putState(verifyCertificatesTransactionsKey, Buffer.from(JSON.stringify([])));

        console.info('============= END : Initialize Ledger ===========');
    }

    // Add a employee on the ledger
    async CreateEmployee(ctx, employee) {
        employee = JSON.parse(employee);

        await ctx.stub.putState(employee.aadharNumber, Buffer.from(JSON.stringify(employee)));

        return JSON.stringify(employee);
    }

    // Add a employer on the ledger, and add it to the all-employers list
    async CreateEmployer(ctx, employer) {
        employer = JSON.parse(employer);

        await ctx.stub.putState(employer.id, Buffer.from(JSON.stringify(employer)));

        let allEmployersKey = await ctx.stub.getState(allEmployersKey);
        allemployers = JSON.parse(allEmployersKey);
        allEmployersKey.push(employer);
        await ctx.stub.putState(allEmployersKey, Buffer.from(JSON.stringify(allEmployersKey)));

        return JSON.stringify(employer);
    }

    // Record a transaction of employee gaining a certificate
    async EarnCertificate(ctx, earnCerti) {
        earnCerti = JSON.parse(earnCerti);
        earnCerti.timestamp = new Date((ctx.stub.txTimestamp.seconds.low*1000)).toGMTString();
        earnCerti.transactionId = ctx.stub.txId;

        let employee = await ctx.stub.getState(earnCerti.employee);
        employee = JSON.parse(employee);
        employee.Certis[earnCerti.certiType] = earnCerti.hashValOfCerti;
        await ctx.stub.putState(earnCerti.employee, Buffer.from(JSON.stringify(employee)));

        let earnCertificatesTransactionsKey = await ctx.stub.getState(earnCertificatesTransactionsKey);
        earnCertificatesTransactions = JSON.parse(earnCertificatesTransactionsKey);
        earnCertificatesTransactions.push(earnCerti);
        await ctx.stub.putState(earnCertificatesTransactionsKey, Buffer.from(JSON.stringify(earnCertificatesTransactions)));

        return JSON.stringify(earnCerti);
    }

    // Record a transaction for verification
    async VerifyCerti(ctx, certiDocVerification) {
        certiDocVerification = JSON.parse(certiDocVerification);

        certiDocVerification.timestamp = new Date((ctx.stub.txTimestamp.seconds.low*1000)).toGMTString();
        certiDocVerification.transactionId = ctx.stub.txId;

        let employee = await ctx.stub.getState(certiDocVerification.employee);
        employee = JSON.parse(employee);

        if(employee.Certis[certiDocVerification.docType]!=certiDocVerification.hashValOfCerti)
        {
            certiDocVerification.isValid = "false";
        }
        
        else{
            certiDocVerification.isValid = "true";
        }
        
        let verifyCertificatesTransactions = await ctx.stub.getState(verifyCertificatesTransactionsKey);
        verifyCertificatesTransactions = JSON.parse(verifyCertificatesTransactions);
        verifyCertificatesTransactions.push(certiDocVerification);
        await ctx.stub.putState(verifyCertificatesTransactionsKey, Buffer.from(JSON.stringify(verifyCertificatesTransactions)));

    }

    // Get earn points transactions of the particular employee
    async EarnCertisTransactionsInfo(ctx, userType, userId) {
        let transactions = await ctx.stub.getState(earnCertisTransactionsKey);
        transactions = JSON.parse(transactions);
        let userTransactions = [];

        for (let transaction of transactions) {
            if (userType === 'employee') {
                if (transaction.employee === userId) {
                    userTransactions.push(transaction);
                }
            }
        }

        return JSON.stringify(userTransactions);
    }

    // Get use points transactions of the particular employer
    async VerifyCertisTransactionsInfo(ctx, userType, userId) {
        let transactions = await ctx.stub.getState(verifyCertificatesTransactionsKey);
        transactions = JSON.parse(transactions);
        let userTransactions = [];

        for (let transaction of transactions) {
            if (userType === 'employer') {
                if (transaction.employer === userId) {
                    userTransactions.push(transaction);
                }
            }
        }

        return JSON.stringify(userTransactions);
    }

    // get the state from key
    async GetState(ctx, key) {
        let data = await ctx.stub.getState(key);

        let jsonData = JSON.parse(data.toString());
        return JSON.stringify(jsonData);
    }

}

module.exports = EmployeeVerification;
