const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models/User.models");

let refreshTokens = [];

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_LIFE,
  });
}

exports.refreshTokens = async function (body) {
  const { refresh_token } = body;

  if (!refreshTokens.includes(refresh_token)) {
    return { message: "No refresh token found" };
  }

  let accessToken = "";
  let error = false;
  jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) error = true;
    accessToken = generateAccessToken({ username: user });
  });
  if (error) {
    return { message: "Invalid refresh token" };
  }
  return { accessToken: accessToken };
};

exports.getUser = async function (body) {
  const { _id } = body;
  const result = await User.findById(_id);
  if (!result) {
    return { message: "User not found", result: null };
  }
  return { message: "User found", result };
};

exports.register = async function (body) {
  const { ...user } = body;
  if (!user.username || !user.password || !user.email) {
    return { message: "Please fill all the fields" };
  }

  // check if the username or email already exists
  const username
    = await User.findOne({ username: user.username });
  if (username) {
    return { message: "Username already exists" };
  }
  const email = await User.findOne({
    email: user.email,
  });
  if (email) {
    return { message: "Email already exists" };
  }

  if (user.password.length < process.env.PASSWORD_LENGTH) {
    return { message: "Password must be at least 8 characters", result: null };
  }
  user.password = await bcrypt.hash(user.password, 10);
  const result = new User({
    ...user,
  });
  await result.save();
  return { message: "User created", result };
};

exports.login = async function (body) {
  const { email, password } = body;
  const user = await User.findOne({
    $or: [{ email: email }, { username: email }],
  });

  if (!user) {
    return { message: "User not found" };
  }

  const passwordCheck = await bcrypt.compare(password, user.password);
  if (!passwordCheck) {
    throw new Error("Password is not correct");
  }

  delete user._doc.password;
  return { message: "Login Successful!", result: user };
};

exports.logout = async function (body) {
  const { refresh_token } = body;
  if (!refreshTokens.includes(refresh_token)) {
    return { message: "No refresh token found" };
  }
  refreshTokens = refreshTokens.filter((token) => token !== refresh_token);
  return { message: "Logout successful" };
};

exports.getAllUser = async function (body) {
  try {
    const result = await User.find().sort({ createdAt: -1 });

    // just passed data of id, username, email, password, role, division
    const data = result.map((account) => {
      const { _id, username, email, role, division } = account;
      return { _id, username, email, role, division };
    })

    return { message: "Get All User Success", result: data };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { message: "Get All User Failed", error: error.message };
  }
};

