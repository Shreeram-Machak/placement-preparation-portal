const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  role: { type: String, default: '', trim: true },
  package: { type: String, default: '', trim: true },
  description: { type: String, default: '', trim: true },
  website: { type: String, default: '', trim: true },
  eligibility: { type: String, default: '', trim: true },
  deadline: { type: Date, default: null },
  applicationLink: { type: String, default: '', trim: true },
  location: { type: String, default: '', trim: true },
  assessmentPattern: { type: String, default: '', trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
