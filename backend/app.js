//express
const express = require('express');
const app = express();
const slowDown = require('express-slow-down');
const rateLimit = require('express-rate-limit');

//Graphql
const graphqlHTTP = require('express-graphql').graphqlHTTP;
const schema = require('./schemas/schema');

//Database
const mongoose = require('mongoose');

//Security
const cors= require('cors');
const isAuth = require('./middlewares/is-auth');
require('dotenv').config();



app.use(cors());
//app.use(limiter); //use the limiter const to limit requests coming from IP
//app.use(speedLimiter); //add delay if user passes requests per second

app.use(isAuth);

//use graphql express
app.use('/graphql',graphqlHTTP({
    schema:schema,
    graphiql:true
}));

//connect mongodb
mongoose.connect(process.env.DB_CONNECTION, ()=> {console.log('connected to db')});

//run server on 4000 port
app.listen(4000, ()=> console.log('listening port 4000'));

