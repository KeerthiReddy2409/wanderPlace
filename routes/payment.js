// routes/payment.js
const express = require("express");
const router = express.Router();
const razorpay = require("../razorpay.js");

router.post("/create-order", async (req, res) => {
  const { amount } = req.body;

  const options = {
    amount: amount * 100, // in paise
    currency: "INR",
    receipt: `receipt_order_${Date.now()}`
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id });
  } catch (err) {
    console.error("Razorpay Order Error:", err);
    res.status(500).send("Failed to create Razorpay order.");
  }
});

module.exports = router;
