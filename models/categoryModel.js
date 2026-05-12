const mongoose = require('mongoose');

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    hindiName: {
      type: String,
      required: true,
    },
    image: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
    description: {
      type: String,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
