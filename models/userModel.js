const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // allows multiple null values
      default: null,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true, // allows multiple null values
      default: null,
    },
    // password kept for admin backward compat but not required for normal users
    password: {
      type: String,
      default: null,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      required: true,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

module.exports = User;
