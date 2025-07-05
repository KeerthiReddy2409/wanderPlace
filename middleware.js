const Listing = require('./models/listing.js');
const Review = require("./models/review.js");
const {listingSchema} = require('./schema.js');
// const ExpressError = require('./utils/ExpressError.js');
const ExpressError = require('./utils/ExpressError.js');
const {reviewSchema} = require('./schema.js');

module.exports.isLoggedIn = (req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;
        req.flash("error","you are logged in to add a listing login or signup first");
        return res.redirect("/login")
    }
    next();
}

module.exports.saveRedirectUrl = (req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl=req.session.redirectUrl;
    }
    next();
}

module.exports.isOwner = async (req,res,next)=>{
    const {id} = req.params;
    const listing=await Listing.findById(id);
    if(!listing.owner._id.equals(res.locals.currUser._id)){
        req.flash("error","you are not allowed to do this");
        return res.redirect(`/listings/${id}`)
    };
    next();
}

module.exports.validateListing= (req,res,next)=>{
    let {error} =listingSchema.validate(req.body);
    // console.log(result);
    if(error){
        let errMsg = error.details.map((el)=>el.message).join(",");
        throw new ExpressError(400, errMsg);
    }else{
        next()
    }
}

module.exports.validateReview = (req,res,next)=>{
    let {error} =reviewSchema.validate(req.body);
    // console.log(result);
    if(error){
        let errMsg = error.details.map((el)=>el.message).join(",");
        throw new ExpressError(400, errMsg);
    }else{
        next()
    }
}

module.exports.isReviewAuthor =async(req,res,next)=>{
    let {id,reviewId} = req.params;
    let review = await Review.findById(reviewId);
    if (!review.author.equals(res.locals.currUser._id)){
        req.flash("error", "you are not the author of this review");
        return res.redirect(`/listings/${id}`)
    }
    next();
}

module.exports.checkBookingDatesAvailable = (req, res, next) => {
  const { bookingDates } = req.session;

  if (!bookingDates?.checkIn || !bookingDates?.checkOut) {
    req.flash('error', 'Please check availability before booking.');
    return res.redirect(`/listings/${req.params.id}`);
  }

  res.locals.checkIn = new Date(bookingDates.checkIn);
  res.locals.checkOut = new Date(bookingDates.checkOut);

  next();
};
