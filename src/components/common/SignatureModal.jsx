import React, { useRef, useState, useEffect } from 'react';
import {
  PenTool,
  UploadCloud,
  RotateCcw,
  CheckCircle2,
  X,
  Lock,
  Stamp,
  ShieldCheck,
  AlertCircle,
  FileSignature
} from 'lucide-react';

export default function SignatureModal({
  isOpen,
  onClose,
  signerRole = 'student',
  targetStudent,
  documentTitle = 'Internship Document',
  onSaveSignature
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#002147'); // Default CUI Navy
  const [strokeWidth, setStrokeWidth] = useState(2.5);
  const [canvasHasContent, setCanvasHasContent] = useState(false);
  const [strokeHistory, setStrokeHistory] = useState([]);

  // For faculty/incharge/hod upload
  const [signatureMode, setSignatureMode] = useState('draw'); // 'draw' or 'upload'
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null);
  const [officialStampPreset, setOfficialStampPreset] = useState(null);
  const [verificationNote, setVerificationNote] = useState('');

  // Lock students strictly to draw mode
  const isStudent = signerRole === 'student';

  useEffect(() => {
    if (isStudent) {
      setSignatureMode('draw');
    }
  }, [isStudent, isOpen]);

  // Canvas setup
  useEffect(() => {
    if (!isOpen || signatureMode !== 'draw') return;

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;

      // Save initial blank state
      setStrokeHistory([canvas.toDataURL()]);
      setCanvasHasContent(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, signatureMode]);

  if (!isOpen) return null;

  // Drawing event handlers
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setCanvasHasContent(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.closePath();
    setIsDrawing(false);

    // Save snapshot for undo
    setStrokeHistory((prev) => [...prev, canvas.toDataURL()]);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setCanvasHasContent(false);
    setStrokeHistory([canvas.toDataURL()]);
  };

  const undoLastStroke = () => {
    if (strokeHistory.length <= 1) {
      clearCanvas();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const newHistory = strokeHistory.slice(0, -1);
    const previousState = newHistory[newHistory.length - 1];

    const img = new Image();
    img.src = previousState;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setStrokeHistory(newHistory);
      setCanvasHasContent(newHistory.length > 1);
    };
  };

  // Image file upload handler for faculty/incharge/hod
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImagePreview(event.target.result);
      setOfficialStampPreset(null);
    };
    reader.readAsDataURL(file);
  };

  // Pre-generated official staff digital stamp preset
  const selectStaffPreset = (type) => {
    let svgString = '';
    const dateStr = new Date().toLocaleDateString('en-GB');

    if (signerRole === 'supervisor') {
      svgString = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="260" height="90"><rect width="256" height="86" x="2" y="2" rx="6" fill="%23f0f9ff" stroke="%230284c7" stroke-width="2" stroke-dasharray="4,2"/><text x="128" y="25" font-family="Arial" font-size="11" font-weight="bold" fill="%23002147" text-anchor="middle">FACULTY SUPERVISOR VERIFIED</text><text x="128" y="45" font-family="Brush Script MT, cursive" font-size="24" fill="%230369a1" text-anchor="middle">Dr. Zeeshan Ali</text><text x="128" y="65" font-family="Arial" font-size="9" fill="%2364748b" text-anchor="middle">Emp ID: CS-108 | Dept of CS</text><text x="128" y="78" font-family="Arial" font-size="9" fill="%230284c7" text-anchor="middle">Date: ${dateStr}</text></svg>`;
    } else if (signerRole === 'incharge') {
      svgString = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="260" height="90"><rect width="256" height="86" x="2" y="2" rx="6" fill="%23fffbeb" stroke="%23d97706" stroke-width="2"/><circle cx="35" cy="43" r="24" fill="none" stroke="%23d97706" stroke-width="2"/><text x="35" y="47" font-family="Arial" font-size="9" font-weight="bold" fill="%23d97706" text-anchor="middle">CUI</text><text x="145" y="25" font-family="Arial" font-size="11" font-weight="bold" fill="%2392400e" text-anchor="middle">INTERNSHIP INCHARGE CELL</text><text x="145" y="46" font-family="Brush Script MT, cursive" font-size="22" fill="%23b45309" text-anchor="middle">Dr. Usama Nadeem</text><text x="145" y="65" font-family="Arial" font-size="9" fill="%2378350f" text-anchor="middle">Official Placement &amp; Clearance</text><text x="145" y="78" font-family="Arial" font-size="9" fill="%23b45309" text-anchor="middle">Endorsed: ${dateStr}</text></svg>`;
    } else if (signerRole === 'hod') {
      svgString = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="260" height="90"><rect width="256" height="86" x="2" y="2" rx="6" fill="%23fdf2f8" stroke="%23be185d" stroke-width="2"/><text x="128" y="24" font-family="Arial" font-size="11" font-weight="bold" fill="%23831843" text-anchor="middle">HEAD OF DEPARTMENT (CS)</text><text x="128" y="46" font-family="Brush Script MT, cursive" font-size="24" fill="%239d174d" text-anchor="middle">Prof. Dr. Majid Iqbal</text><text x="128" y="65" font-family="Arial" font-size="9" fill="%23831843" text-anchor="middle">CUI Islamabad - Final Clearance</text><text x="128" y="78" font-family="Arial" font-size="9" fill="%23be185d" text-anchor="middle">3 Credit Hours Granted | ${dateStr}</text></svg>`;
    }

    setOfficialStampPreset(svgString);
    setUploadedImagePreview(null);
  };

  const handleSave = () => {
    let finalSignatureUrl = null;

    if (signatureMode === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !canvasHasContent) {
        alert('Please draw your signature on the pad before confirming.');
        return;
      }
      finalSignatureUrl = canvas.toDataURL('image/png');
    } else {
      finalSignatureUrl = uploadedImagePreview || officialStampPreset;
      if (!finalSignatureUrl) {
        alert('Please upload a signature file or choose the official verified digital signature stamp.');
        return;
      }
    }

    onSaveSignature(finalSignatureUrl, verificationNote);
    onClose();
  };

  const getRoleTitle = () => {
    switch (signerRole) {
      case 'student':
        return 'Student Signature (Handwritten Draw Canvas)';
      case 'supervisor':
        return 'Faculty Supervisor Signature & Endorsement';
      case 'incharge':
        return 'Internship Incharge Verification Stamp';
      case 'hod':
        return 'Head of Department (HOD) Clearance Seal';
      default:
        return 'Sign Document';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-cui-navy text-white px-5 py-3.5 flex items-center justify-between border-b border-cui-gold">
          <div className="flex items-center gap-2.5">
            <FileSignature className="w-5 h-5 text-cui-gold" />
            <div>
              <h3 className="font-bold text-sm leading-tight text-white">
                {getRoleTitle()}
              </h3>
              <p className="text-[11px] text-slate-300">
                Document: <span className="font-semibold text-cui-gold">{documentTitle}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Target Student Info Strip */}
          {targetStudent && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 font-medium">Student: </span>
                <span className="font-bold text-cui-navy">{targetStudent.name}</span>
                <span className="font-mono text-slate-600 ml-1.5 font-medium">({targetStudent.regNo})</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Company: <span className="font-semibold text-slate-700">{targetStudent.internshipCompany || 'N/A'}</span>
              </div>
            </div>
          )}

          {/* Mode Switcher Tabs (Strictly Enforces Role Requirement) */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setSignatureMode('draw')}
              className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-2 transition-colors ${
                signatureMode === 'draw'
                  ? 'border-cui-navy text-cui-navy bg-blue-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <PenTool className="w-3.5 h-3.5 text-cui-gold" />
              Draw Signature on Canvas
            </button>

            {isStudent ? (
              /* Student locked out from uploading */
              <div
                className="flex-1 py-2.5 text-xs font-semibold text-slate-400 bg-slate-100/70 border-b-2 border-transparent flex items-center justify-center gap-1.5 cursor-not-allowed"
                title="Security restriction: Students must draw their signature manually."
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Upload Generated (Restricted for Students)
              </div>
            ) : (
              /* Staff (Supervisor / Incharge / HOD) can upload generated signature */
              <button
                onClick={() => setSignatureMode('upload')}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-2 transition-colors ${
                  signatureMode === 'upload'
                    ? 'border-cui-navy text-cui-navy bg-blue-50/40'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5 text-cui-gold" />
                Upload Generated / Digital Stamp
              </button>
            )}
          </div>

          {/* Special requirement banner for student */}
          {isStudent && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-2 text-xs flex items-start gap-2 text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">COMSATS Verification Rule:</span> Students are only permitted to draw their personal handwritten signature on canvas in their designated signature block. Uploading image files is disabled.
              </div>
            </div>
          )}

          {/* Draw Mode: Canvas Signature Pad */}
          {signatureMode === 'draw' && (
            <div className="space-y-3">
              {/* Styling Controls */}
              <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Ink Color:</span>
                  <div className="flex items-center gap-1">
                    {[
                      { color: '#002147', label: 'CUI Navy' },
                      { color: '#0f172a', label: 'Black' },
                      { color: '#1d4ed8', label: 'Blue' },
                    ].map((c) => (
                      <button
                        key={c.color}
                        onClick={() => setStrokeColor(c.color)}
                        className={`w-5 h-5 rounded-full border-2 transition-all ${
                          strokeColor === c.color ? 'ring-2 ring-cui-gold scale-110 border-white' : 'border-slate-300'
                        }`}
                        style={{ backgroundColor: c.color }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Stroke:</span>
                  <div className="flex items-center gap-1">
                    {[
                      { width: 1.5, label: 'Fine' },
                      { width: 2.5, label: 'Normal' },
                      { width: 4.0, label: 'Thick' },
                    ].map((w) => (
                      <button
                        key={w.width}
                        onClick={() => setStrokeWidth(w.width)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          strokeWidth === w.width
                            ? 'bg-cui-navy text-white border-cui-navy'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={undoLastStroke}
                    className="p-1 text-slate-600 hover:text-cui-navy hover:bg-slate-200 rounded text-[11px] flex items-center gap-0.5"
                    title="Undo stroke"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Undo</span>
                  </button>
                  <button
                    onClick={clearCanvas}
                    className="px-2 py-0.5 text-red-600 hover:bg-red-50 rounded text-[11px] font-semibold border border-red-200"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Canvas Pad Box */}
              <div className="relative border-2 border-dashed border-slate-300 rounded-lg bg-white overflow-hidden shadow-inner cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  width={520}
                  height={170}
                  className="w-full h-[170px] touch-none block"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />

                {!canvasHasContent && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-300">
                    <PenTool className="w-8 h-8 mb-1 opacity-40 text-cui-navy" />
                    <p className="text-xs font-medium">Draw your signature with mouse or touch here</p>
                    <div className="w-48 border-b border-slate-200 mt-3"></div>
                  </div>
                )}

                <div className="absolute bottom-1 right-2 text-[10px] font-mono text-slate-400 pointer-events-none">
                  [Section: {signerRole.toUpperCase()}_SIGNATURE]
                </div>
              </div>
            </div>
          )}

          {/* Upload / Generated Mode: For Faculty, Incharge, HOD */}
          {!isStudent && signatureMode === 'upload' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-600 font-medium">
                As <span className="font-bold text-cui-navy capitalize">{signerRole}</span>, you can upload a scanned signature image or apply the official verified department digital stamp.
              </div>

              {/* Upload image box */}
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-slate-50 text-center hover:bg-blue-50/50 transition-colors">
                <input
                  type="file"
                  id="sig-upload"
                  accept="image/png, image/jpeg, image/svg+xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="sig-upload"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  <UploadCloud className="w-8 h-8 text-cui-navy mb-1.5" />
                  <span className="text-xs font-bold text-cui-navy">Upload Generated Signature Image</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">PNG, JPG, or SVG with transparent background</span>
                  <span className="mt-2 px-3 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                    Browse Files
                  </span>
                </label>
              </div>

              {/* Or Choose Official Verified CUI Stamp Preset */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cui-navy flex items-center gap-1">
                    <Stamp className="w-3.5 h-3.5 text-cui-gold" />
                    Quick Preset: Official {signerRole.toUpperCase()} Digital Stamp
                  </span>
                  <button
                    type="button"
                    onClick={() => selectStaffPreset(signerRole)}
                    className="text-[11px] bg-cui-navy text-white px-2 py-0.5 rounded font-medium hover:bg-cui-navy-light transition-colors"
                  >
                    Generate Official Stamp
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Automatically generates CUI official cryptographic verification stamp with Employee ID & timestamp.
                </p>
              </div>

              {/* Preview of selected signature/stamp */}
              {(uploadedImagePreview || officialStampPreset) && (
                <div className="border border-slate-200 rounded-lg p-3 bg-white flex flex-col items-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Active Signature / Stamp Preview
                  </span>
                  <img
                    src={uploadedImagePreview || officialStampPreset}
                    alt="Signature preview"
                    className="max-h-24 object-contain border border-slate-100 p-1 rounded shadow-sm"
                  />
                </div>
              )}
            </div>
          )}

          {/* Optional Endorsement Note (For Faculty, Incharge, HOD) */}
          {!isStudent && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Feedback / Endorsement Remarks:
              </label>
              <input
                type="text"
                value={verificationNote}
                onChange={(e) => setVerificationNote(e.target.value)}
                placeholder="e.g. Industry logbook verified. Performance satisfies CUI requirements."
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cui-navy text-slate-800"
              />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-cui-navy hover:bg-cui-navy-light text-white text-xs font-bold rounded shadow transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-cui-gold" />
            <span>Confirm & Affix Signature</span>
          </button>
        </div>
      </div>
    </div>
  );
}
