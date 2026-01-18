import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Download } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { SEO } from '../../components/SEO';

interface Question {
  id: string;
  text: string;
  category: string;
}

const questions: Question[] = [
  { id: 'q1', text: 'Do you have a valid UK passport or right to rent documentation?', category: 'Legal' },
  { id: 'q2', text: 'Do you have proof of income (payslips, bank statements, or employment contract)?', category: 'Income' },
  { id: 'q3', text: 'Do you have references from previous landlords or employers?', category: 'References' },
  { id: 'q4', text: 'Do you have a UK bank account?', category: 'Financial' },
  { id: 'q5', text: 'Do you have a credit check report ready?', category: 'Financial' },
  { id: 'q6', text: 'Do you have proof of address (utility bill, council tax bill)?', category: 'Identity' },
  { id: 'q7', text: 'Do you have a guarantor if required?', category: 'Guarantor' },
  { id: 'q8', text: 'Do you have deposit funds ready (usually 5 weeks rent)?', category: 'Financial' },
];

const ReadinessChecker: React.FC = () => {
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
  const [readinessState, setReadinessState] = useState<string | null>(null);

  const handleAnswer = (questionId: string, answer: boolean) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    
    // Calculate readiness
    const answeredCount = Object.keys(newAnswers).length;
    const yesCount = Object.values(newAnswers).filter(a => a === true).length;
    
    if (answeredCount === questions.length) {
      const percentage = (yesCount / questions.length) * 100;
      if (percentage >= 75) {
        setReadinessState('ready');
      } else if (percentage >= 50) {
        setReadinessState('almost');
      } else {
        setReadinessState('not-ready');
      }
    }
  };

  const answeredCount = Object.keys(answers).length;
  const yesCount = Object.values(answers).filter(a => a === true).length;
  const percentage = answeredCount > 0 ? (yesCount / answeredCount) * 100 : 0;
  const totalPercentage = answeredCount === questions.length ? (yesCount / questions.length) * 100 : 0;

  const downloadChecklist = () => {
    const checklistText = questions.map((q, idx) => {
      const answer = answers[q.id];
      const status = answer === true ? '✓' : answer === false ? '✗' : '○';
      return `${idx + 1}. ${q.text} [${status}]`;
    }).join('\n\n');

    const blob = new Blob([`Rental Readiness Checklist\n\n${checklistText}\n\nCompleted: ${yesCount}/${questions.length}`], {
      type: 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rental-readiness-checklist.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <SEO
        title="Rental Readiness Checker | Proptii"
        description="Assess your readiness for rental applications with our interactive checklist. Check if you have all required documents and information."
        canonical="/tools/readiness-checker"
        keywords={['rental readiness', 'tenant checklist', 'rental application', 'UK rental']}
        category="Rental Tools"
      />
      
      <div className="min-h-screen font-nunito">
        <Navbar />

        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link
            to="/tools"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-8"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Tools
          </Link>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Rental Readiness Checker</h1>
            <p className="text-gray-600 mb-8">
              Answer these questions to assess your readiness for rental applications. Be honest to get the most accurate assessment.
            </p>

            {answeredCount > 0 && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Progress: {answeredCount}/{questions.length}
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {Math.round(percentage)}% Yes
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-4 mb-8">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                        {question.category}
                      </span>
                      <p className="text-lg font-medium text-gray-900">{question.text}</p>
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleAnswer(question.id, true)}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                        answers[question.id] === true
                          ? 'bg-green-600 text-white'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      <CheckCircle2 className="h-5 w-5 inline mr-2" />
                      Yes
                    </button>
                    <button
                      onClick={() => handleAnswer(question.id, false)}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                        answers[question.id] === false
                          ? 'bg-red-600 text-white'
                          : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      <XCircle className="h-5 w-5 inline mr-2" />
                      No
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {readinessState && (
              <div className={`rounded-lg p-6 mb-6 ${
                readinessState === 'ready' ? 'bg-green-50 border-green-200' :
                readinessState === 'almost' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              } border-2`}>
                <h3 className="text-2xl font-bold mb-4">
                  {readinessState === 'ready' ? '✓ You\'re Ready!' :
                   readinessState === 'almost' ? '⚠ Almost There' :
                   '✗ Not Quite Ready'}
                </h3>
                <p className="text-gray-700 mb-4">
                  {readinessState === 'ready' ? 
                    `Great! You have ${yesCount} out of ${questions.length} items ready. You're well-prepared for rental applications.` :
                   readinessState === 'almost' ?
                    `You have ${yesCount} out of ${questions.length} items ready. Focus on the missing items to improve your readiness.` :
                    `You have ${yesCount} out of ${questions.length} items ready. Consider addressing the missing items before applying.`}
                </p>
                <p className="text-sm text-gray-600">
                  Score: {Math.round(totalPercentage)}% ({yesCount}/{questions.length})
                </p>
              </div>
            )}

            {answeredCount === questions.length && (
              <button
                onClick={downloadChecklist}
                className="w-full py-3 px-6 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center justify-center"
              >
                <Download className="h-5 w-5 mr-2" />
                Download Checklist
              </button>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default ReadinessChecker;
