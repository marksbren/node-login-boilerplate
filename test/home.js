var expect = require('chai').expect;
var app = require('../app');
var request = require('supertest');

describe('GET /', function(done){
  //addresses 1st bullet point: if the user is logged in we should get a 200 status code
  it('should return a 200 response', function(done){
    request(app).get('/')
    .expect(200, done);
  });
});