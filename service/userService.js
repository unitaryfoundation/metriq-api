//userService.js

// Data Access Layer
const MongooseService = require( "./mongooseService" );
// Database Model
const User = require( "../model/userModel" );

// Password hasher
const bcrypt = require('bcrypt');
const e = require("express");
const saltRounds = 10;

class UserService {
    constructor() {
        this.MongooseServiceInstance = new MongooseService(UserModel);
    }

    async create(userToCreate) {
        try {
            const result = await this.MongooseServiceInstance.create(userToCreate);
            return { success: true, body: result };
        } catch ( err ) {
            return { success: false, error: err };
        }
    }

    async getByUsername(username) {
        return await UserModel.find({ usernameNormal: username }).limit(1).exec();
    }

    async getByEmail(email) {
        return await UserModel.find({ email: email }).limit(1).exec();
    }

    async register(reqBody) {
        let validationResult = await this.validateRegistration(reqBody);
        if (!validationResult.success) {
            return validationResult;
        }

        let user = new User();
        user.username = reqBody.username.trim();
        user.usernameNormal = tlUsername;
        user.email = tlEmail;
        user.dateJoined = new Date();
        user.passwordHash = await bcrypt.hash(reqBody.password, saltRounds);

        return this.create(user);
    }

    validateEmail(email) {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    async validateRegistration(reqBody) {
        if (!reqBody['password'] || (reqBody.password.length < 8)) {
            return { success: false, err: 'Password is too short.' };
        }
    
        if (!reqBody['passwordConfirm'] || (reqBody.password !== reqBody.passwordConfirm)) {
            return { success: false, err: 'Password and confirmation do not match.' };
        }

        if (!reqBody['username']) {
            return { success: false, err: 'Username cannot be blank.' };
        }

        let tlUsername = reqBody.username.trim().toLowerCase();
        if (tlUsername.length == 0) {
            return { success: false, err: 'Username cannot be blank.' };
        }

        if (!reqBody['email']) {
            return { success: false, err: 'Email cannot be blank.' };
        }
    
        let tlEmail = reqBody.email.trim().toLowerCase();

        if (tlEmail.length == 0) {
            return { success: false, err: 'Email cannot be blank.' };
        }

        if (!this.validateEmail(tlEmail)) {
            return { success: false, err: 'Invalid email format.' };
        }
    
        var usernameMatch = await this.getByUsername(tlUsername);
        if (usernameMatch.length > 0) {
            return { success: false, err: 'Username already in use.' };
        }
    
        var emailMatch = await this.getByEmail(tlEmail);
        if (emailMatch.length > 0) {
            return { success: false, err: 'Email already in use.' };
        }

        return { success: true }
    }
}

module.exports = UserService;