const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const app = express();
const port = process.env.PORT;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully");
    })
    .catch((err) => {
        console.log("MongoDB Connection Error:", err.message);
    });

app.use(cors());
app.use(express.json());

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', UserSchema);

const CustomerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    membershipType: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Customer = mongoose.model('Customer', CustomerSchema);

const verifyToken = (req, res, next) => {
    let token = req.headers['authorization'];
    if (!token) return res.status(403).send("Token Missing");

    token = token.replace('Bearer ', '');

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).send('Invalid Token');
        req.userId = decoded.userId;
        next();
    });

};

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const oldUser = await User.findOne({ username });
        if (oldUser) return res.status(400).json({ message: "Username already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username,
            password: hashedPassword
        });

        await user.save();
        res.status(201).json({ message: "User Registered Successfully" });

    } catch (error) {
        console.log("Register Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

app.post('/api/Login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ message: "Invaild Credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid Credentials" });

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });

    } catch (error) {
        console.log("Login Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});


app.post('/api/Customer', verifyToken, async (req, res) => {
    try {
        const { name, membershipType } = req.body;

        const customer = new Customer({
            name,
            membershipType,
            user: req.userId
        });

        await customer.save();
        res.status(201).json({ message: "Customer Added Successfully" });

    } catch (error) {
        console.log("Add Customer Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

app.get('/api/readCustomer', verifyToken, async (req, res) => {
    try {
        const customers = await Customer.find({ user: req.userId });
        res.json(customers);

    } catch (error) {
        console.log("Read Customer Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

app.put('/api/Customer/:id', verifyToken, async (req, res) => {
    try {
        const { name, membershipType } = req.body;

        await Customer.findOneAndUpdate(
            { _id: req.params.id, user: req.userId },
            { name, membershipType }
        );

        res.json({ message: "Customer Updated Successfully" });

    } catch (error) {
        console.log("Update Customer Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});


app.delete('/api/Customer/:id', verifyToken, async (req, res) => {
    try {
        await Customer.findOneAndDelete({ _id: req.params.id, user: req.userId });
        res.json({ message: "Customer Deleted Successfully" });

    } catch (error) {
        console.log("Delete Customer Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
