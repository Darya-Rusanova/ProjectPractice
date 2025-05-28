const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const recipeRoutes = require('./routes/recipes');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

dotenv.config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/recipes', recipeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
    res.send('Recipe API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 
