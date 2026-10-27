const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');


//Register User
const registerUser = async (req, res) => {
    try{
        const {name, email, password} = req.body;

        // Check required fields
        if(!name || !email || !password){
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        //Check existing user
        const existingUser = await userModel.findOne({email});

        if(existingUser){
            return res.status(409).json({
                success: false,
                message: "User already exists"
            });
        }

        //Hash password
        const hashPassword = await bcrypt.hash(password, 10);

        //Create user
        const user = await userModel.create({
            name, 
            email,
            password: hashPassword
        });

        //Send response
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch(error){
        console.error("Register error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


//Login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        //Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        //Find user
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        //Compare password
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        //Generate JWT
        const token = generateToken(user._id);

        //Send response
        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


//Get me
const getMe = async (req, res) => {
    try {
        const user = await userModel.findById(req.userId)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        console.error("Get user error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe
};

