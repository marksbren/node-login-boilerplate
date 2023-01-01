// test/test_helper.js
  
const mongoose = require('mongoose');
  
// tells mongoose to use ES6 implementation of promises
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URL);
  
mongoose.connection
    .once('open', () => console.log('Connected!'))
    .on('error', (error) => {
        console.warn('Error : ', error);
    });
      
    // runs before each test
    beforeEach((done) => {
        mongoose.connection.collections['users'].drop(() => {
        done(); 
       });
});