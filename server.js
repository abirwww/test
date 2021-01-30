var express = require("express");
var app = express();

var formidable = require("express-formidable");
app.use(formidable());

var mongodb = require("mongodb");
var mongoClient = mongodb.MongoClient;
var ObjectId = mongodb.ObjectId;

var http = require("http").createServer(app);
var bcrypt = require("bcrypt");
var fileSystem = require("fs");

var jwt = require("jsonwebtoken");
var accessTokenSecret = "myAccessTokenSecret1234567890";

app.use("/public", express.static(__dirname + "/public"));
app.set("view engine", "ejs"); //engine banan hoy nai.... ooo ok

var socketIO = require("socket.io")(http);
var socketID = "";
var users = [];

var mainURL = "http://localhost:3000";

socketIO.on("connection", function (socket) {
  console.log("User connected", socket.id);
  socketID = socket.id;
});

http.listen(3000, function () {
  console.log("Server started.");

  mongoClient.connect("mongodb://localhost:27017", function (error, client) {
    var database = client.db("my_social_network");
    console.log("database connected.");

    app.get("/signup", function (request, result) {
      // dhoro eikhan e change korlam
      console.log(result);
      result.render("signup");
    });

    app.post("/signup", function(request, result) {
      var name = request.fields.name;
      var username = request.fields.username;
      var email = request.fields.email;
      var password = request.fields.password;
      var gender = request.fields.gender;

      database.collection("users").findOne({
        $or: [{
          "email": email
        }, {
          "username": username
        }]
      }, function (error, user) {
        if (user == null) {
          bcrypt.hash(password, 10, function (error, hash) {
            database.collection("users").insertOne({
              "name": name,
              "username": username,
              "email": email,
              "password": hash,
              "gender": gender,
              "profileImage": "",
              "coverPhoto": "",
              "dob": "",
              "city": "",
              "country": "",
              "aboutMe": "",
              "friends": [],
              "pages": [],
              "notifications": [],  // sign up koro to
              "groups": [],
              "posts": []
            }, function (error, data) {
              result.json({
                "status": "success",
                "message": "Signed up successfully.You can login now. "
              });
            });
          });
        }  else {
            result.json({
              "status": "error",
              "message": "Email or username already exist."
            });
          }
        });
      });
      app.get("/login", function (request, result){
        result.render("login");
      });
      app.post("/login", function (request, result) {
        var email = request.fields.email;
        var password = request.fields.password;
        database.collection("users").findOne({
          "email": email
        }, function (error, user) {
          if (user == null) {
            result.json({
              "status": "error",
              "message": "Email does not exist"
            });
          } else {
            bcrypt.compare(password, user.password, function (error, isVerify) {
              if (isVerify) {
                var accessToken = jwt.sign({ email: email}, accessTokenSecret);
                database.collection("users").findOneAndUpdate({
                  "email": email
                }, {
                $set: {
                  "accessToken": accessToken
                }
              }, function (error, data) {
                result.json({
                  "status": "success",
                  "message": "Login successfully",
                  "accessToken": accessToken,
                  "profileImage": user.profileImage
                });
              });
            } else {
              result.json({
                "status": "error",
                "message": "Password is not correct"
              });
            }
          });
              }
            });
          });
          app.get("/updateProfile", function (request, result){
            result.render("updateProfile");
          });
          app.post("/getUser", function(request, result){
            var accessToken = request.fields.accessToken;
            database.collection("users").findOne({
              "accessToken": accessToken
            }, function (error, user) {
              if (user == null) {
                  result.json({
                    "status": "error",
                    "message": "User has been logged out. Please login again."
                  });
                } else {
                  result.json({
                    "status": "success",
                    "message": "Record has been fetched.",
                    "data": user
                  });
                }
              });
            });
            app.get("/logout", function (request, result) {
              result.redirect("/login");
            });
        });
      });
