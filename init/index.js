const mongoose = require('mongoose');
const data = require('./data.js');
const Listing = require('../models/listing.js');

const MONGO_URL='mongodb://localhost:27017/wonderplace'

main().then(()=>{
    console.log('connected to db')
}).catch((err)=>{
    console.log(err)
})

async function main(){
    await mongoose.connect(MONGO_URL)
}

const initDB = async()=>{
    await Listing.deleteMany({});
    data.data=data.data.map((obj)=>({...obj, owner: "685ee309e503b8252cfc261b"}));
    await Listing.insertMany(data.data);
    console.log('data was initialised')
}

initDB();