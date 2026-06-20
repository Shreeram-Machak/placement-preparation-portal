const mongoose = require('mongoose');

const mockTestDefinitionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
  durationMinutes: { type: Number, required: true, min: 1, default: 15 },
  questionCount: { type: Number, required: true, min: 1, default: 10 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  subjects: [{ type: String, trim: true }],
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('MockTestDefinition', mockTestDefinitionSchema);
