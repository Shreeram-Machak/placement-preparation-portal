const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['aptitude', 'mock-test', 'coding'],
      required: true,
      index: true,
    },
    topic: {
      type: String,
      default: '',
      trim: true,
      maxlength: 100,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodingProblem',
      default: null,
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    correct: {
      type: Number,
      default: 0,
      min: 0,
    },
    wrong: {
      type: Number,
      default: 0,
      min: 0,
    },
    skipped: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      default: '',
      trim: true,
      maxlength: 40,
    },
    passedTests: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalTests: {
      type: Number,
      default: 0,
      min: 0,
    },
    language: {
      type: String,
      default: '',
      trim: true,
      maxlength: 30,
    },
    timeTaken: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Result', resultSchema);
