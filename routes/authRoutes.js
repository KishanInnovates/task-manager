const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const cookieParser = require("cookie-parser")

const router = express.Router();
router.use(cookieParser())


//generate access token
const generateAccessToken = (user) => {
  return jwt.sign({id: user._id, role: user.role}, process.env.JWT_SECRET, {expiresIn: "15m",})
}
//generate refres token
const generateRefreshToken = (user) => {
  return jwt.sign({id: user._id}, process.env.REFRESH_SECRET, {expiresIn: "7d"})
}
//Register user
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: "All fields are required!" });
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists!" });

    const user = new User({ username, email, password });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

//login user
router.post("/login", async function (req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid Credentials!" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials!" });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict"
    })
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/refresh", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: "Unauthorized" })
  
  jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Forbidden" })
    const newAccessToken = generateAccessToken({ id: decoded.id })
    res.json({accessToken: newAccessToken})
  });
})

//logout route
router.post("/logout", (req, res) => {
  res.clearCookie("refreshToken");
  res.json({message: "Logged out successfully"})
})
module.exports = router;
