var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');

// var mongoose = require('mongoose');
var db = require('../app/config');
// var User = require('../app/models/user');
// var Link = require('../app/models/link');
// var Users = require('../app/collections/users'); //remove
// var Links = require('../app/collections/links'); //remove
var scripts;
var Promise = require('bluebird');

var promisifiedSave = Promise.promisify((new db.User).save);
var promisifiedCompare = Promise.promisify(bcrypt.compare);


if (process.env.NODE_ENV === 'production'){
  scripts = ['/dist/app.min.js'];
} else {
  scripts = ['/client/app.js',
             '/client/link.js',
             '/client/links.js',
             '/client/linkView.js',
             '/client/linksView.js',
             '/client/createLinkView.js',
             '/client/router.js'];
}

scripts = ['/dist/app.min.js'];

exports.renderIndex = function(req, res) {
  res.render('index', { scripts: scripts});
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function(){
    res.redirect('/login');
  });
};

// refactor this function
exports.fetchLinks = function(req, res) {
  var query = db.Url.find();
  query.exec().then(function(data){
    res.send(200, data);
  });
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  var query = db.Url.find({url: uri});
  query.exec().then(function(data){
    if(data.length !== 0){
      res.send(200, data[0]);
    } else {
      util.getUrlTitle(uri, function(err, title){
        if ( err ){
          console.log( 'error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new db.Url({url: uri,
                               title: title,
                               base_url: req.headers.origin});
        return promisifiedSave.call(link);
      });
    }
  }).then(function(result){
    res.send(200, result);
  });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  var query = db.User.find({username : username});
  query.exec().then(function(results){
    if(results.length === 0){
      res.redirect('/login');
    } else {
      //check if passwords match
      var hashedPassword = results[0].password;
      return promisifiedCompare(password, hashedPassword);
    }
  }, function(err){
    throw err;
  }).then(function(match){
    if (match) {
      util.createSession(req,res, username);
    } else {
      res.redirect('/login');
    }
  });
};


exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  var query = db.User.find({username : username});
  query.exec()
  .then(function(results){
    if(results.length === 0){
      var newUser = new db.User({
        username: username,
        password: password
      });
      return promisifiedSave.call(newUser);
    }
  }, function(err){
    throw err;
  }).then(function(value){
    if(value !== undefined){
      res.redirect('/login');
    }
    else{
      res.redirect('/signup');
    }
  });
};

exports.navToLink = function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      link.set({ visits: link.get('visits') + 1 })
        .save()
        .then(function() {
          return res.redirect(link.get('url'));
        });
    }
  });
};
