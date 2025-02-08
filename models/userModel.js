import mongoose, { Schema } from "mongoose";
import validator from "validator";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import roles from "../helpers/roles.js";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required."],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email address."],
  },
  phoneNumber: {
    type: String,
    validate: [validator.isMobilePhone, "Please provide a valid phone number."],
  },
  fullName: {
    type: {
      firstName: {
        type: String,
        required: [true, "First name is required."],
      },
      lastName: {
        type: String,
        required: [true, "Last name is required."],
      },
    },
    required: [true, "Full name is required."],
  },
  profilePicture: String,
  role: {
    type: String,
    enum: {
      // edit
      values: [roles.admin, roles.user],
      message: "Role is either: customer, vendor, delivery, admin.",
    },
    default: roles.user,
  },
  emailStatus: {
    type: String,
    enum: {
      values: ["verified", "awaitingVerification"],
      message: "Status is either: verified, awaitingVerification.",
    },
    default: "awaitingVerification",
  },

  // location: {
  //     country: {
  //         type: String,
  //         required: [true, "Country is required."],
  //     },
  //     city: {
  //         type: String,
  //         required: [true, "City is required."],
  //     },
  //     state: {
  //         type: String,
  //         required: [true, "State is required."],
  //     },
  //     street: {
  //         type: String,
  //         required: [true, "Street is required."],
  //     },
  // },
  tempEmail: {
    type: String,
    validate: [
      {
        validator: function (value) {
          return !!value;
        },
        message: "Please provide email to update.",
      },
      {
        validator: function (value) {
          return validator.isEmail(value);
        },
        message: "Please provide a valid email address.",
      },
      {
        validator: function (value) {
          return value !== this.email;
        },
        message: "The new email cannot be the same as the current email.",
      },
      {
        validator: async function (value) {
          const existingEmail = await this.constructor.findOne({
            email: value,
          });
          return !existingEmail;
        },
        message: "The email already exists. Please use a different email.",
      },
    ],
    select: false,
  },
  verificationCode: {
    type: String,
    select: false,
  },
  verificationCodeExpires: {
    type: Date,
    select: false,
  },
  password: {
    type: String,
    required: [true, "Password is required."],
    minlength: [8, "Password must be at least 8 characters."],
    select: false,
  },
  passwordChangedAt: {
    type: Date,
    select: false,
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// METHODS

userSchema.methods.correctPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

    return JWTTimestamp < changedTimestamp;
  }

  // FALSE means NOT changed.
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetCode = Math.floor(1000 + Math.random() * 9000);

  this.passwordResetToken = crypto.createHash("sha256").update(resetCode).digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetCode;
};

userSchema.methods.createVerificationCode = function () {
  const verificationCode = Math.floor(1000 + Math.random() * 9000);

  this.verificationCode = crypto
    .createHash("sha256")
    .update(verificationCode)
    .digest("hex");
  this.verificationCodeExpires = Date.now() + 10 * 60 * 1000;

  return verificationCode;
};

const User = mongoose.model("User", userSchema);

export default User;
