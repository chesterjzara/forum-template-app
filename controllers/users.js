const express = require('express');
const router = express.Router();

//Require bcrypt - hash+salt passwords
const bcrypt = require('bcrypt');

//Mongoose Data Model
const User = require('../models/users.js');

//Creates a new user with username and password
router.post('/', (req, res) => {
    req.body.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
    User.create(req.body, (err, createdUser) => {
        if (createdUser) {
            res.status(201).json({
                status: 201,
                message: "user created"
            });
        }
        else {
            console.log('error creating user: ', err.message);
            res.status(400).json({
                status: 400,
                message: err.message
            })
        }
    });
});


module.exports = router;
