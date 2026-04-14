const mongoose = require('mongoose');

const wardAssignmentSchema = new mongoose.Schema({
  ward_id: { type: String, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  start_date: { type: Date, default: Date.now },
  end_date: { type: Date, default: null }
});

module.exports = mongoose.model('WardAssignment', wardAssignmentSchema);
