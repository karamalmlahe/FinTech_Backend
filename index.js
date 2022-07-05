const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors=require('cors');
const app = express();
const dotenv=require('dotenv');
const accountsRoute= require('./controllers/account')

app.use(bodyParser.urlencoded({extends:false}));
app.use(bodyParser.json());
app.use(cors());
dotenv.config();

app.use('/api/accounts', accountsRoute);

const port = process.env.SERVER_PORT || 3000;

const url = process.env.MONGODB_URL;
mongoose.connect(url)
.then(results => {
    app.listen(port, function(){
        console.log(`Server is runing via port ${port}`);
    })
})
.catch(err => {
    console.log(err);
})