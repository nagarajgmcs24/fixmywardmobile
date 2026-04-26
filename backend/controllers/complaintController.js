const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const WardAssignment = require('../models/WardAssignment');

// Submit a complaint (citizen)
exports.createComplaint = async (req, res) => {
  try {
    console.log('--- NEW COMPLAINT SUBMISSION ---');
    console.log('Body:', req.body);
    console.log('User:', req.user);

    const user_id = req.user.user_id;
    let { ward_id, title, category, description, location } = req.body;
    
    // Handle location if sent as string (from FormData)
    if (typeof location === 'string') {
      try { location = JSON.parse(location); } catch (e) {
        console.error('Location parse error:', e.message);
      }
    }

    if (!ward_id || !title || !category) {
      console.warn('Validation failed: missing fields');
      return res.status(400).json({ message: 'ward_id, title and category required' });
    }
    
    // 1. Find assigned councillor for this ward
    let assigned_to = null;
    try {
      const assignment = await WardAssignment.findOne({ ward_id: String(ward_id) });
      if (assignment) {
        assigned_to = assignment.user_id;
        console.log(`Auto-assigning complaint to councillor: ${assigned_to}`);
      } else {
        console.log(`No specific councillor assigned to ward ${ward_id} yet.`);
      }
    } catch (assignErr) {
      console.error('Error finding ward assignment:', assignErr.message);
    }

    // 2. Get image URL from multer
    const image_url = req.file ? `http://localhost:3000/uploads/${req.file.filename}` : null;
    console.log('Image URL:', image_url);

    // 3. Create complaint
    const complaint = new Complaint({ 
      user_id: new mongoose.Types.ObjectId(user_id), 
      ward_id: String(ward_id), 
      assigned_to,
      title, 
      category, 
      description, 
      image_url,
      location 
    });

    const savedComplaint = await complaint.save();
    console.log('Complaint saved successfully with ID:', savedComplaint._id);

    // 4. Notify ward members/councillors/admins
    try {
      const { sendNotification } = require('./notificationController');
      // Notify the specific assigned councillor first if they exist
      if (assigned_to) {
        await sendNotification(assigned_to, `New complaint assigned to you: ${title}`, savedComplaint._id);
      }
      
      // Also notify any other ward members
      const wardMembers = await User.find({ 
        ward_id: String(ward_id), 
        role: { $in: ['ward_member', 'admin', 'councillor'] },
        _id: { $ne: assigned_to } // Don't notify the assigned one twice
      });
      
      for (const member of wardMembers) {
        await sendNotification(member._id, `New complaint in your ward: ${title}`, savedComplaint._id);
      }
    } catch (notifyErr) {
      console.error('Notification error (ignoring to finish save):', notifyErr.message);
    }

    res.status(201).json({ message: 'Complaint submitted successfully', complaint: savedComplaint });
  } catch (err) {
    console.error('CRITICAL ERROR in createComplaint:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get complaints (by ward, by user, or all)
exports.getComplaints = async (req, res) => {
  try {
    const { ward_id, user_id, status, id } = req.query;
    const filter = {};
    if (id) {
      try {
        filter._id = new mongoose.Types.ObjectId(id);
      } catch (e) {
        filter._id = id;
      }
    }
    if (ward_id) filter.ward_id = String(ward_id);
    if (user_id) {
      try {
        filter.user_id = new mongoose.Types.ObjectId(user_id);
      } catch (e) {
        filter.user_id = user_id; // Fallback if not a valid ObjectId string
      }
    }
    if (status) filter.status = status;
    
    console.log('Fetching complaints with filter:', filter);
    const complaints = await Complaint.find(filter).sort({ created_at: -1 });
    res.json({ complaints });
  } catch (err) {
    console.error('Error in getComplaints:', err);
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
    try {
      const { sendNotification } = require('./notificationController');
      await sendNotification(
        complaint.user_id, 
        `Status Updated: Your report "${complaint.title}" is now ${status.replace('_', ' ').toUpperCase()}`, 
        complaint._id
      );
    } catch (notifyErr) {
      console.error('Notification error (ignoring to finish status update):', notifyErr.message);
    }

    res.json({ message: 'Status updated', complaint });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete a complaint
exports.deleteComplaint = async (req, res) => {
  try {
    const { complaint_id } = req.params;
    const user_id = req.user.user_id;
    const user_role = req.user.role;

    console.log(`Attempting to delete complaint ${complaint_id} by user ${user_id} (${user_role})`);

    const complaint = await Complaint.findById(complaint_id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Authorization: User who created it, or admin, or councillor
    const isOwner = complaint.user_id.toString() === user_id.toString();
    const isPrivileged = user_role === 'admin' || user_role === 'councillor';

    if (!isOwner && !isPrivileged) {
      console.warn(`Unauthorized delete attempt for complaint ${complaint_id}`);
      return res.status(403).json({ message: 'Not authorized to delete this complaint' });
    }

    await Complaint.findByIdAndDelete(complaint_id);
    console.log(`Complaint ${complaint_id} deleted successfully`);
    res.json({ message: 'Complaint deleted successfully' });
  } catch (err) {
    console.error('Error in deleteComplaint:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
