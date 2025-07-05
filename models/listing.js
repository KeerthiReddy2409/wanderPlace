const mongoose= require('mongoose');
const Review = require("./review.js");
const User =require("./user.js")

const lsitingSchema = new mongoose.Schema({
    title: {
        type:String,
        required: true
    },
    description : {
        type: String
    },
    image: {
        url: String,
        filename: String,
    },
    price:{
        type: Number
    },
    location:{
        type:String
    },
    country:{
        type:String
    },
    reviews : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Review"
        }
    ],
    owner : {
        type: mongoose.Schema.Types.ObjectId,
        ref : "User"
    }
})

lsitingSchema.post('findOneAndDelete', async (listing)=>{
    await Review.deleteMany({_id : {$in: listing.reviews}})
});

const Listing = mongoose.model('Listing',lsitingSchema)

module.exports = Listing;