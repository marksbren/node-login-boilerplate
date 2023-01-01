var expect = require('chai').expect;
var app = require('../app');
var request = require('supertest');

const validUser = {
  email: 'a@a.com', 
  password: '12345678'
}

//now let's login the user before we run any tests
var authenticatedUser = request.agent(app);

before(function(done){
  authenticatedUser
    .post('/login/password')
    .send(validUser)
    .end(function(err, response){
      expect(response.statusCode).to.equal(302);
      expect('Location', '/verify');
      done();
    });
});

describe('GET /users', function(done){
    it('should 302 to /verify if the user is not verified ', function(done){
      authenticatedUser.get('/users')
      .expect('Location', '/verify')
      .expect(302, done);
    });
    it('should return a 302 response and redirect to /login', function(done){
      request(app).get('/users')
      .expect('Location', '/login')
      .expect(302, done);
    });
  });