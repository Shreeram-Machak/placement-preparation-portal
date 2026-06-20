const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },
    question: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['quantitative', 'logical', 'verbal', 'technical'],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy',
    },
    questionText: {
      type: String,
      trim: true,
    },
    options: [
      {
        type: String,
        required: true,
      },
    ],
    correctAnswer: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

questionSchema.pre('validate', function validateQuestionText() {
  if (!this.question && !this.questionText) {
    this.invalidate('question', 'Question text is required');
  }
});

module.exports = mongoose.model('Question', questionSchema);
