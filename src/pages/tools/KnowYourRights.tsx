import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, XCircle } from 'lucide-react';
import Footer from '../../components/Footer';
import { SEO } from '../../components/SEO';

interface Right {
  id: string;
  title: string;
  description: string;
  details: string[];
}

interface QuizQuestion {
  statement: string;
  correctAnswer: boolean;
  sectionId: string;
  sectionTitle: string;
  explanation?: string;
}

const rights: Right[] = [
  {
    id: 'deposit',
    title: 'Deposit Protection',
    description: 'Your deposit must be protected in a government-approved scheme',
    details: [
      'Landlord must protect your deposit within 30 days',
      'You must receive deposit protection information',
      'Deposit must be returned within 10 days of tenancy ending (minus deductions)',
      'You can dispute unfair deductions',
    ],
  },
  {
    id: 'repairs',
    title: 'Repairs & Maintenance',
    description: 'Landlord is responsible for most repairs and property maintenance',
    details: [
      'Landlord must keep property in good repair',
      'Landlord must ensure gas, electricity, and water are safe',
      'Landlord must provide Energy Performance Certificate (EPC)',
      'You must report issues promptly',
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy & Quiet Enjoyment',
    description: 'You have the right to live in your home without unnecessary interference',
    details: [
      'Landlord must give 24 hours notice before visiting (except emergencies)',
      'You have right to quiet enjoyment of the property',
      'Landlord cannot enter without permission',
      'You can refuse entry if proper notice not given',
    ],
  },
  {
    id: 'eviction',
    title: 'Eviction Protection',
    description: 'Landlord must follow proper legal procedures to evict you',
    details: [
      'Landlord must give proper notice (usually 2 months)',
      'Landlord must obtain court order for eviction',
      'Bailiffs must be used for eviction (not landlord)',
      'You have right to challenge eviction in court',
    ],
  },
  {
    id: 'discrimination',
    title: 'Protection from Discrimination',
    description: 'You are protected from discrimination based on protected characteristics',
    details: [
      'Protected characteristics include: age, disability, gender, race, religion, sexual orientation',
      'Landlord cannot refuse tenancy based on protected characteristics',
      'You can report discrimination to Equality and Human Rights Commission',
      'You may be entitled to compensation',
    ],
  },
];

// Generate true/false quiz questions from rights details
const quizQuestions: QuizQuestion[] = [
  // Deposit Protection questions
  { statement: 'Your landlord must protect your deposit within 30 days of receiving it.', correctAnswer: true, sectionId: 'deposit', sectionTitle: 'Deposit Protection' },
  { statement: 'You can only dispute deposit deductions after moving out.', correctAnswer: false, sectionId: 'deposit', sectionTitle: 'Deposit Protection', explanation: 'You can dispute unfair deductions at any time during or after your tenancy.' },
  { statement: 'Deposits must be returned within 10 days of tenancy ending (minus deductions).', correctAnswer: true, sectionId: 'deposit', sectionTitle: 'Deposit Protection' },
  { statement: 'Landlords are not required to provide deposit protection information.', correctAnswer: false, sectionId: 'deposit', sectionTitle: 'Deposit Protection', explanation: 'Landlords must provide you with deposit protection information within 30 days.' },
  
  // Repairs & Maintenance questions
  { statement: 'Landlords must keep the property in good repair.', correctAnswer: true, sectionId: 'repairs', sectionTitle: 'Repairs & Maintenance' },
  { statement: 'Tenants are responsible for all property repairs.', correctAnswer: false, sectionId: 'repairs', sectionTitle: 'Repairs & Maintenance', explanation: 'Landlords are responsible for most repairs, including structural issues and safety of gas, electricity, and water.' },
  { statement: 'Landlords must provide an Energy Performance Certificate (EPC).', correctAnswer: true, sectionId: 'repairs', sectionTitle: 'Repairs & Maintenance' },
  { statement: 'You must report repair issues promptly to your landlord.', correctAnswer: true, sectionId: 'repairs', sectionTitle: 'Repairs & Maintenance' },
  
  // Privacy & Quiet Enjoyment questions
  { statement: 'Landlords must give 24 hours notice before visiting (except emergencies).', correctAnswer: true, sectionId: 'privacy', sectionTitle: 'Privacy & Quiet Enjoyment' },
  { statement: 'Your landlord can enter your property at any time without permission.', correctAnswer: false, sectionId: 'privacy', sectionTitle: 'Privacy & Quiet Enjoyment', explanation: 'Landlords must give proper notice and cannot enter without permission, except in emergencies.' },
  { statement: 'You have the right to quiet enjoyment of the property.', correctAnswer: true, sectionId: 'privacy', sectionTitle: 'Privacy & Quiet Enjoyment' },
  { statement: 'You can refuse entry if proper notice is not given.', correctAnswer: true, sectionId: 'privacy', sectionTitle: 'Privacy & Quiet Enjoyment' },
  
  // Eviction Protection questions
  { statement: 'Landlords must give proper notice (usually 2 months) before eviction.', correctAnswer: true, sectionId: 'eviction', sectionTitle: 'Eviction Protection' },
  { statement: 'Landlords can evict you themselves without a court order.', correctAnswer: false, sectionId: 'eviction', sectionTitle: 'Eviction Protection', explanation: 'Landlords must obtain a court order and use bailiffs for eviction - they cannot evict you themselves.' },
  { statement: 'You have the right to challenge eviction in court.', correctAnswer: true, sectionId: 'eviction', sectionTitle: 'Eviction Protection' },
  { statement: 'Bailiffs must be used for eviction, not the landlord.', correctAnswer: true, sectionId: 'eviction', sectionTitle: 'Eviction Protection' },
  
  // Protection from Discrimination questions
  { statement: 'Landlords cannot refuse tenancy based on protected characteristics.', correctAnswer: true, sectionId: 'discrimination', sectionTitle: 'Protection from Discrimination' },
  { statement: 'Protected characteristics include age, disability, gender, race, religion, and sexual orientation.', correctAnswer: true, sectionId: 'discrimination', sectionTitle: 'Protection from Discrimination' },
  { statement: 'You can report discrimination to the Equality and Human Rights Commission.', correctAnswer: true, sectionId: 'discrimination', sectionTitle: 'Protection from Discrimination' },
  { statement: 'You may be entitled to compensation if discriminated against.', correctAnswer: true, sectionId: 'discrimination', sectionTitle: 'Protection from Discrimination' },
];

const KnowYourRights: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(rights[0]?.id ?? null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, boolean | null>>({});
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [showReviewDetails, setShowReviewDetails] = useState(false);

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const toggleCheck = (rightId: string, detailIndex: number) => {
    const key = `${rightId}-${detailIndex}`;
    setChecked({ ...checked, [key]: !checked[key] });
  };

  const totalDetails = rights.reduce((sum, right) => sum + right.details.length, 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const percentage = totalDetails > 0 ? (checkedCount / totalDetails) * 100 : 0;

  const activeRight = rights.find((right) => right.id === expandedSection) ?? rights[0];
  const currentQuestion = quizQuestions[currentQuestionIndex];
  const isQuizComplete = currentQuestionIndex >= quizQuestions.length;
  const finalScore = quizScore;
  const finalPercentage = quizQuestions.length > 0 ? Math.round((finalScore / quizQuestions.length) * 100) : 0;
  const wrongQuestions = quizQuestions
    .map((q, index) => ({
      index,
      question: q,
      userAnswer: quizAnswers[index],
      isCorrect: quizAnswers[index] === q.correctAnswer,
    }))
    .filter(
      (entry) =>
        entry.userAnswer !== undefined &&
        entry.userAnswer !== null &&
        !entry.isCorrect
    );

  const startQuiz = () => {
    setIsQuizMode(true);
    setCurrentQuestionIndex(0);
    setQuizScore(0);
    setQuizAnswers({});
    setShowQuizResult(false);
    setShowReviewDetails(false);
  };

  const handleQuizAnswer = (answer: boolean) => {
    if (!isQuizMode || isQuizComplete) return;
    
    const question = quizQuestions[currentQuestionIndex];
    const isCorrect = answer === question.correctAnswer;
    
    // Save the answer
    setQuizAnswers({ ...quizAnswers, [currentQuestionIndex]: answer });
    
    // Update score if correct
    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
    }
    
    // Move to next question or complete quiz
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
      }, 500); // Small delay to show feedback
    } else {
      // Quiz complete
      setTimeout(() => {
        setShowQuizResult(true);
      }, 500);
    }
  };

  const resetQuiz = () => {
    setIsQuizMode(false);
    setCurrentQuestionIndex(0);
    setQuizScore(0);
    setQuizAnswers({});
    setShowQuizResult(false);
    setShowReviewDetails(false);
  };

  return (
    <>
      <SEO
        title="UK Tenant Rights Guide | Know Your Rental Rights & Responsibilities | Proptii"
        description="Comprehensive interactive guide to UK tenant rights and responsibilities. Learn about deposit protection schemes, landlord repair obligations, privacy rights, eviction protection, and discrimination laws. Based on official UK government guidance."
        canonical="/tools/know-your-rights"
        keywords={[
          'UK tenant rights',
          'tenant rights UK',
          'rental rights',
          'tenant protection UK',
          'landlord tenant rights',
          'UK housing rights',
          'tenant responsibilities',
          'deposit protection rights',
          'eviction protection UK',
          'tenant privacy rights',
          'discrimination protection tenant',
          'repair rights tenant'
        ]}
        relatedTerms={[
          'tenant legal rights',
          'UK housing law',
          'rental agreement rights',
          'tenant obligations',
          'UK tenancy rights'
        ]}
        category="Rental Tools"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: rights.map((right) => ({
            '@type': 'Question',
            name: right.title,
            acceptedAnswer: {
              '@type': 'Answer',
              text: right.description + ' ' + right.details.join(' '),
            },
          })),
        }}
      />
      
      <div className="min-h-screen font-nunito bg-[#F5F5FA]">
        <div className="max-w-5xl mx-auto px-4 pt-12 pb-16">
          <Link
            to="/tools"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-8"
            style={{ fontFamily: 'Archivo, sans-serif' }}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Tools
          </Link>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10 mb-10">
            <h1 
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center" 
              style={{ fontFamily: 'Archivo, sans-serif' }}
            >
              Know Your Rights
            </h1>
            <p 
              className="text-gray-600 mb-8 text-center max-w-2xl mx-auto" 
              style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}
            >
              Interactive guide to UK tenant rights and responsibilities. Check off items as you learn about them.
            </p>

            {/* Understanding Your Rights intro container intentionally hidden */}

            {/* Progress Section */}
            <div className="mb-8 bg-gray-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Learning Progress</h3>
                <span className="text-2xl font-bold text-indigo-600">{Math.round(percentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-indigo-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {checkedCount} of {totalDetails} rights reviewed
              </p>
            </div>

            {/* Show learning view or quiz view */}
            {!isQuizMode ? (
              <>
                {/* Rights Layout - sidebar + active right details */}
                <div className="grid md:grid-cols-[260px,minmax(0,1fr)] gap-8 items-start">
                  {/* Left sidebar - list of rights */}
                  <div>
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 space-y-2">
                      {rights.map((right) => {
                        const isActive = activeRight.id === right.id;

                        // Compute how many items in this right are checked
                        const rightTotal = right.details.length;
                        const rightChecked = right.details.filter((_, idx) => checked[`${right.id}-${idx}`]).length;
                        const rightComplete = rightChecked === rightTotal;

                        return (
                          <button
                            key={right.id}
                            type="button"
                            onClick={() => toggleSection(right.id)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                              isActive
                                ? 'bg-[#E6F3FF] border-2 border-[#136C9E] shadow-sm'
                                : rightComplete
                                ? 'bg-green-50 border border-green-200 hover:bg-green-100'
                                : 'bg-white border border-gray-200 hover:bg-gray-50'
                            }`}
                            style={{ fontFamily: 'Archivo, sans-serif' }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  isActive
                                    ? 'bg-[#136C9E] text-white'
                                    : rightComplete
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-300 text-gray-600'
                                }`}
                              >
                                {rightComplete ? '✓' : right.title.charAt(0)}
                              </div>
                              <span
                                className={`text-sm font-medium ${
                                  isActive
                                    ? 'text-[#136C9E]'
                                    : rightComplete
                                    ? 'text-green-700'
                                    : 'text-gray-800'
                                }`}
                              >
                                {right.title}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {rightChecked}/{rightTotal}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right panel - active right details */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                    <h2
                      className="text-2xl font-bold text-gray-900 mb-2"
                      style={{ fontFamily: 'Archivo, sans-serif', color: '#136C9E' }}
                    >
                      {activeRight.title}
                    </h2>
                    <p
                      className="text-gray-700 mb-6"
                      style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}
                    >
                      {activeRight.description}
                    </p>

                    <h3
                      className="text-lg font-semibold text-gray-900 mb-4"
                      style={{ fontFamily: 'Archivo, sans-serif' }}
                    >
                      Key points:
                    </h3>

                    <ul className="space-y-3">
                      {activeRight.details.map((detail, idx) => {
                        const key = `${activeRight.id}-${idx}`;
                        const isChecked = checked[key] || false;
                        return (
                          <li key={idx} className="flex items-start">
                            <button
                              onClick={() => toggleCheck(activeRight.id, idx)}
                              className="mt-1 mr-3 flex-shrink-0"
                            >
                              {isChecked ? (
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                              ) : (
                                <Circle className="h-6 w-6 text-gray-400" />
                              )}
                            </button>
                            <span
                              className={`flex-1 text-sm md:text-base ${
                                isChecked ? 'line-through text-gray-500' : 'text-gray-700'
                              }`}
                              style={{ fontFamily: 'Archivo, sans-serif' }}
                            >
                              {detail}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                {/* Quiz CTA - beneath the container, aligned right */}
                <div className="mt-8 flex justify-end pr-2">
                  <button
                    type="button"
                    onClick={startQuiz}
                    className="px-10 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[#DC5F12] to-[#DC5F12]/80 hover:from-[#DC5F12]/90 hover:to-[#DC5F12]/70 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    style={{ 
                      fontFamily: 'Archivo, sans-serif',
                      boxShadow: '0 4px 14px 0 rgba(220, 95, 18, 0.39)'
                    }}
                  >
                    Take Quiz
                  </button>
                </div>
              </>
            ) : (
              /* Quiz View - replaces learning components */
              <div className="bg-[#F7F8FB] rounded-3xl p-6 md:p-10">
                {showQuizResult ? (
                  /* Quiz Results */
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                    <h2
                      className="text-3xl font-bold text-gray-900 mb-4"
                      style={{ fontFamily: 'Archivo, sans-serif' }}
                    >
                      Quiz Complete!
                    </h2>
                    <div className="mb-6">
                      <div className="text-6xl font-bold mb-2" style={{ color: finalPercentage >= 70 ? '#22c55e' : finalPercentage >= 50 ? '#eab308' : '#ef4444' }}>
                        {finalPercentage}%
                      </div>
                      <p className="text-lg text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>
                        You scored {finalScore} out of {quizQuestions.length}
                      </p>
                    </div>
                    <div className="mt-8 flex flex-col gap-4 items-center">
                      {/* Review button */}
                      {wrongQuestions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowReviewDetails((prev) => !prev)}
                          className="px-8 py-3 rounded-full font-semibold border-2 border-[#136C9E] text-[#136C9E] hover:bg-[#E6F3FF] transition-all duration-300"
                          style={{ fontFamily: 'Archivo, sans-serif' }}
                        >
                          {showReviewDetails ? 'Hide Review' : 'Review Answers'}
                        </button>
                      )}

                      <div className="flex gap-4 justify-center">
                      <button
                        type="button"
                        onClick={resetQuiz}
                        className="px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[#DC5F12] to-[#DC5F12]/80 hover:from-[#DC5F12]/90 hover:to-[#DC5F12]/70 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                        style={{ fontFamily: 'Archivo, sans-serif' }}
                      >
                        Retake Quiz
                      </button>
                      <button
                        type="button"
                        onClick={resetQuiz}
                        className="px-8 py-3 rounded-full font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300"
                        style={{ fontFamily: 'Archivo, sans-serif' }}
                      >
                        Back to Learning
                      </button>
                      </div>
                    </div>

                    {showReviewDetails && wrongQuestions.length > 0 && (
                      <div className="mt-8 text-left">
                        <h3
                          className="text-lg font-semibold text-gray-900 mb-4"
                          style={{ fontFamily: 'Archivo, sans-serif' }}
                        >
                          Review your answers
                        </h3>
                        <ul className="space-y-4">
                          {wrongQuestions.map(({ index, question, userAnswer }) => (
                            <li
                              key={index}
                              className="bg-[#F7F8FB] border border-gray-200 rounded-xl p-4"
                            >
                              <p
                                className="text-sm font-medium text-gray-900 mb-1"
                                style={{ fontFamily: 'Archivo, sans-serif' }}
                              >
                                Question {index + 1}:
                              </p>
                              <p
                                className="text-sm text-gray-800 mb-2"
                                style={{ fontFamily: 'Archivo, sans-serif' }}
                              >
                                {question.statement}
                              </p>
                              <p
                                className="text-sm text-gray-700"
                                style={{ fontFamily: 'Archivo, sans-serif' }}
                              >
                                <span className="font-semibold">Your answer:</span>{' '}
                                {userAnswer ? 'True' : 'False'}
                              </p>
                              <p
                                className="text-sm text-gray-700"
                                style={{ fontFamily: 'Archivo, sans-serif' }}
                              >
                                <span className="font-semibold">Correct answer:</span>{' '}
                                {question.correctAnswer ? 'True' : 'False'}
                              </p>
                              <p
                                className="text-sm text-gray-700"
                                style={{ fontFamily: 'Archivo, sans-serif' }}
                              >
                                <span className="font-semibold">Learn more in:</span>{' '}
                                {question.sectionTitle}
                              </p>
                              {question.explanation && (
                                <p
                                  className="mt-2 text-xs text-gray-500"
                                  style={{ fontFamily: 'Archivo, sans-serif' }}
                                >
                                  {question.explanation}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : currentQuestion ? (
                  /* Active Quiz Question */
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                    <p
                      className="text-sm text-gray-500 mb-2"
                      style={{ fontFamily: 'Archivo, sans-serif' }}
                    >
                      Question {currentQuestionIndex + 1} of {quizQuestions.length}
                    </p>
                    <h2
                      className="text-2xl font-bold text-gray-900 mb-6"
                      style={{ fontFamily: 'Archivo, sans-serif', color: '#136C9E' }}
                    >
                      {currentQuestion.statement}
                    </h2>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-2xl mx-auto">
                      {/* True Button */}
                      <button
                        type="button"
                        onClick={() => handleQuizAnswer(true)}
                        disabled={quizAnswers[currentQuestionIndex] !== undefined && quizAnswers[currentQuestionIndex] !== null}
                        className={`flex-1 max-w-xs rounded-2xl border-2 shadow-sm transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${
                          quizAnswers[currentQuestionIndex] === true
                            ? 'border-emerald-400 shadow-lg bg-white scale-105'
                            : 'border-gray-200 bg-white hover:border-emerald-300'
                        } ${quizAnswers[currentQuestionIndex] !== undefined && quizAnswers[currentQuestionIndex] !== true ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div
                          className={`h-12 w-full rounded-t-2xl transition-colors ${
                            quizAnswers[currentQuestionIndex] === true ? 'bg-emerald-100' : 'bg-emerald-50'
                          }`}
                        />
                        <div className="px-8 py-6 flex flex-col items-center justify-center -mt-6">
                          <CheckCircle2
                            className={`h-8 w-8 transition-colors ${
                              quizAnswers[currentQuestionIndex] === true
                                ? 'text-emerald-500'
                                : 'text-emerald-400'
                            }`}
                          />
                          <span
                            className="mt-3 text-lg font-semibold text-gray-900"
                            style={{ fontFamily: 'Archivo, sans-serif' }}
                          >
                            True
                          </span>
                        </div>
                      </button>

                      {/* False Button */}
                      <button
                        type="button"
                        onClick={() => handleQuizAnswer(false)}
                        disabled={quizAnswers[currentQuestionIndex] !== undefined && quizAnswers[currentQuestionIndex] !== null}
                        className={`flex-1 max-w-xs rounded-2xl border-2 shadow-sm transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${
                          quizAnswers[currentQuestionIndex] === false
                            ? 'border-rose-400 shadow-lg bg-white scale-105'
                            : 'border-gray-200 bg-white hover:border-rose-300'
                        } ${quizAnswers[currentQuestionIndex] !== undefined && quizAnswers[currentQuestionIndex] !== false ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div
                          className={`h-12 w-full rounded-t-2xl transition-colors ${
                            quizAnswers[currentQuestionIndex] === false ? 'bg-rose-100' : 'bg-rose-50'
                          }`}
                        />
                        <div className="px-8 py-6 flex flex-col items-center justify-center -mt-6">
                          <XCircle
                            className={`h-8 w-8 transition-colors ${
                              quizAnswers[currentQuestionIndex] === false ? 'text-rose-500' : 'text-rose-400'
                            }`}
                          />
                          <span
                            className="mt-3 text-lg font-semibold text-gray-900"
                            style={{ fontFamily: 'Archivo, sans-serif' }}
                          >
                            False
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* Progress indicator */}
                    <div className="mt-8">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>
                          Progress
                        </span>
                        <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Archivo, sans-serif' }}>
                          {quizScore} / {currentQuestionIndex + 1}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#DC5F12] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Legal Help?</h3>
              <p className="text-blue-800 text-sm">
                This guide provides general information. For specific legal advice, consult a qualified solicitor or contact Citizens Advice.
              </p>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default KnowYourRights;