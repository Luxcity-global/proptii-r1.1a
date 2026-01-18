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
      
      <div className="min-h-screen font-nunito">
        <div className="max-w-4xl mx-auto px-4 pt-12 pb-12">
          <Link
            to="/tools"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-8"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Tools
          </Link>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Archivo, sans-serif' }}>Rental Readiness Checker</h1>
            <p className="text-gray-600 mb-8" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
              Answer these questions to assess your readiness for rental applications. Be honest to get the most accurate assessment.
            </p>

            {/* SEO Content Section */}
            <div className="bg-blue-50 rounded-xl p-6 mb-8 border border-blue-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Archivo, sans-serif' }}>
                Why Check Your Rental Readiness?
              </h2>
              <div style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }} contentEditable={false}>
                <p className="mb-4">
                  Before you start applying for rental properties in the UK, it's essential to ensure you have everything landlords and letting agents require. Missing documents or unprepared applications can lead to rejection, wasted time, and lost opportunities on properties you love.
                </p>
                <p className="mb-4">
                  Our rental readiness checker evaluates your preparation across eight key areas: legal documentation (right to rent), proof of income, references, financial readiness, credit checks, identity verification, guarantor arrangements, and deposit funds. Each question helps identify gaps in your application package.
                </p>
                <p>
                  <strong>How it works:</strong> Answer all 8 questions honestly. Based on your responses, you'll receive a readiness score and personalized feedback. If you score 75% or higher, you're well-prepared. Below 50%, you may need to gather additional documents or make arrangements before applying. You can download your checklist as a PDF document for reference.
                </p>
              </div>
            </div>

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
