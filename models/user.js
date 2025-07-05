const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // allows null values
  },
  username: {
    type: String
  },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }]
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

module.exports = User;
