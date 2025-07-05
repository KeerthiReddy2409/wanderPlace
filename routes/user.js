const express = require("express");
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync.js');
const ExpressError = require('../utils/ExpressError.js');
const User = require("../models/user.js");
const passport = require("passport");
const {saveRedirectUrl} = require("../middleware.js");
const userController = require("../controllers/users.js");
const {isLoggedIn, isOwner, validateListing, checkBookingDatesAvailable} = require("../middleware.js");
const Listing = require('../models/listing.js');
const Booking = require('../models/booking.js');

router.route("/signup")
.get(userController.renderSignupForm)
.post(wrapAsync(userController.signup))

router.route("/login")
.get(userController.renderLoginForm)
.post(saveRedirectUrl, passport.authenticate("local",{
    failureRedirect : "/login",
    failureFlash: true
}), userController.login)

router.get('/logout',userController.logout)

// Start Google login
router.get('/auth/google/login', 
  passport.authenticate('google-login', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

router.get('/auth/google/login/callback', 
  passport.authenticate('google-login', {
    failureRedirect: '/login',
    failureFlash: true
  }),
  (req, res) => {
    req.flash('success', 'Logged in with Google!');
    res.redirect('/listings');
  }
);

router.get('/auth/google/signup', 
  passport.authenticate('google-signup', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

router.get('/auth/google/signup/callback', 
  passport.authenticate('google-signup', {
    failureRedirect: '/signup',
    failureFlash: true
  }),
  async (req, res) => {
    req.flash('success', 'Signed up with Google!');
    res.redirect('/listings');
  }
);

// Profile page (shows user info)
router.get("/profile", isLoggedIn, async (req, res) => {
  const user = await User.findById(req.user._id).populate("wishlist");
  const listings = await Listing.find({ owner: req.user._id });
  const bookings = await Booking.find({ guest: req.user._id }).populate("listing");

  res.render("users/profile", {
    user,
    listings,
    bookings
  });
});


// My Listings (shows listings owned by user)
router.get("/my-listings", isLoggedIn, async (req, res) => {
  const listings = await Listing.find({ owner: req.user._id });
  res.render("listings/myListings", { listings });
});

router.post('/wishlist/:id', isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);

  const alreadyInWishlist = user.wishlist.some(
    (listingId) => listingId.toString() === id
  );

  if (alreadyInWishlist) {
    user.wishlist = user.wishlist.filter(
      (listingId) => listingId.toString() !== id
    );
  } else {
    user.wishlist.push(id);
  }

  await user.save();
  res.status(200).json({ success: true });
});

module.exports=router;