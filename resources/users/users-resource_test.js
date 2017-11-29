var expect = require('chai').expect,
    assert = require('chai').assert,
    debug = require('../../Debug')('test:users-resource'),
    _ = require('lodash'),
    mongoose = require('mongoose');

var UserModel = require('./users-resource');


/**
 * Setup tests
 */
var monky = require('../../tests/resources')(mongoose);


/**
 * Tests
 */
describe('users-resource', function() {
  before(function(done) {
    mongoose.connect('mongodb://localhost/konmari-test', done);
  });

  after(function(done) {
    UserModel.remove({}, function() {
      monky.reset();
      mongoose.disconnect(done);
    });
  });

  it('should check password by its hash', function(done) {
    monky.build('User', function(err, user) {
      var actualPassword = user.password;
      user.save(function(err, resultUser) {
        user.checkPassword(actualPassword).then(function(checkedUser) {
          expect(checkedUser).to.equal(user);
          expect(actualPassword).not.to.equal(checkedUser.password);
          done();
        });
      });
    });
  });

  it('should remove password from toJSON result', function(done) {
    monky.build('User', function(err, user) {
      expect(user.toJSON().password).to.equal(undefined);
      done();
    });
  });

  it('should fail login', function(done) {
    monky.build('User', function(err, user) {
      UserModel.login(user.email, user.password).then(null, function(err) {
        console.log(err);
        done();
      });
    });
  });

  it('should login user', function(done) {
    monky.create('User').then(function(user) {
      return UserModel.login(user.email, user.password);
    }).then(function() {
      done();
    });
  });
});
