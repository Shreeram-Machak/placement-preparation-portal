const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    testType: {
      type: String,
      enum: ['aptitude', 'coding', 'mock-test'],
      required: true,
    },
    topic: {
      type: String,
      default: '',
      trim: true,
      maxlength: 80,
    },
    codingProblem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodingProblem',
      default: null,
    },
    mockCompany: {
      type: String,
      default: '',
      trim: true,
      maxlength: 60,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 0,
    },
    correctAnswers: {
      type: Number,
      required: true,
      min: 0,
    },
    attemptedQuestions: {
      type: Number,
      required: true,
      min: 0,
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    wrongAnswers: {
      type: Number,
      default: 0,
      min: 0,
    },
    skippedQuestions: {
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
    language: {
      type: String,
      default: '',
      trim: true,
      maxlength: 30,
    },
    timeTaken: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TestResult', testResultSchema);
