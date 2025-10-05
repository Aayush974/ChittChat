import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import generateTokenAndSetCookie from "../utils/generateToken.js";

export const signup = async (req, res) => {
	try {
		const { fullName, email, username, password, confirmPassword, gender } = req.body;

    if (
      !fullName ||
      !username ||
      !email ||
      !password ||
      !confirmPassword ||
      !gender
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

		// Check for existing username or email
		const existingUser = await User.findOne({ $or: [{ username }, { email }] });
		if (existingUser) {
			if (existingUser.username === username) return res.status(400).json({ error: "Username already exists" });
			if (email && existingUser.email === email) return res.status(400).json({ error: "Email already exists" });
			return res.status(400).json({ error: "User already exists" });
		}

    // HASH PASSWORD HERE
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // https://avatar-placeholder.iran.liara.run/

    const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
    const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;

		const newUser = new User({
			fullName,
			email,
			username,
			password: hashedPassword,
			gender,
			profilePic: gender === "male" ? boyProfilePic : girlProfilePic,
		});

		if (newUser) {
			// Generate JWT token here and return it in response for Authorization header fallback
			const token = generateTokenAndSetCookie(newUser._id, res);
			await newUser.save();

			res.status(201).json({
				_id: newUser._id,
				fullName: newUser.fullName,
				username: newUser.username,
				profilePic: newUser.profilePic,
				token,
			});
		} else {
			res.status(400).json({ error: "Invalid user data" });
		}
	} catch (error) {
		console.log("Error in signup controller", error.message);
		// Handle duplicate key error (E11000)
		if (error.code === 11000) {
			const dupKey = Object.keys(error.keyValue || {})[0];
			if (dupKey) {
				return res.status(400).json({ error: `${dupKey} already exists` });
			}
			return res.status(400).json({ error: "Duplicate key error" });
		}
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const login = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = await User.findOne({ username });
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user?.password || ""
    );

    if (!user || !isPasswordCorrect) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

		const token = generateTokenAndSetCookie(user._id, res);

		res.status(200).json({
			_id: user._id,
			fullName: user.fullName,
			username: user.username,
			profilePic: user.profilePic,
			token,
		});
	} catch (error) {
		console.log("Error in login controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
