
const express = require("express");
require('dotenv').config()

const cors = require("cors");
const axios = require('axios');

let app = express();

const PORT = process.env.PORT || 3000;
const bodyParser = require('body-parser');


app.use(cors());
app.options("*", cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const { response } = require("express");

app.post("/test",(req,res)=>{
    res.send("Jon")
  })
  

app.listen(process.env.PORT || 3000, err => {
    if (err) {
      
    }
    console.log(`Listening on ${PORT}` );
   });