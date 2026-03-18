import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Download } from 'lucide-react';
import Footer from '../../components/Footer';
import { SEO } from '../../components/SEO';
import jsPDF from 'jspdf';

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
  { id: 'q8', text: 'Do you have deposit funds ready (usually 5 weeks rent)?', category: 'Financial' },
  { id: 'q6', text: 'Do you have proof of address (utility bill, council tax bill)?', category: 'Identity' },
  { id: 'q7', text: 'Do you have a guarantor if required?', category: 'Guarantor' },
];

const ReadinessChecker: React.FC = () => {
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
  const [readinessState, setReadinessState] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

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

  const categories = Array.from(new Set(questions.map((q) => q.category)));
  const currentQuestion = questions[currentQuestionIndex];
  const currentCategoryQuestions = questions.filter(
    (q) => q.category === currentQuestion.category
  );
  const currentCategoryIndex =
    currentCategoryQuestions.findIndex((q) => q.id === currentQuestion.id) + 1;
  const currentCategoryTotal = currentCategoryQuestions.length;
  const currentAnswer = answers[currentQuestion.id];

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleCategoryClick = (category: string) => {
    // Find the first unanswered question in this category, or the first question if all are answered
    const categoryQuestions = questions.filter((q) => q.category === category);
    const firstUnanswered = categoryQuestions.find((q) => answers[q.id] === undefined || answers[q.id] === null);
    const targetIndex = firstUnanswered 
      ? questions.findIndex((q) => q.id === firstUnanswered.id)
      : questions.findIndex((q) => q.category === category);
    
    if (targetIndex !== -1) {
      setCurrentQuestionIndex(targetIndex);
    }
  };

  // Check if a category is complete (all questions answered)
  const isCategoryComplete = (category: string) => {
    const categoryQuestions = questions.filter((q) => q.category === category);
    return categoryQuestions.every((q) => answers[q.id] !== undefined && answers[q.id] !== null);
  };

  const downloadChecklist = () => {
    const doc = new jsPDF();
    let yPos = 30;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 25;
    const maxWidth = pageWidth - (margin * 2);
    const lineHeight = 7;
    const minSpaceForContent = 35; // Minimum space needed to avoid orphans

    // Helper function to check if we need a new page
    const checkPageBreak = (requiredSpace: number) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPos = 30;
        return true;
      }
      return false;
    };

    // Helper function to add text with orphan prevention
    const addText = (text: string, fontSize: number, isBold: boolean = false, color: number[] = [0, 0, 0], spacing: number = 5) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setTextColor(color[0], color[1], color[2]);
      
      const splitText = doc.splitTextToSize(text, maxWidth);
      const textHeight = splitText.length * lineHeight;
      
      // Check if we need a new page (with buffer to prevent orphans)
      if (yPos + textHeight + minSpaceForContent > pageHeight - margin) {
        doc.addPage();
        yPos = 30;
      }
      
      doc.text(splitText, margin, yPos);
      yPos += textHeight + spacing;
    };

    // Helper function to draw a horizontal line
    const drawLine = () => {
      if (yPos + 5 > pageHeight - margin) {
        doc.addPage();
        yPos = 30;
      }
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;
    };

    // Title Section with background
    doc.setFillColor(37, 73, 87); // #374957
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Rental Readiness Checklist', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text('Proptii - UK Rental Application Tools', pageWidth / 2, 38, { align: 'center' });
    
    yPos = 60;

    // Summary Box
    const summaryBoxHeight = 45;
    checkPageBreak(summaryBoxHeight);
    
    // Draw summary box background
    const statusColor = readinessState === 'ready' 
      ? [34, 197, 94] // green
      : readinessState === 'almost'
      ? [234, 179, 8] // yellow
      : [239, 68, 68]; // red
    
    // Use lighter version of status color for background
    const bgColor = [
      Math.min(255, statusColor[0] + 230),
      Math.min(255, statusColor[1] + 230),
      Math.min(255, statusColor[2] + 230)
    ];
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.roundedRect(margin, yPos, maxWidth, summaryBoxHeight, 3, 3, 'F');
    
    // Draw border
    doc.setDrawColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setLineWidth(1);
    doc.roundedRect(margin, yPos, maxWidth, summaryBoxHeight, 3, 3, 'S');
    
    // Summary content
    yPos += 8;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Assessment Summary', margin + 5, yPos);
    yPos += 8;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin + 5, yPos);
    yPos += 6;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`Score: ${Math.round(totalPercentage)}%`, margin + 5, yPos);
    yPos += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(`(${yesCount} out of ${questions.length} items completed)`, margin + 5, yPos);
    yPos += 6;
    
    // Status
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    const statusText = readinessState === 'ready' 
      ? '[YES] Status: You\'re Ready!'
      : readinessState === 'almost'
      ? '[WARNING] Status: Almost There'
      : '[NO] Status: Not Quite Ready';
    doc.text(statusText, margin + 5, yPos);
    
    yPos = 60 + summaryBoxHeight + 15;

    // Section header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Detailed Checklist', margin, yPos);
    yPos += 10;
    
    drawLine();

    // Questions
    questions.forEach((q, idx) => {
      const answer = answers[q.id];
      const status = answer === true ? '[YES]' : answer === false ? '[NO]' : '[NOT ANSWERED]';
      const statusText = answer === true ? 'Yes' : answer === false ? 'No' : 'Not Answered';
      const statusColor = answer === true 
        ? [34, 197, 94] // green
        : answer === false
        ? [239, 68, 68] // red
        : [156, 163, 175]; // gray

      // Estimate space needed for this question (category + question + answer + spacing)
      const estimatedSpace = 30;
      
      // Check page break before starting a new question
      if (checkPageBreak(estimatedSpace)) {
        // Redraw section header if on new page
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Detailed Checklist (continued)', margin, yPos);
        yPos += 10;
        drawLine();
      }

      // Question container background
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, yPos - 3, maxWidth, 25, 2, 2, 'F');
      
      // Category badge
      doc.setFillColor(100, 100, 100);
      doc.roundedRect(margin + 3, yPos, 50, 6, 1, 1, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(q.category.toUpperCase(), margin + 6, yPos + 4.5);
      
      // Question number and text
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      const questionText = `${idx + 1}. ${q.text}`;
      const splitQuestion = doc.splitTextToSize(questionText, maxWidth - 10);
      doc.text(splitQuestion, margin + 5, yPos);
      yPos += splitQuestion.length * lineHeight + 3;
      
      // Answer status with colored indicator
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(`${status}`, margin + 5, yPos);
      
      yPos += 8; // Spacing before next question
    });

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${totalPages} | Generated by Proptii`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    doc.save('rental-readiness-checklist.pdf');
  };

  return (
    <>
      <SEO
        title="Free Rental Readiness Checker | UK Tenant Application Checklist | Proptii"
        description="Free interactive rental readiness checker for UK tenants. Assess if you're prepared for rental applications with our comprehensive checklist covering documents, references, income, and legal requirements. Get instant feedback and download your personalized checklist."
        canonical="/tools/readiness-checker"
        keywords={[
          'rental readiness checker',
          'tenant application checklist',
          'UK rental readiness',
          'rental application preparation',
          'tenant document checklist',
          'rental application requirements',
          'UK tenant checklist',
          'rental readiness assessment',
          'property rental preparation',
          'tenant application readiness'
        ]}
        relatedTerms={[
          'renting in UK',
          'tenant application',
          'rental documents',
          'property rental',
          'UK housing application'
        ]}
        category="Rental Tools"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Rental Readiness Checker',
          description: 'Interactive tool to assess your readiness for UK rental applications',
          applicationCategory: 'RealEstateApplication',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'GBP'
          }
        }}
      />
      
      <div className="min-h-screen font-nunito bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 pt-12 pb-16">
          <Link
            to="/tools"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-8"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Tools
          </Link>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10 mb-10">
            <h1
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 text-center"
              style={{ fontFamily: 'Archivo, sans-serif' }}
            >
              Rental Readiness Checker
            </h1>
            <p
              className="text-gray-600 mb-8 text-center max-w-2xl mx-auto"
              style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}
            >
              Answer a few quick questions to check how ready you are for rental applications.
            </p>

            {/* Main assessment layout */}
            <div className="bg-[#F7F8FB] rounded-3xl p-6 md:p-10">
              <div className="grid md:grid-cols-[280px,minmax(0,1fr)] gap-10 items-stretch">
                {/* Left sidebar - categories */}
                <div>
                  <div className="bg-white rounded-2xl shadow-md p-4 space-y-2">
                    {categories.map((category, index) => {
                      const isCurrentCategory = currentQuestion.category === category;
                      const isComplete = isCategoryComplete(category);

                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => handleCategoryClick(category)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                            isCurrentCategory
                              ? 'bg-[#E6F3FF] border-2 border-[#136C9E] shadow-sm'
                              : isComplete
                              ? 'bg-green-50 border border-green-200 hover:bg-green-100'
                              : 'bg-white border border-gray-200 hover:bg-gray-50'
                          }`}
                          style={isCurrentCategory ? { fontFamily: 'Archivo, sans-serif' } : { fontFamily: 'Archivo, sans-serif' }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                isCurrentCategory
                                  ? 'bg-[#136C9E] text-white'
                                  : isComplete
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-300 text-gray-600'
                              }`}
                            >
                              {isComplete ? '✓' : index + 1}
                            </div>
                            <span
                              className={`text-sm font-medium ${
                                isCurrentCategory
                                  ? 'text-[#136C9E]'
                                  : isComplete
                                  ? 'text-green-700'
                                  : 'text-gray-800'
                              }`}
                              style={{ fontFamily: 'Archivo, sans-serif' }}
                            >
                              {category}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right side - current question & answers */}
                <div className="flex flex-col items-center md:items-start">
                  <p
                    className="text-sm text-gray-500 mb-2 text-center md:text-left"
                    style={{ fontFamily: 'Archivo, sans-serif' }}
                  >
                    {currentQuestion.category} question {currentCategoryIndex} of{' '}
                    {currentCategoryTotal}
                  </p>
                  <h2
                    className="text-xl md:text-2xl font-semibold text-gray-900 mb-8 text-center md:text-left"
                    style={{ fontFamily: 'Archivo, sans-serif', color: '#136C9E' }}
                  >
                    {currentQuestion.text}
                  </h2>

                  <div className="flex flex-col sm:flex-row gap-6 justify-center md:justify-start w-full">
                    {/* Yes card */}
                    <button
                      type="button"
                      onClick={() => handleAnswer(currentQuestion.id, true)}
                      className={`flex-1 max-w-xs rounded-2xl border-2 shadow-sm transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${
                        currentAnswer === true
                          ? 'border-emerald-400 shadow-lg bg-white scale-105'
                          : 'border-gray-200 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <div
                        className={`h-12 w-full rounded-t-2xl transition-colors ${
                          currentAnswer === true ? 'bg-emerald-100' : 'bg-emerald-50'
                        }`}
                      />
                      <div className="px-8 py-6 flex flex-col items-center justify-center -mt-6">
                        <CheckCircle2
                          className={`h-8 w-8 transition-colors ${
                            currentAnswer === true
                              ? 'text-emerald-500'
                              : 'text-emerald-400'
                          }`}
                        />
                        <span
                          className="mt-3 text-lg font-semibold text-gray-900"
                          style={{ fontFamily: 'Archivo, sans-serif' }}
                        >
                          Yes
                        </span>
                      </div>
                    </button>

                    {/* No card */}
                    <button
                      type="button"
                      onClick={() => handleAnswer(currentQuestion.id, false)}
                      className={`flex-1 max-w-xs rounded-2xl border-2 shadow-sm transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${
                        currentAnswer === false
                          ? 'border-rose-400 shadow-lg bg-white scale-105'
                          : 'border-gray-200 bg-white hover:border-rose-300'
                      }`}
                    >
                      <div
                        className={`h-12 w-full rounded-t-2xl transition-colors ${
                          currentAnswer === false ? 'bg-rose-100' : 'bg-rose-50'
                        }`}
                      />
                      <div className="px-8 py-6 flex flex-col items-center justify-center -mt-6">
                        <XCircle
                          className={`h-8 w-8 transition-colors ${
                            currentAnswer === false ? 'text-rose-500' : 'text-rose-400'
                          }`}
                        />
                        <span
                          className="mt-3 text-lg font-semibold text-gray-900"
                          style={{ fontFamily: 'Archivo, sans-serif' }}
                        >
                          No
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Next button */}
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentAnswer === undefined || currentAnswer === null || currentQuestionIndex === questions.length - 1}
                  className={`px-10 py-3 rounded-full font-semibold text-white transition-all duration-300 flex items-center gap-2 min-w-[140px] justify-center ${
                    currentAnswer !== undefined && currentAnswer !== null && currentQuestionIndex < questions.length - 1
                      ? 'bg-gradient-to-r from-[#DC5F12] to-[#DC5F12]/80 hover:from-[#DC5F12]/90 hover:to-[#DC5F12]/70 hover:scale-105 hover:shadow-lg'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                  style={{
                    background: currentAnswer !== undefined && currentAnswer !== null && currentQuestionIndex < questions.length - 1
                      ? 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)'
                      : '#D1D5DB',
                    boxShadow: currentAnswer !== undefined && currentAnswer !== null && currentQuestionIndex < questions.length - 1
                      ? '0 4px 14px 0 rgba(220, 95, 18, 0.39)'
                      : 'none',
                    fontFamily: 'Archivo, sans-serif'
                  }}
                >
                  <span>
                    {currentQuestionIndex === questions.length - 1
                      ? 'Complete'
                      : 'Next'}
                  </span>
                  {currentQuestionIndex < questions.length - 1 && (
                    <span aria-hidden="true">→</span>
                  )}
                </button>
              </div>
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
