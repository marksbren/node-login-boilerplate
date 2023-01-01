var expect = require('chai').expect;
var app = require('../app');
var request = require('supertest');


const validUser = {
  email: 'a@a.com', 
  password: '12345678'
}

const invalidEmailUser = {
  email: 'aabcd', 
  password: '12345678'
}

const invalidPasswordUser = {
  email: 'b@b.com', 
  password: '123'
}

describe('GET /signup page', function(done){
  //addresses 1st bullet point: if the user is logged in we should get a 200 status code
    it('should return a 200 response', function(done){
      request(app).get('/')
      .expect(200, done);
    });
  });

describe('Create account 1: create valid user', function(done){
  it('should return success with valid input', function(done) {
    request(app).post('/signup')
    .send(validUser)
    .expect('Location', '/verify')
    .expect(302, done);
  })
});