import jwt from "jsonwebtoken";

const generateTokenAndSetCookie = (userId, res) => {
	const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
		expiresIn: "15d",
	});

	res.cookie("jwt", token, {
		maxAge: 15 * 24 * 60 * 60 * 1000, // MS
		httpOnly: true, // prevent XSS attacks cross-site scripting attacks
		// When deploying frontend and backend on different domains, use 'none' and secure=true.
		// In development (localhost) we keep 'strict' to simplify local testing.
		sameSite: process.env.NODE_ENV === "development" ? "strict" : "none",
		secure: process.env.NODE_ENV === "production",
	});
	return token;
};

export default generateTokenAndSetCookie;
