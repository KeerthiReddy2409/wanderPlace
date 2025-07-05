const Listing = require('../models/listing.js');
const Review = require('../models/review.js');
const Booking = require('../models/booking.js');
const mongoose = require('mongoose');
const crypto = require("crypto");

module.exports.index = async (req, res) => {
  const { destination } = req.query;

  let filter = {};
  if (destination) {
    filter = {
      $or: [
        { location: { $regex: destination, $options: "i" } },
        { country: { $regex: destination, $options: "i" } }
      ]
    };
  }

  const allListings = await Listing.find(filter);
  res.render("listings/index.ejs", { allListings, destination });
};


module.exports.new = (req,res)=>{
    res.render('listings/new.ejs')
}

module.exports.show = async (req,res)=>{
    const {id} = req.params;
    const list=await Listing.findById(id)
    .populate({
        path:'reviews',
        populate:{
            path: "author",
        }}).populate("owner");
    if (!list){
        req.flash("error","The listing you requested doesnt exist");
        return res.redirect("/listings")
    }
    res.render('listings/show.ejs',{list})

}

module.exports.create = async (req,res,next)=>{
    const newListing=new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
    await newListing.save();
    req.flash("success","New Listing created!");
    res.redirect('/listings');

    
}

module.exports.edit = async (req,res)=>{
    const {id} = req.params;
    const listing = await Listing.findById(id);
    if (!listing){
        req.flash("error","The listing you requested doesnt exist");
        res.redirect("/listings")
    }
    let originalImage = listing.image.url;
    originalImage=originalImage.replace('/upload','/upload/w_250')
    res.render('listings/edit.ejs', {listing,originalImage})
}

module.exports.update = async (req,res)=>{
    if(!req.body.listing){
        throw new ExpressError(400, "Send valid data for listing")
    }
    const {id} = req.params;
    let newListing=await Listing.findByIdAndUpdate(id, {...req.body.listing});
    if(typeof req.file!=="undefined"){
        newListing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
    };
    await newListing.save();
    req.flash("success","Listing updated!");
    res.redirect(`/listings/${id}`)
}

module.exports.delete = async (req,res)=>{
    const {id} = req.params;
    const listing = await Listing.findByIdAndDelete(id);
    // console.log(listing);
    req.flash("success","Listing deleted!");
    res.redirect('/listings')
}

// module.exports.checkAvailability = async (req,res)=>{
//     const {id} = req.params;
//     const {checkIn, checkOut} = req.query;

//     const conflictingBooking = await Booking.find({
//         listing : id,
//         status : {$in : ['confirmed','pending']},
//         $or : [
//             {checkIn : {$gte : new Date(checkIn)},
//             checkOut : {$lte : new Date (checkOut)}},
//             {
//                 chekIn : {$lt : new Date(checkIn)},
//                 checkOut : {$lte : new Date (checkOut)}
//             },
//             {
//                 chekIn : {$gte : new Date(checkIn)},
//                 checkOut : {$gt : new Date (checkOut)}
//             },

//         ]
//     });
//     const isAvailable = conflictingBooking.length ==0 ? "available" : "not available";
//     res.json({
//         isAvailable
//     })
// }

module.exports.checkAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(typeof id)
        const { checkIn, checkOut } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                error: 'Invalid listing ID format'
            });
        }
        // Validate input
        if (!checkIn || !checkOut) {
            return res.status(400).json({
                error: 'checkIn and checkOut dates are required'
            });
        }

        const requestedCheckIn = new Date(checkIn);
        const requestedCheckOut = new Date(checkOut);

        // Validate dates
        if (isNaN(requestedCheckIn.getTime()) || isNaN(requestedCheckOut.getTime())) {
            return res.status(400).json({
                error: 'Invalid date format'
            });
        }

        if (requestedCheckIn >= requestedCheckOut) {
            return res.status(400).json({
                error: 'Check-out date must be after check-in date'
            });
        }
        const listingId = new mongoose.Types.ObjectId(id);
        const conflictingBooking = await Booking.find({
            listing: listingId,
            status: { $in: ['confirmed', 'pending'] },
            checkIn: { $lte: requestedCheckOut }, 
            checkOut: { $gte: requestedCheckIn } 
              
        });

        const isAvailable = conflictingBooking.length === 0;
        console.log(typeof listingId)
        console.log("Request:", requestedCheckIn, requestedCheckOut);
        console.log("Conflicts:", conflictingBooking);
        console.log("Requested:", requestedCheckIn.toISOString(), requestedCheckOut.toISOString());

        const list=await Listing.findById(id)
        .populate({
        path:'reviews',
        populate:{
            path: "author",
        }}).populate("owner");
        if (isAvailable) {
      // Store dates in session
      req.session.bookingDates = {
        checkIn,
        checkOut
      };}
        res.render('listings/show.ejs',{
            list,
            availability: isAvailable ? "available" : "not available",
            // conflictingBookings: conflictingBooking.length
        });
        } catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};


module.exports.book = async (req, res) => {
  const {
    checkIn,
    checkOut,
    guestCount,
    specialRequests,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    totalPrice
  } = req.body;

  const { id } = req.params;

  // Step 1: Verify Signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    req.flash("error", "Payment verification failed.");
    return res.redirect("back");
  }

  // Step 2: Save Booking
  await Booking.create({
    listing: req.params.id,
    guest: req.user._id,
    checkIn,
    checkOut,
    totalPrice,
    guestCount,
    specialRequests,
    paymentStatus: "paid",
    status: "confirmed"
  });

  req.flash("success", "Booking confirmed and payment successful!");
  res.redirect(`/listings/${id}`); // adjust this based on your route
};

module.exports.bookingForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing not found.");
    return res.redirect("/listings");
  }

  const { checkIn, checkOut } = req.session.bookingDates || {};

  res.render("listings/book", {
    listing,
    razorpay_key: process.env.RAZORPAY_KEY_ID,
    checkIn: checkIn ? new Date(checkIn) : new Date(),
    checkOut: checkOut ? new Date(checkOut) : new Date(Date.now() + 86400000),
    totalPrice: null
  });
};
