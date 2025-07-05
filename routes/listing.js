const express = require("express");
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync.js');
const Listing = require('../models/listing.js');
const {isLoggedIn, isOwner, validateListing, checkBookingDatesAvailable} = require("../middleware.js");
const listingController = require('../controllers/listings.js');
const multer  = require('multer');
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage })

router.route('/')
.get(wrapAsync(listingController.index))
.post(isLoggedIn,upload.single('listing[image]'),validateListing, wrapAsync(listingController.create));

router.get('/new',isLoggedIn,listingController.new)

router.route("/:id")
.get(wrapAsync(listingController.show))
.put(isLoggedIn,isOwner,upload.single('listing[image]'),validateListing, wrapAsync(listingController.update ))
.delete(isLoggedIn,isOwner, wrapAsync(listingController.delete))

router.get('/:id/edit',isLoggedIn,isOwner, wrapAsync(listingController.edit))

router.post('/:id/checkAvailability',isLoggedIn,wrapAsync(listingController.checkAvailability))

router.route('/:id/book')
.get(isLoggedIn,checkBookingDatesAvailable,wrapAsync(listingController.bookingForm))
.post(isLoggedIn, wrapAsync(listingController.book));

module.exports = router;