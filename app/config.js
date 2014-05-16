var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var hashPassword = function(pw){
  //return hashed password
    var cipher = Promise.promisify(bcrypt.hash);

    return cipher(pw, null, null)
        .then(function(hash) {
          console.log('hash is: ', hash);
          return hash;
        });
  };

mongoose.connect('mongodb://localhost/curtlyDB');


var db = {};

db.urlSchema = new Schema({
  url: {type: String, unique: true},
  base_url: String,
  code: String,
  title: String,
  visits: Number
});

db.usersSchema = new Schema({
  username: {type: String, unique: true},
  password: {type: String}
});

db.usersSchema.pre('save', function(next){
  var cipher = Promise.promisify(bcrypt.hash);
  return cipher(this.password, null, null).bind(this)
  .then(function(hash){
    this.password = hash;
    next();
  });
});

db.User = mongoose.model('User', db.usersSchema);

var promisifiedSave = Promise.promisify((new db.User).save);

db.Url =  mongoose.model('Url', db.urlSchema);

// //   example usage
// var user = new db.User({username: "robesfrto41234", password: "6"});
// user.save(function(err){
//   if (err){
//     console.error(err);
//   } else {
//     console.log("user inserted successfully");
//   }
// });
//
  // var query = db.User.find({username : 'roberto4asdf'});
  // query.exec(function(err, results){
  //   console.log(results);
  // });

// var username = 'rro4berto4aasdsdffsdf';
// var password = 'this is a password';
// var query = db.User.find({username : username});
// console.log('query returned');
// query.exec().then(function(results){
//   console.log("callback from then");
//   console.log(results);
//   console.log(results.length);
//   if(results.length === 0){
//     var newUser = new db.User({
//       username: username,
//       password: password
//     });
//     return promisifiedSave.call(newUser);
//   } console.log("user already existed");
// }, function(err){
//   console.log(err);
//   throw err;
// }).then(function(value){
//   console.log("final value is: ", value);
//   console.log('promisifying worked');
//   // redirect ?
// });
//
var username = 'rro4berto4aasdsdffsdf';
var password = 'this is a password!!';
var promisifiedCompare = Promise.promisify(bcrypt.compare);

var query = db.User.find({username : username});
query.exec().then(function(results){
  if(results.length === 0){
    //res.redirect('/login');
  } else {
    //check if passwords match
    var hashedPassword = results[0].password;
    return promisifiedCompare(password, hashedPassword);
  }
}, function(err){
  throw err;
}).then(function(match){
  if (match) {
    console.log('passwords match')
  } else {
    console.log('no match')
  }
});
console.log('on the other side of the promise');

module.exports = db;
