import User from "../Models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { saltRounds } from "../constants.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { ApiError } from "../Utils/ApiError.js";
import { generateKeyPair } from "../Services/keyGeneration.js";
import cryptoJs from 'crypto-js';

const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(new ApiError(400, "user already registered"));
    }
    let hashedPassword = await bcrypt.hash(password, saltRounds);
    req.body.password = hashedPassword;
    const newUser = new User(req.body);
    await newUser.save(req.body);
    return res
      .status(200)
      .json(new ApiResponse(200, newUser, "user registered succesfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

const loginUser = async (req, res) => {
  try {
    //EXTRACT UNIQUE VALUE FROM DOCUMENT
    const { email } = req.body;

    //SEARCH FOR EXISTING USER
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res
        .status(400)
        .json(new ApiError(400, "Please register before you log in"));
    }

    //COMPARE PASSWORD 
    const comparePassword = await bcrypt.compare(
      req.body.password,
      existingUser.password
    );
    if (!comparePassword) {
      return res.status(400).json(new ApiError(400, "Invalid credentials"));
    }

    //DEFINE JWT PAYLOAD
    const payload = {
      userId: existingUser._id,
      email: existingUser.email,
    };

    //ENCRYPT PAYLOAD
    const encryptedData= await cryptoJs.AES.encrypt(
        JSON.stringify(payload),
        process.env.CRYPTO_SECRET
    ).toString()

    //SIGN JWT
    const token = await jwt.sign({data:encryptedData}, process.env.JWT_SECRET, {
      expiresIn: "10h",
    });

    //SET COOKIE
    res.cookie("token", token, {
      maxAge: 3600000,
      httpOnly: true,
      secure: true,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, token, "user registered succesfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

const findUser = async (req, res) => {
  try {
    const userId=req.userData.userId;
    const user=await User.findById(userId)
    // generateKeyPair()
    return res
      .status(200)
      .json(
        new ApiResponse(200, user, "lkess go")
      );
  } catch (error) {
    console.log(error)
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export { registerUser, loginUser, findUser };
