/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { ChaincodeStub, ClientIdentity } = require('fabric-shim');
const { CustomerLoyality } = require('..');
const winston = require('winston');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

class TestContext {

    constructor() {
        this.stub = sinon.createStubInstance(ChaincodeStub);
        this.clientIdentity = sinon.createStubInstance(ClientIdentity);
        this.logger = {
            getLogger: sinon.stub().returns(sinon.createStubInstance(winston.createLogger().constructor)),
            setLevel: sinon.stub(),
        };
    }

}

describe('CustomerLoyality', () => {

    let contract;
    let ctx;

    beforeEach(() => {
        contract = new CustomerLoyality();
        ctx = new TestContext();
        ctx.stub.getState.withArgs('1001').resolves(Buffer.from('{"value":"customer loyality 1001 value"}'));
        ctx.stub.getState.withArgs('1002').resolves(Buffer.from('{"value":"customer loyality 1002 value"}'));
    });

    describe('#customerLoyalityExists', () => {

        it('should return true for a customer loyality', async () => {
            await contract.customerLoyalityExists(ctx, '1001').should.eventually.be.true;
        });

        it('should return false for a customer loyality that does not exist', async () => {
            await contract.customerLoyalityExists(ctx, '1003').should.eventually.be.false;
        });

    });

    describe('#createCustomerLoyality', () => {

        it('should create a customer loyality', async () => {
            await contract.createCustomerLoyality(ctx, '1003', 'customer loyality 1003 value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1003', Buffer.from('{"value":"customer loyality 1003 value"}'));
        });

        it('should throw an error for a customer loyality that already exists', async () => {
            await contract.createCustomerLoyality(ctx, '1001', 'myvalue').should.be.rejectedWith(/The customer loyality 1001 already exists/);
        });

    });

    describe('#readCustomerLoyality', () => {

        it('should return a customer loyality', async () => {
            await contract.readCustomerLoyality(ctx, '1001').should.eventually.deep.equal({ value: 'customer loyality 1001 value' });
        });

        it('should throw an error for a customer loyality that does not exist', async () => {
            await contract.readCustomerLoyality(ctx, '1003').should.be.rejectedWith(/The customer loyality 1003 does not exist/);
        });

    });

    describe('#updateCustomerLoyality', () => {

        it('should update a customer loyality', async () => {
            await contract.updateCustomerLoyality(ctx, '1001', 'customer loyality 1001 new value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1001', Buffer.from('{"value":"customer loyality 1001 new value"}'));
        });

        it('should throw an error for a customer loyality that does not exist', async () => {
            await contract.updateCustomerLoyality(ctx, '1003', 'customer loyality 1003 new value').should.be.rejectedWith(/The customer loyality 1003 does not exist/);
        });

    });

    describe('#deleteCustomerLoyality', () => {

        it('should delete a customer loyality', async () => {
            await contract.deleteCustomerLoyality(ctx, '1001');
            ctx.stub.deleteState.should.have.been.calledOnceWithExactly('1001');
        });

        it('should throw an error for a customer loyality that does not exist', async () => {
            await contract.deleteCustomerLoyality(ctx, '1003').should.be.rejectedWith(/The customer loyality 1003 does not exist/);
        });

    });

});
