const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ward_id: { type: String, required: true },
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // The councillor assigned
  title: { type: String, required: true },
  category: { type: String, required: true },
  description: String,
  status: { type: String, default: 'pending' }, // pending, in_progress, resolved, rejected
  image_url: String,
  location: {
    latitude: Number,
    longitude: Number
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Complaint', complaintSchema);
