if(process.env.NODE_ENV!="production"){
    require("dotenv").config();
}
const express = require('express');
const port = process.env.PORT || 8080;
const mongoose = require('mongoose');
const app=express();
const MONGO_URL=process.env.MONGO_URL;
const path =  require('path');
const methodOverride= require("method-override");
const ejsMate= require('ejs-mate');
const ExpressError = require('./utils/ExpressError.js');
const Review = require("./models/review.js");
const listings =require('./routes/listing.js');
const reviews = require('./routes/review.js');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash =require('connect-flash');
const passport = require('passport');
const localStrategy = require('passport-local');
const User = require("./models/user.js");
const users =require('./routes/user.js');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const paymentRoutes = require("./routes/payment");


const store = MongoStore.create({
  mongoUrl : MONGO_URL,
  crypto : {
    secret : process.env.SECRET,
  },
  touchAfter: 24*3600,
});

store.on("error",()=>{
  console.log("error in mongo session store", err);
})

const sessionOptions = {
    store,
    secret : process.env.SECRET,
    resave : false,
    saveUninitialized : true,
    cookie : {
        expires : Date.now()+ 7*24*60*60*1000,
        maxAge : 7*24*60*60*1000,
        httpOnly : true
    }
}

app.use(session(sessionOptions))
app.use(flash())

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.use('google-login',new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
 callbackURL: process.env.GOOGLE_LOGIN_CALLBACK

},
async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await User.findOne({ googleId: profile.id });
      if (!user) {
        return done(null, false, { message: 'Account not found. Please sign up first.' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
}));

passport.use('google-signup', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_SIGNUP_CALLBACK
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      const existingUser = await User.findOne({ googleId: profile.id });
    if (existingUser) {
      // ❌ Already registered — block this signup
      return done(null, false, { message: "User already exists. Please log in instead." });
    }

    // ✅ Not found — create a new user
    const user = await User.create({
      username: profile.displayName,
      email: profile.emails[0].value,
      googleId: profile.id
    });

    return done(null, user);
    } catch (err) {
      return done(err);
    }
}));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


main().then(()=>{
    console.log('connected to db')
}).catch((err)=>{
    console.log(err)
})

async function main(){
  await mongoose.connect(MONGO_URL)
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(methodOverride('_method'));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next)=>{
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currUser = req.user;
    next()
})

// app.get('/demouser', async(req,res)=>{
//     let fakeUser = new User({
//         email : "student@gmail.com",
//         username : "delta-student"
//     })
//     let registeredUser= await User.register(fakeUser, "helloworld");
//     res.send(registeredUser);
// })
app.use((req, res, next) => {
    // console.log("🧾 Session state:", req.session);
    next();
});

app.use((req, res, next) => {
    console.log('🧭 Incoming request path:', req.path);
    next();
});
app.get('/', (req, res) => {
  res.redirect('/listings');
});

app.use('/listings', listings)

app.use('/listings/:id/reviews',reviews);
app.use('/',users);
app.use("/payment", paymentRoutes);

app.use((req, res, next) => {
    console.log('🧭 Incoming request path:', req.path);
    next();
});




// app.get('/testlisting', async (req,res)=>{
//     let sampleListing = new Listing({
//         title: "new villa",
//         description : 'by the river',
//         price: 1200,
//         location:'vijaywada'
//     });

//     await sampleListing.save()
//     console.log('listing listed succesfully')
// })



app.all('*', (req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});

app.use((err, req, res, next) => {
    // const status = err.statusCode || 500;
    // const message = err.message || 'Something went wrong';
    let {statusCode = 500, message = "something went wrong"} = err;
    res.status(statusCode).render("error.ejs",{err})
    // res.status(statusCode).send(message);
});


app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
