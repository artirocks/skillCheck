'use strict';

const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');
const fs = require('fs');
const path = require('path');

// capture network variables from config.json
const configPath = path.join(process.cwd(), 'config.json');
const configJSON = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configJSON);
let connection_file = config.connection_file;
let appAdmin = config.appAdmin;
let orgMSPID = config.orgMSPID;
let gatewayDiscovery = config.gatewayDiscovery;

const ccpPath = path.join(process.cwd(), connection_file);
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

function sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//export module
module.exports = {

    /*
  * Create Employee participant and import card for identity
  * @param {String} cardId Import card id for employee
  * @param {String} accountNumber Employee account number as identifier on network
  * @param {String} firstName Employee first name
  * @param {String} lastName Employee last name
  * @param {String} phoneNumber Employee phone number
  * @param {String} email Employee email
  */
    registerEmployee: async function (cardId, aadharNumber, firstName, lastName, email, phoneNumber) {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), '/wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        try {

            let response = {};


            // Check to see if we've already enrolled the user.
            const userExists = await wallet.exists(cardId);
            if (userExists) {
                let err = `An identity for the user ${cardId} already exists in the wallet`;
                console.log(err);
                response.error = err;
                return response;
            }

            // Check to see if we've already enrolled the admin user.
            const adminExists = await wallet.exists(appAdmin);
            if (!adminExists) {
                let err = 'An identity for the admin user-admin does not exist in the wallet. Run the enrollAdmin.js application before retrying';
                console.log(err);
                response.error = err;
                return response;
            }

            // Create a new gateway for connecting to our peer node.
            const gateway = new Gateway();
            await gateway.connect(ccp, { wallet, identity: appAdmin, discovery: gatewayDiscovery });

            // Get the CA client object from the gateway for interacting with the CA.
            const ca = gateway.getClient().getCertificateAuthority();
            const adminIdentity = gateway.getCurrentIdentity();

            // Register the user, enroll the user, and import the new identity into the wallet.
            const secret = await ca.register({ affiliation: 'org1.department1', enrollmentID: cardId, role: 'client' }, adminIdentity);
            const enrollment = await ca.enroll({ enrollmentID: cardId, enrollmentSecret: secret });
            const userIdentity = X509WalletMixin.createIdentity(orgMSPID, enrollment.certificate, enrollment.key.toBytes());
            wallet.import(cardId, userIdentity);
            console.log('Successfully registered and enrolled admin user ' + cardId + ' and imported it into the wallet');

            // Disconnect from the gateway.
            await gateway.disconnect();
            console.log('admin user admin disconnected');

        } catch (err) {
            //print and return error
            console.log(err);
            let error = {};
            error.error = err.message;
            return error;
        }

        await sleep(2000);

        try {
            // Create a new gateway for connecting to our peer node.
            const gateway2 = new Gateway();
            await gateway2.connect(ccp, { wallet, identity: cardId, discovery: gatewayDiscovery });

            // Get the network (channel) our contract is deployed to.
            const network = await gateway2.getNetwork('mychannel');

            // Get the contract from the network.
            const contract = network.getContract('customerloyalty');

            let employee = {};
            employee.aadharNumber = aadharNumber;
            employee.firstName = firstName;
            employee.lastName = lastName;
            employee.email = email;
            employee.phoneNumber = phoneNumber;
            employee.Certis = {};

            // Submit the specified transaction.
            console.log('\nSubmit Create Employee transaction.');
            const createEmployeeResponse = await contract.submitTransaction('CreateEmployee', JSON.stringify(employee));
            console.log('createEmployeeResponse: ');
            console.log(JSON.parse(createEmployeeResponse.toString()));

            console.log('\nGet employee state ');
            const employeeResponse = await contract.evaluateTransaction('GetState', aadharNumber);
            console.log('employeeResponse.parse_response: ');
            console.log(JSON.parse(employeeResponse.toString()));

            // Disconnect from the gateway.
            await gateway2.disconnect();

            return true;
        }
        catch(err) {
            //print and return error
            console.log(err);
            let error = {};
            error.error = err.message;
            return error;
        }

    },

    /*
  * Create Employer participant and import card for identity
  * @param {String} cardId Import card id for employer
  * @param {String} employerId Employer Id as identifier on network
  * @param {String} name Employer name
  */
    registerEmployer: async function (cardId, employerId, name) {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), '/wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        try {

            let response = {};


            // Check to see if we've already enrolled the user.
            const userExists = await wallet.exists(cardId);
            if (userExists) {
                let err = `An identity for the user ${cardId} already exists in the wallet`;
                console.log(err);
                response.error = err;
                return response;
            }

            // Check to see if we've already enrolled the admin user.
            const adminExists = await wallet.exists(appAdmin);
            if (!adminExists) {
                let err = 'An identity for the admin user-admin does not exist in the wallet. Run the enrollAdmin.js application before retrying';
                console.log(err);
                response.error = err;
                return response;
            }

            // Create a new gateway for connecting to our peer node.
            const gateway = new Gateway();
            await gateway.connect(ccp, { wallet, identity: appAdmin, discovery: gatewayDiscovery });

            // Get the CA client object from the gateway for interacting with the CA.
            const ca = gateway.getClient().getCertificateAuthority();
            const adminIdentity = gateway.getCurrentIdentity();

            // Register the user, enroll the user, and import the new identity into the wallet.
            const secret = await ca.register({ affiliation: 'org1.department1', enrollmentID: cardId, role: 'client' }, adminIdentity);
            const enrollment = await ca.enroll({ enrollmentID: cardId, enrollmentSecret: secret });
            const userIdentity = X509WalletMixin.createIdentity(orgMSPID, enrollment.certificate, enrollment.key.toBytes());
            wallet.import(cardId, userIdentity);
            console.log('Successfully registered and enrolled admin user ' + cardId + ' and imported it into the wallet');

            // Disconnect from the gateway.
            await gateway.disconnect();
            console.log('admin user admin disconnected');

        } catch (err) {
            //print and return error
            console.log(err);
            let error = {};
            error.error = err.message;
            return error;
        }

        await sleep(2000);

        try {
            // Create a new gateway for connecting to our peer node.
            const gateway2 = new Gateway();
            await gateway2.connect(ccp, { wallet, identity: cardId, discovery: gatewayDiscovery });

            // Get the network (channel) our contract is deployed to.
            const network = await gateway2.getNetwork('mychannel');

            // Get the contract from the network.
            const contract = network.getContract('customerloyalty');

            let employer = {};
            employer.id = employerId;
            employer.name = name;

            // Submit the specified transaction.
            console.log('\nSubmit Create Employer transaction.');
            const createEmployerResponse = await contract.submitTransaction('CreateEmployer', JSON.stringify(employer));
            console.log('createEmployerResponse: ');
            console.log(JSON.parse(createEmployerResponse.toString()));

            console.log('\nGet employer state ');
            const employerResponse = await contract.evaluateTransaction('GetState', employerId);
            console.log('employerResponse.parse_response: ');
            console.log(JSON.parse(employerResponse.toString()));

            // Disconnect from the gateway.
            await gateway2.disconnect();

            return true;
        }
        catch(err) {
            //print and return error
            console.log(err);
            let error = {};
            error.error = err.message;
            return error;
        }

    },

    /*
  * Perform EarnCertis transaction
  * @param {String} cardId Card id to connect to network
  * @param {String} aadharNumber of employee
  * @param {String} certificateType of certificate allocated to employee
  * @param {String} hashVal is SHA 256 hashCode of Employee certificate 
  */
    earnCertisTransaction: async function (cardId, aadharNumber, certificateType, hashVal) {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), '/wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        try {
            // Create a new gateway for connecting to our peer node.
            const gateway2 = new Gateway();
            await gateway2.connect(ccp, { wallet, identity: cardId, discovery: gatewayDiscovery });

            // Get the network (channel) our contract is deployed to.
            const network = await gateway2.getNetwork('mychannel');

            // Get the contract from the network.
            const contract = network.getContract('customerloyalty');

            let earnCertis = {};
            earnCertis.certiType = certificateType;
            earnCertis.employee = aadharNumber;
            earnCertis.hashValOfCerti = hashVal;

            // Submit the specified transaction.
            console.log('\nSubmit EarnCertis transaction.');
            const earnCertisResponse = await contract.submitTransaction('EarnCertificate', JSON.stringify(earnCertis));
            console.log('earnCertisResponse: ');
            console.log(JSON.parse(earnCertisResponse.toString()));

            // Disconnect from the gateway.
            await gateway2.disconnect();

            return true;
        }
        catch(err) {
            //print and return error
            console.log(err);
            let error = {};
            error.error = err.message;
            return error;
        }

    },

    /*
  * Perform UsePoints transaction
  * @param {String} cardId Card id to connect to network
  * @param {String} aadharNumber of employee
  * @param {String} employerId Employer Id of Employer
  * @param {String} hashValOfCerti SHA 256 hash code of document submitted by employee
  */
    verifyCertiTransaction: async function (cardId, aadharNumber, hashValOfCerti, docType) {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), '/wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        try {
            // Create a new gateway for connecting to our peer node.
            const gateway2 = new Gateway();
            await gateway2.connect(ccp, { wallet, identity: cardId, discovery: gatewayDiscovery });

            // Get the network (channel) our contract is deployed to.
            const network = await gateway2.getNetwork('mychannel');

            // Get the contract from the network.
            const contract = network.getContract('customerloyalty');

            let certiDocVerification = {};
            certiDocVerification.docType = docType;
            certiDocVerification.employee = aadharNumber;
            certiDocVerification.hashValOfCerti = hashValOfCerti;
            certiDocVerification.isValid = "true";

            // Submit the specified transaction.
            console.log('\nSubmit VerifyCerti transaction.');
            const verifyCertiResponse = await contract.submitTransaction('VerifyCerti', JSON.stringify(certiDocVerification));
            console.log('verifyCertiResponse: ');
            console.log(JSON.parse(verifyCertiResponse.toString()));

            // Disconnect from the gateway.
            await gateway2.disconnect();

            return true;
        }
        catch(err) {
            //print and return error
            console.log(err);
            let error = {};
            error.error = err.message;
            return error;
        }

    },

    /*
  * Get Employee data
  * @param {String} cardId Card id to connect to network
  * @param {String} aadharNumber of employee
  */
    employeeData: async function (cardId, aadharNumber) {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), '/wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        try {
            // Create a new gateway for connecting to our peer node.
            const gateway2 = new Gateway();
            await gateway2.connect(ccp, { wallet, identity: cardId, discovery: gatewayDiscovery });

            // Get the network (channel) our contract is deployed to.
            const network = await gateway2.getNetwork('mychannel');

            // Get the contract from the network.
            const contract = network.getContract('customerloyalty');

            console.log('\nGet employee state ');
            let employee = await contract.submitTransaction('GetState', aadharNumber);
            employee = JSON.parse(employee.toString());
            console.log(employee);

            // Disconnect from the gateway.
            await gateway2.disconnect();

            return employee;
        }
        catch(err) {
            //print and return error
            console.log(err);
            let error = {};
            error.error = err.message;
            return error;
        }

    },

    /*
  * Get Employer data
  * @param {String} cardId Card id to connect to network
  * @param {String} employeeId Employee Id of employee
  */
    employerData: async function (cardId, employerId) {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), '/wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        try {
            // Create a new gateway for connecting to our peer node.
            const gateway2 = new Gateway();
            await gateway2.connect(ccp, { wallet, identity: cardId, discovery: gatewayDiscovery });

            // Get the network (channel) our contract is deployed to.
            const network = await gateway2.getNetwork('mychannel');

            // Get the contract from the network.
            const contract = network.getContract('customerloyalty');

            let employer = await contract.submitTransaction('GetState', employerId);
            employer = JSON.parse(employer.toString());
            console.log(employer);

            // Disconnect from the gateway.
            await gateway2.disconnect();

            return employer;
        }
        catch(err) {
            //print and return error
            console.log(err);
            let error = {};
            error.error = err.message;
            return error;
        }

    },

    /*
  * Get all employer data
  * @param {String} cardId Card id to connect to network
  */
    allEmployersInfo : async function (cardId) {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), '/wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        try {
            // Create a new gateway for connecting to our peer node.
            const gateway2 = new Gateway();
            await gateway2.connect(ccp, { wallet, identity: cardId, discovery: gatewayDiscovery });

            // Get the network (channel) our contract is deployed to.
            const network = await gateway2.getNetwork('mychannel');

            // Get the contract from the network.
            const contract = network.getContract('customerloyalty');

            console.log('\nGet all employers state ');
            let allEmployers = await contract.evaluateTransaction('GetState', 'all-employers');
            allEmployers = JSON.parse(allEmployers.toString());
            console.log(allEmployers);

            // Disconnect from the gateway.
            await gateway2.disconnect();

            return allEmployers;
        }
        catch(err) {
            //print and return error
            console.log(err);
            let error = {};
            error.error = err.message;
            return error;
        }
    },

    /*
  * Get all EarnCertis transactions data
  * @param {String} cardId Card id to connect to network
  */
    earnCertisTransactionsInfo: async function (cardId, userType, userId) {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), '/wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        try {
            // Create a new gateway for connecting to our peer node.
            const gateway2 = new Gateway();
            await gateway2.connect(ccp, { wallet, identity: cardId, discovery: gatewayDiscovery });

            // Get the network (channel) our contract is deployed to.
            const network = await gateway2.getNetwork('mychannel');

            // Get the contract from the network.
            const contract = network.getContract('customerloyalty');

            console.log(`\nGet earn points transactions state for ${userType} ${userId}`);
            let earnCertisTransactions = await contract.evaluateTransaction('EarnCertisTransactionsInfo', userType, userId);
            earnCertisTransactions = JSON.parse(earnCertisTransactions.toString());
            console.log(earnCertisTransactions);

            // Disconnect from the gateway.
            await gateway2.disconnect();

            return earnCertisTransactions;
        }
        catch(err) {
            //print and return error
            console.log(err);
            let error = {};
            error.error = err.message;
            return error;
        }

    },

    /*
  * Get all UsePoints transactions data
  * @param {String} cardId Card id to connect to network
  */
    verifyCertisTransactionsInfo: async function (cardId, userType, userId) {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), '/wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        try {
            // Create a new gateway for connecting to our peer node.
            const gateway2 = new Gateway();
            await gateway2.connect(ccp, { wallet, identity: cardId, discovery: gatewayDiscovery });

            // Get the network (channel) our contract is deployed to.
            const network = await gateway2.getNetwork('mychannel');

            // Get the contract from the network.
            const contract = network.getContract('customerloyalty');

            console.log(`\nGet use verify transactions state for ${userType} ${userId}`);
            let verifyCertisTransactions = await contract.evaluateTransaction('VerifyCertisTransactionsInfo', userType, userId);
            verifyCertisTransactions = JSON.parse(verifyCertisTransactions.toString());
            console.log(verifyCertisTransactions);

            // Disconnect from the gateway.
            await gateway2.disconnect();

            return verifyCertisTransactions;
        }
        catch(err) {
            //print and return error
            console.log(err);
            let error = {};
            error.error = err.message;
            return error;
        }

    }

};