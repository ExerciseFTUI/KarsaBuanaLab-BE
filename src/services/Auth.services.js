const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User.models');

let refreshTokens = [];

function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_LIFE });
}

exports.refreshTokens = async function (body){
    const {refresh_token} = body;

    if(!refreshTokens.includes(refresh_token)){
        return { message: "No refresh token found" }
    }

    let accessToken = '';
    let error = false;
    jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) error = true;
        accessToken = generateAccessToken({ username: user });
    })
    if (error) {
        return { message: "Invalid refresh token" }
    }
    return { accessToken: accessToken }
}

exports.getUser = async function (body){
    const {_id} = body;
    // const result = await User.findById(_id);
    const result = await User.find();
    if (!result){
        return {message: "User not found"};
    }
    return result;
}


exports.register = async function (body){
    const {username, password, email} = body;
    if (!username || !password || !email){
        return {message: "Please fill all the fields"};
    }
    if (password.length < process.env.PASSWORD_LENGTH){
        return {message: "Password must be at least 8 characters"};
    }
    const pass = await bcrypt.hash(password, 10);
    const result = new User({
        username: username,
        password: pass,
        email: email,
        role: 'user'
    });
    await result.save();
    return result;
    
}

exports.login = async function (body){
    const {email, password} = body;
    const user = await User.findOne({email});
    if(!user){
        return {message: "User not found"}
    }

    const passwordCheck = await bcrypt.compare(password, user.password);
    if(!passwordCheck){
        return {message: "Password is not correct"}
    }

    const accessToken = generateAccessToken({username: user.username});
    const refreshToken = jwt.sign({ email: user.email }, process.env.REFRESH_TOKEN_SECRET);
    refreshTokens.push(refreshToken);
    if(refreshTokens.length > process.env.REFRESH_TOKEN_LIMIT){
        refreshTokens.shift();
    }

    return{ accessToken: accessToken, refreshToken: refreshToken}
}

exports.logout = async function (body){
    const {refresh_token} = body;
    if(!refreshTokens.includes(refresh_token)){
        return { message: "No refresh token found" }
    }
    refreshTokens = refreshTokens.filter((token) => token !== refresh_token);
    return { message: 'Logout successful'}
}