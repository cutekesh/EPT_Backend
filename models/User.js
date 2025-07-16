const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    // store emails in lowercase & ensure uniqueness
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please enter a valid email",
      ],
    },

    // optional because Google users won’t have a local password
    password: {
      type: String,
      minlength: 6,
      select: false, // omit from query results unless explicitly selected
    },

    isGoogleUser: { type: Boolean, default: false }, // new field for Google sign-in users

    // password‑reset support
    resetToken: String,
    resetTokenExpire: Date,
  },
  { timestamps: true }
);

/* -------------------------------------------------------------------------
  Middleware
---------------------------------------------------------------------------*/

// Hash password only if it exists & was modified
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Ensure email is stored lowercase on every save (redundant safeguard)
UserSchema.pre("save", function (next) {
  if (this.isModified("email") && this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

/* -------------------------------------------------------------------------
  Instance methods
---------------------------------------------------------------------------*/

UserSchema.methods.comparePassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

/* -------------------------------------------------------------------------
  Indexes
---------------------------------------------------------------------------*/
// Optional TTL index for reset tokens (clears docs’ fields automatically)
// mongoose does not support partial index TTL on subfields easily, so
// we create a normal index for fast lookup; you may create TTL in Mongo shell.
UserSchema.index({ resetToken: 1 });

/* -------------------------------------------------------------------------
  Clean output: remove sensitive fields when converting to JSON
---------------------------------------------------------------------------*/
UserSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.resetToken;
    delete ret.resetTokenExpire;
    return ret;
  },
});

module.exports = mongoose.model("User", UserSchema);
