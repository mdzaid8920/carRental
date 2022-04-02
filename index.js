const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');
const port = process.env.PORT || 8000
dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({ extended: true }))

const authRoutes = require('./Routes/auth');
const carRoutes = require('./Routes/car');
const userRoutes = require('./Routes/user');


// app.use(express.json());
app.use(bodyParser.json())
app.use('/image',express.static(path.join(__dirname, '/images')));
app.use('/api/auth', authRoutes)
app.use('/api/car', carRoutes)
app.use('/api/user', userRoutes)

mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log('connection build with Database')
    app.listen(port, () => {
        console.log(`Server is listening on port ${port}`)
    })
}).catch((err) => {
    console.log(err)
})