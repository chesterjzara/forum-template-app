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

// Read - GET - a single user
router.get('/:id', (req, res) => { 
    User.findById( req.params.id, (err, foundUser) => { 
        res.status(200).json(foundUser);
    });
});

// Update - PUT - change user details
router.put('/:id', (req, res) => { 
    //Need to delete the password key so we don't overwrite the existing password
    delete req.body.password;
    User.findByIdAndUpdate( req.params.id, req.body, {new:true}, (err, updatedUser) => { 
        //Set the updated user as the session current user
        req.session.currentUser = updatedUser;
        res.status(200).json(updatedUser);
    });    
});

router.post('/checkpass', (req, res) => { 
    let userId = req.body._id;
    let checkPassword = req.body.oldPassword;
    let newPassword = req.body.newPassword;
    console.log(req.body);

    User.findById( userId, (err, foundUser) => { 
        //If the entered password matches -> change password
        if(bcrypt.compareSync(checkPassword, foundUser.password)) {
            foundUser.password = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));
            foundUser.save( (err, data) => { 
                res.status(200).json(data);
            })
        }
        //The old password is not right, send error
        else {
            res.status(401).json({
                status: 401,
                message: 'Login failed, incorrect password'
            })
        }
    })
})

module.exports = router;
