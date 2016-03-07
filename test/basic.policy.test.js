'use strict';

var fs = require('fs');
var path = require('path');
var express = require('express');
var supertest = require('supertest');
var echo = require('./support/echo-server');
var ldap = require('./support/ldap-server');
var mg = require('../lib/microgw');
var should = require('should');

describe('basic auth policy', function() {

  var request;
  before(function(done) {
    process.env.APIMANAGER = '127.0.0.1';
    process.env.NODE_ENV = 'production';
    mg.start(3000)
      .then(function() {
        return ldap.start(1389);
      })
      .then(function() {
        return echo.start(8889);
      })
      .then(function() {
        request = supertest('http://localhost:3000');
      })
      .then(done)
      .catch(function(err) {
        console.error(err);
        done(err);
      });
  });

  after(function(done) {
    delete process.env.APIMANAGER;
    delete process.env.NODE_ENV;
    mg.stop()
      .then(function() { ldap.stop(); })
      .then(function() { echo.stop(); })
      .then(done, done)
      .catch(done);
  });

  var clientId1 = 'fb82cb59-ba95-4c34-8612-e63697d7b845';
  it(`client_id=${clientId1} should pass with "root"/"Hunter2"`, function(done) {
    request
      .post('/v1/ascents?client_id=' +  clientId1)
      .auth('root', 'Hunter2')
      .send({date: 'today', route: '66'})
      .expect(200, '{"date":"today","route":"66"}', done);
  });

  it(`client_id=${clientId1} should fail`, function(done) {
    request
    .post('/v1/ascents?client_id=' +  clientId1)
    .auth('root', 'badpass')
    .send({date: 'today', route: '66'})
    .expect(401, {name: 'PreFlowError', message: 'unable to process the request'}, done);
  });

  it(`client_id=${clientId1} should fail with http and "root"/"Hunter3"`, function(done) {
    request
      .put('/v1/ascents?client_id=' +  clientId1)
      .auth('root', 'Hunter3')
      .send({date: 'today', route: '66'})
      .expect(401, {name: 'PreFlowError', message: 'unable to process the request'}, done);
  });

  it(`client_id=${clientId1} should pass with http and "root"/"Hunter2"`, function(done) {
    request
      .put('/v1/ascents?client_id=' +  clientId1)
      .auth('root', 'Hunter2')
      .send({date: 'today', route: '66'})
      .expect(200, '{"date":"today","route":"66"}', done);
  });

});
