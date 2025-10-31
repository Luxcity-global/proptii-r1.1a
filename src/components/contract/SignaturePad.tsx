import React, { useRef, useEffect, useState } from 'react';
import SignaturePad from 'signature_pad';
import { Trash2, RotateCcw } from 'lucide-react';

interface SignaturePadComponentProps {
  onSignatureChange: (signatureData: string | null) => void;
  width?: number;
  height?: number;
  backgroundColor?: string;
  penColor?: string;
  className?: string;
}

const SignaturePadComponent: React.FC<SignaturePadComponentProps> = ({
  onSignatureChange,
  width = 400,
  height = 200,
  backgroundColor = '#ffffff',
  penColor = '#000000',
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  useEffect(() => {
    if (canvasRef.current && !signaturePadRef.current) {
      const canvas = canvasRef.current;
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Initialize SignaturePad only once
      signaturePadRef.current = new SignaturePad(canvas, {
        backgroundColor: backgroundColor,
        penColor: penColor,
        minWidth: 1,
        maxWidth: 3,
        throttle: 16,
        minDistance: 5,
      });

      // Handle signature changes
      signaturePadRef.current.addEventListener('beginStroke', () => {
        console.log('🖊️ Signature stroke began');
        setIsEmpty(false);
      });

      signaturePadRef.current.addEventListener('endStroke', () => {
        console.log('🖊️ Signature stroke ended');
        const data = signaturePadRef.current?.toDataURL();
        if (data) {
          console.log('🖊️ Signature data captured, length:', data.length);
          setSignatureData(data);
          onSignatureChange(data);
        }
      });

      // Check if signature is empty initially
      setIsEmpty(signaturePadRef.current.isEmpty());
    }
  }, [backgroundColor, penColor, onSignatureChange]);

  // Handle width/height changes without reinitializing SignaturePad
  useEffect(() => {
    if (canvasRef.current && signaturePadRef.current) {
      const canvas = canvasRef.current;
      canvas.width = width;
      canvas.height = height;
      // SignaturePad will automatically adjust to new canvas size
    }
  }, [width, height]);

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setIsEmpty(true);
      setSignatureData(null);
      onSignatureChange(null);
    }
  };

  const undoSignature = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const data = signaturePadRef.current.toData();
      if (data.length > 0) {
        data.pop(); // Remove last stroke
        signaturePadRef.current.fromData(data);
        const isEmpty = signaturePadRef.current.isEmpty();
        setIsEmpty(isEmpty);
        
        if (isEmpty) {
          setSignatureData(null);
          onSignatureChange(null);
        } else {
          const newSignatureData = signaturePadRef.current.toDataURL();
          setSignatureData(newSignatureData);
          onSignatureChange(newSignatureData);
        }
      }
    }
  };

  return (
    <div className={`signature-pad-container ${className}`}>
      <div className="signature-pad-header flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-700">Draw Your Signature</h3>
        <div className="flex gap-2">
          <button
            onClick={undoSignature}
            disabled={isEmpty}
            className="p-1 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
            title="Undo last stroke"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={clearSignature}
            disabled={isEmpty}
            className="p-1 text-red-500 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed"
            title="Clear signature"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="signature-pad-wrapper border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="signature-canvas block"
          style={{ 
            width: `${width}px`, 
            height: `${height}px`,
            cursor: 'crosshair'
          }}
        />
      </div>
      
      <div className="signature-pad-footer mt-2 text-xs text-gray-500">
        {isEmpty ? (
          <span>Click and drag to draw your signature</span>
        ) : (
          <span className="text-green-600">✓ Signature captured</span>
        )}
      </div>
    </div>
  );
};

export default SignaturePadComponent;
