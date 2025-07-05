const Review = require("../models/review.js");
const Listing = require('../models/listing.js');

module.exports.createReview = async(req,res,next)=>{
    const {id} = req.params;
    const newReview = new Review(req.body.review);
    const listing = await Listing.findById(id);
    newReview.author=req.user._id;
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    console.log(listing);
    // res.send("new review saved")

    req.flash("success","added a review!");
    res.redirect(`/listings/${id}`)
}

module.exports.deleteReview = async (req,res)=>{
    let {id, reviewId} = req.params;
    await Listing.findByIdAndUpdate(id, {$pull : {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("success","review deleted!");
    res.redirect(`/listings/${id}`)
}