const Application = require('../models/Application');
const Company = require('../models/Company');
const Result = require('../models/Result');

const starterCompanies = [
  {
    name: 'TCS',
    role: 'Ninja / Digital',
    package: '3.36-7 LPA',
    description: 'Technology and consulting company hiring graduates through TCS NQT and role-based assessments.',
    website: 'https://www.tcs.com/careers',
    eligibility: 'Typically 60% or above in academics, no active backlogs, and eligible graduation year as per drive.',
    deadline: null,
    applicationLink: 'https://www.tcs.com/careers',
    location: 'Pan India',
    assessmentPattern: 'Numerical ability, verbal ability, reasoning ability, programming logic, and coding.',
  },
  {
    name: 'Infosys',
    role: 'System Engineer',
    package: '3.6-9.5 LPA',
    description: 'Global IT services company recruiting graduates for engineering and specialist programmer roles.',
    website: 'https://www.infosys.com/careers',
    eligibility: 'Commonly 60% or above in 10th, 12th, and graduation with no active backlogs.',
    deadline: null,
    applicationLink: 'https://www.infosys.com/careers',
    location: 'Pan India',
    assessmentPattern: 'Quantitative aptitude, logical reasoning, verbal ability, pseudocode, and technical interview.',
  },
  {
    name: 'Wipro',
    role: 'Project Engineer',
    package: '3.5 LPA',
    description: 'Technology services company offering graduate hiring programs including Wipro Elite.',
    website: 'https://careers.wipro.com',
    eligibility: 'Usually 60% or above in academics, full-time degree, and no active backlogs at joining.',
    deadline: null,
    applicationLink: 'https://careers.wipro.com',
    location: 'Pan India',
    assessmentPattern: 'Aptitude, written communication, coding, and technical and HR interviews.',
  },
  {
    name: 'Accenture',
    role: 'Associate Software Engineer',
    package: '4.5 LPA',
    description: 'Consulting and technology company recruiting graduates through cognitive and technical assessments.',
    website: 'https://www.accenture.com/in-en/careers',
    eligibility: 'Usually no active backlogs, eligible degree branch, and graduation year matching the hiring drive.',
    deadline: null,
    applicationLink: 'https://www.accenture.com/in-en/careers',
    location: 'Pan India',
    assessmentPattern: 'Cognitive assessment, technical assessment, coding, communication, and interview.',
  },
];

const ensureStarterCompanies = async () => {
  const existingCount = await Company.countDocuments();
  if (existingCount) return;
  await Company.insertMany(starterCompanies);
};

const getReadiness = async (userId) => {
  const results = await Result.find({ userId }).select('correct totalQuestions').lean();
  const correct = results.reduce((sum, result) => sum + (result.correct || 0), 0);
  const total = results.reduce((sum, result) => sum + (result.totalQuestions || 0), 0);
  return total ? Math.round((correct / total) * 100) : 0;
};

const decorateCompanies = async (companies, userId) => {
  const [applications, readiness] = await Promise.all([
    Application.find({ userId }).select('companyId status createdAt').lean(),
    getReadiness(userId),
  ]);
  const applicationMap = new Map(applications.map((item) => [String(item.companyId), item]));

  return companies.map((company) => {
    const application = applicationMap.get(String(company._id));
    const deadlinePassed = company.deadline ? new Date(company.deadline).getTime() < Date.now() : false;
    const eligible = readiness >= 60 && !deadlinePassed;

    return {
      ...company,
      eligibilityStatus: {
        eligible,
        readiness,
        reason: deadlinePassed
          ? 'Deadline has passed.'
          : eligible
            ? 'Your readiness score meets the recommended 60% benchmark.'
            : 'Reach 60% placement readiness to improve eligibility confidence.',
      },
      application: application
        ? { status: application.status, appliedAt: application.createdAt }
        : null,
    };
  });
};

const getCompanies = async (req, res) => {
  try {
    await ensureStarterCompanies();
    const companies = await Company.find().sort({ name: 1 }).lean();
    res.json({ companies: await decorateCompanies(companies, req.user._id) });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load companies.' });
  }
};

const applyToCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).lean();
    if (!company) return res.status(404).json({ message: 'Company not found.' });

    if (company.deadline && new Date(company.deadline).getTime() < Date.now()) {
      return res.status(400).json({ message: 'Application deadline has passed.' });
    }

    const readiness = await getReadiness(req.user._id);
    if (readiness < 60) {
      return res.status(400).json({ message: 'Reach 60% placement readiness before applying.' });
    }

    const application = await Application.findOneAndUpdate(
      { userId: req.user._id, companyId: company._id },
      { $setOnInsert: { status: 'Applied' } },
      { new: true, setDefaultsOnInsert: true, upsert: true },
    ).lean();

    res.status(201).json({
      message: 'Application submitted.',
      application: {
        companyId: application.companyId,
        status: application.status,
        appliedAt: application.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to apply to company.' });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user._id })
      .populate('companyId', 'name role package deadline location')
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      applications: applications.map((item) => ({
        id: item._id,
        status: item.status,
        appliedAt: item.createdAt,
        company: item.companyId,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load applications.' });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const allowedStatuses = ['Applied', 'Shortlisted', 'Rejected'];
    if (!allowedStatuses.includes(req.body.status)) {
      return res.status(400).json({ message: 'Invalid application status.' });
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true },
    ).populate('companyId', 'name role package deadline location').lean();

    if (!application) return res.status(404).json({ message: 'Application not found.' });

    res.json({
      application: {
        id: application._id,
        status: application.status,
        appliedAt: application.createdAt,
        company: application.companyId,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to update application status.' });
  }
};

module.exports = { applyToCompany, getCompanies, getMyApplications, updateApplicationStatus };
