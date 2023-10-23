require('dotenv').config();
const express = require('express');
const app = express();

//middleware
app.use((req, res, next) => {
    console.log(req.path, req.method);
    next()
})
//routes
app.get('/', (req, res) =>{
    res.json({msg : 'Welcome to real-time chat app'});
})
//listen for requests
app.listen(process.env.PORT, () =>{
    console.log('listening on port', process.env.PORT);
})
