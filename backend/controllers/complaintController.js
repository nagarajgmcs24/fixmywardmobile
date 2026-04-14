const Complaint = require('../models/Complaint');

// Submit a complaint (citizen)
exports.createComplaint = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { ward_id, title, category, description, image_url, location } = req.body;
    if (!ward_id || !title || !category) return res.status(400).json({ message: 'ward_id, title and category required' });
    const complaint = await Complaint.create({ 
      user_id, 
      ward_id, 
      title, 
      category, 
      description, 
      image_url,
      location 
    });
    res.json({ message: 'Complaint submitted', complaint });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get complaints (by ward, by user, or all)
exports.getComplaints = async (req, res) => {
  try {
    const { ward_id, user_id, status } = req.query;
    const filter = {};
    if (ward_id) filter.ward_id = ward_id;
    if (user_id) filter.user_id = user_id;
    if (status) filter.status = status;
    const complaints = await Complaint.find(filter).sort({ created_at: -1 });
    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update complaint status (admin/councillor)
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { complaint_id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status required' });
    const complaint = await Complaint.findByIdAndUpdate(
      complaint_id,
      { status, updated_at: new Date() },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Send notification to user
    const { sendNotification } = require('./notificationController');
    await sendNotification(complaint.user_id, `Your complaint status is now: ${status}`);

    res.json({ message: 'Status updated', complaint });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
