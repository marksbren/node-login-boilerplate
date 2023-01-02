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

// TODO: change this to the homepage (now has logged in & logged out states)
describe('GET / when logged in', function(done){
    it('should 302 to /verify if the user is not verified ', function(done){
      authenticatedUser.get('/')
      .expect('Location', '/verify')
      .expect(302, done);
    });
    it('should return a 200 response with logged out page', function(done){
      request(app).get('/')
      .expect(200, done);
    });
  });