import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

// --- INTERFACES ---
interface AcademicSection {
  id: string;
  subject: string;
  staarProficient: string;
  staarDeficits: string;
  progressDataSources: string[];
  currentData: string;
  performanceComparison: string;
  noProgressReason: string;
  readingFluency: string;
  readingComprehension: string;
  mathProblemSolving: string;
  supportsPerformance: string;
  classroomStrengths: string;
  classroomDeficits: string;
  deficitsEvidence: string;
  withSupports: string;
  withoutSupports: string;
  peerComparisonGradeLevel: string;
  peerComparisonStudent: string;
  benchmarkPercentile: string;
  peerBenchmarkPercentile: string;
  strengthsDespiteDeficits: string;
  criticalNeeds: string;
  independentAccessImpact: string;
}

interface PerformanceSummarySection {
  id: string;
  subject: string;
  passedStateAssessment: 'passed' | 'did not pass' | '';
  taksScore: string;
  rawScore: string;
  percentCorrect: string;
  gradeInSubject: string;
  accommodations: string;
  needs: string;
  receivesSpecialEdSupport: 'receives' | 'does not receive' | '';
  strengths: string;
}

interface PlaafpData {
  studentName: string;
  grade: string;
  disabilities: string;
  subjects: string;
  cognitiveDeficits: string;
  academicDeficits: string;
  disabilityImpact: string;
  deficitType: string;
  specialEdSupport: string;
  relatedServices: string;
  accommodations: string;
  academicSections: AcademicSection[];
  performanceSummarySections: PerformanceSummarySection[];
  functionalStrengths: string;
  functionalDeficits: string;
  functionalDataSource: string;
  functionalImpact: string;
  transitionStrengths: string;
  transitionSupportNeeds: string;
  transitionIndependentLiving: string;
  transitionSchedules: string;
  transitionResponsibility: string;
  transitionParticipation: string;
  transitionEmploymentGoal: string;
  parentEmploymentPlan: string;
  parentEmploymentGoal: string;
  parentLivingPlan: string;
  parentName: string;
}

// --- CONSTANTS ---
const STEPS = ['Introductory', 'Academics', 'Functional', 'Transition', 'Summary'];

const FAKE_STUDENT_NAMES = ['Student Alpha', 'Student Beta', 'Student Gamma', 'Student Delta', 'Student Epsilon'];

const initialAcademicSection: Omit<AcademicSection, 'id'> = {
  subject: '', staarProficient: '', staarDeficits: '',
  progressDataSources: [], currentData: '', performanceComparison: '',
  noProgressReason: '', readingFluency: '', readingComprehension: '',
  mathProblemSolving: '', supportsPerformance: '', classroomStrengths: '',
  classroomDeficits: '', deficitsEvidence: '', withSupports: '',
  withoutSupports: '', peerComparisonGradeLevel: '', peerComparisonStudent: '',
  benchmarkPercentile: '', peerBenchmarkPercentile: '',
  strengthsDespiteDeficits: '', criticalNeeds: '', independentAccessImpact: '',
};

const initialPerformanceSummarySection: Omit<PerformanceSummarySection, 'id'> = {
  subject: '', passedStateAssessment: '', taksScore: '', rawScore: '',
  percentCorrect: '', gradeInSubject: '', accommodations: '', needs: '',
  receivesSpecialEdSupport: '', strengths: ''
};


const initialPlaafpData: PlaafpData = {
  studentName: '', grade: '', disabilities: '', subjects: '',
  cognitiveDeficits: '', academicDeficits: '', disabilityImpact: '',
  deficitType: '', specialEdSupport: '', relatedServices: '',
  accommodations: '', academicSections: [], performanceSummarySections: [],
  functionalStrengths: '', functionalDeficits: '', functionalDataSource: '',
  functionalImpact: '', transitionStrengths: '', transitionSupportNeeds: '',
  transitionIndependentLiving: '', transitionSchedules: '',
  transitionResponsibility: '', transitionParticipation: '',
  transitionEmploymentGoal: '', parentEmploymentPlan: '',
  parentEmploymentGoal: '', parentLivingPlan: '', parentName: '',
};

// --- HELPER FUNCTIONS ---
const fill = (value: string, placeholder: string) => value?.trim() ? value.trim() : `(${placeholder})`;
const fillPronoun = (studentName: string, pronoun: string) => studentName?.trim() ? pronoun : 'he/she';
const fillPossessive = (studentName: string, pronoun: string) => studentName?.trim() ? `${studentName}'s` : `______'s`;

// --- REACT COMPONENTS ---
const ApiKeyModal = ({ onSave }: { onSave: (key: string) => void }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSave = () => {
    if (apiKey.trim()) {
      onSave(apiKey.trim());
    } else {
      alert('Please enter a valid API key.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content api-key-modal">
        <div className="modal-header">
          <h3>Welcome to the PLAAFP AI Assistant</h3>
        </div>
        <div className="modal-body">
          <p>To enable AI-powered features, this application requires a Google AI API key.</p>
          <p>You can get a free key from Google AI Studio. Please copy your key and paste it below.</p>
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
            Get your Google AI API Key here
          </a>
          <input
            type="password"
            className="api-key-input"
            placeholder="Enter your API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button className="api-key-save-btn" onClick={handleSave}>
            Save and Continue
          </button>
          <p className="api-key-note">
            <strong>Privacy Note:</strong> Your API key is saved securely in your browser's local storage and is never sent anywhere else.
          </p>
        </div>
      </div>
    </div>
  );
};

const DocumentManager = ({ savedPlaafps, currentId, onSave, onLoad, onNew, onDelete }: { savedPlaafps: Record<string, PlaafpData>, currentId: string | null, onSave: () => void, onLoad: (id: string) => void, onNew: () => void, onDelete: (id: string) => void}) => {
    const currentDocName = currentId && savedPlaafps[currentId] ? savedPlaafps[currentId].studentName : "New Document";
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && event.target instanceof Node && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const handleSelect = (id: string) => {
        onLoad(id);
        setIsOpen(false);
    }

    const handleNew = () => {
        onNew();
        setIsOpen(false);
    }

    return (
        <div className="doc-manager">
            <button className="doc-save-btn" onClick={onSave}>Save</button>
            <div className="doc-dropdown-container" ref={dropdownRef}>
                <button className="doc-current" onClick={() => setIsOpen(!isOpen)}>
                    {currentDocName} <span className="arrow">{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen && (
                    <div className="doc-dropdown-menu">
                        <button className="doc-item doc-new" onClick={handleNew}>+ New Document</button>
                        <hr/>
                        {Object.keys(savedPlaafps).length > 0 ? (
                            Object.entries(savedPlaafps).map(([id, doc]) => (
                                <div key={id} className="doc-item-container">
                                    <button className="doc-item" onClick={() => handleSelect(id)} title={doc.studentName || `Document ${id}`}>
                                        {doc.studentName || `Document ${id}`}
                                    </button>
                                    <button className="doc-delete-btn" onClick={() => onDelete(id)} title={`Delete ${doc.studentName}`}>×</button>
                                </div>
                            ))
                        ) : (
                            <div className="doc-item-empty">No saved documents</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [data, setData] = useState<PlaafpData>(initialPlaafpData);
  const [currentStep, setCurrentStep] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<{ field: string; label: string; academicIndex?: number; summaryIndex?: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', content: '' });
  const [savedPlaafps, setSavedPlaafps] = useState<Record<string, PlaafpData>>({});
  const [currentPlaafpId, setCurrentPlaafpId] = useState<string | null>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini-api-key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  useEffect(() => {
    if (!apiKey) return; // Don't load docs until API key is confirmed
    try {
      const allDocsRaw = localStorage.getItem('plaafp-documents');
      const docs = allDocsRaw ? JSON.parse(allDocsRaw) : {};
      setSavedPlaafps(docs);

      const currentId = localStorage.getItem('plaafp-current-id');
      if (currentId && typeof currentId === 'string' && docs[currentId]) {
        setCurrentPlaafpId(currentId);
        setData(docs[currentId]);
      } else {
        setData(initialPlaafpData);
        setCurrentPlaafpId(null);
        localStorage.removeItem('plaafp-current-id');
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      setData(initialPlaafpData);
      setSavedPlaafps({});
      setCurrentPlaafpId(null);
    }
  }, [apiKey]);

  const handleSaveApiKey = (key: string) => {
    localStorage.setItem('gemini-api-key', key);
    setApiKey(key);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete ALL saved documents? This cannot be undone.')) {
      setSavedPlaafps({});
      localStorage.removeItem('plaafp-documents');
      handleNew();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleAcademicChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newSections = [...data.academicSections];
    newSections[index] = { ...newSections[index], [name]: value };
    setData(prev => ({ ...prev, academicSections: newSections }));
  };
  
  const handleAddAcademicSection = () => {
    setData(prev => ({
      ...prev,
      academicSections: [...prev.academicSections, { id: Date.now().toString(), ...initialAcademicSection }]
    }));
  };

  const handlePerformanceSummaryChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newSections = [...data.performanceSummarySections];
    newSections[index] = { ...newSections[index], [name]: value };
    setData(prev => ({ ...prev, performanceSummarySections: newSections }));
  };
  
  const handleAddPerformanceSummarySection = () => {
    setData(prev => ({
      ...prev,
      performanceSummarySections: [...prev.performanceSummarySections, { id: Date.now().toString(), ...initialPerformanceSummarySection }]
    }));
  };

  const handleSave = () => {
    if (!data.studentName.trim()) {
      alert("Please enter a student name before saving.");
      return;
    }
    
    const idToSave = currentPlaafpId || Date.now().toString();
    const newSavedPlaafps = { ...savedPlaafps, [idToSave]: data };

    setSavedPlaafps(newSavedPlaafps);
    setCurrentPlaafpId(idToSave);
    
    try {
      localStorage.setItem('plaafp-documents', JSON.stringify(newSavedPlaafps));
      localStorage.setItem('plaafp-current-id', idToSave);
      alert('Document saved!');
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
      alert('Error saving document.');
    }
  };

  const handleNew = () => {
    setData(initialPlaafpData);
    setCurrentPlaafpId(null);
    localStorage.removeItem('plaafp-current-id');
    setActiveField(null);
    setCurrentStep(0);
  };
  
  const handleLoad = (id: string) => {
    if (savedPlaafps[id]) {
        setData(savedPlaafps[id]);
        setCurrentPlaafpId(id);
        localStorage.setItem('plaafp-current-id', id);
        setActiveField(null);
        setCurrentStep(0);
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm(`Are you sure you want to delete the document for "${savedPlaafps[id].studentName}"? This cannot be undone.`)) {
        return;
    }
    const newSavedPlaafps = { ...savedPlaafps };
    delete newSavedPlaafps[id];
    setSavedPlaafps(newSavedPlaafps);
    localStorage.setItem('plaafp-documents', JSON.stringify(newSavedPlaafps));

    if (currentPlaafpId === id) {
        handleNew();
    }
  };


  const getSuggestion = async (field: string, label: string) => {
    if (!apiKey) return;
    setLoadingMessage(`Getting suggestion for ${label}...`);
    try {
        const ai = new GoogleGenAI({ apiKey });
        let prompt = '';
        let modalTitle = `Suggestion for ${label}`;

        if (field === 'disabilityImpact') {
            if (!data.cognitiveDeficits && !data.academicDeficits) {
                setModalContent({ title: 'Missing Information', content: "Please fill in the 'Cognitive Deficits' and/or 'Academic Deficits' fields first to get a tailored impact statement." });
                setIsModalOpen(true);
                setLoadingMessage(null);
                return;
            }
            prompt = `Based on a student's cognitive deficits in "${data.cognitiveDeficits || 'none specified'}" and academic deficits in "${data.academicDeficits || 'none specified'}", write a concise, 1-2 sentence impact statement for a PLAAFP document. This statement should describe how these deficits affect the student's ability to access and progress in the general education curriculum. The statement should be ready to be copied directly into the document. For example: "difficulty processing auditory information and challenges with reading fluency affect the student's ability to keep pace with classroom discussions and independently complete grade-level reading assignments."`;
            modalTitle = `Generated Impact Statement`;
        } else {
            prompt = `You are an AI assistant for special education teachers writing a PLAAFP document. For the field labelled "${label}", provide a helpful suggestion, example text, or a list of things to include. Also, briefly suggest where a teacher might find this information (e.g., student's cumulative folder, FIE report, parent interview). Format the response clearly using markdown for bolding and lists.`;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        setModalContent({ title: modalTitle, content: response.text });
        setIsModalOpen(true);

    } catch (error) {
        console.error("Gemini API error:", error);
        setModalContent({ title: 'Error', content: "Sorry, I couldn't get a suggestion at this time. Please ensure your API key is correct and has access." });
        setIsModalOpen(true);
    } finally {
        setLoadingMessage(null);
    }
  };
  
  const extractFromImage = async (base64Image: string, mimeType: string) => {
    if (!apiKey) return;
    if (!activeField) {
      setModalContent({ title: 'No Field Selected', content: "Please click on a text field before pasting an image." });
      setIsModalOpen(true);
      return;
    }
    setLoadingMessage(`Analyzing image for "${activeField.label}"...`);
    try {
      const ai = new GoogleGenAI({ apiKey });
      let prompt = `I've pasted a screenshot. I am trying to fill out the "${activeField.label}" field in a student's PLAAFP document. Please extract only the specific information relevant to this field from the image. Respond with only the extracted text, ready to be placed in the document. If the information is not present, respond with "Information not found in image."`;

      if (activeField.field === 'staarProficient') {
          prompt = `I've pasted a screenshot of a student's STAAR test results. Please analyze the image and identify the two areas where the student showed the highest proficiency. Respond with only the names of these two areas, separated by a comma. For example: "Reading Comprehension, Algebraic Reasoning". If you cannot determine this from the image, respond with "Information not found in image."`;
      } else if (activeField.field === 'staarDeficits') {
          prompt = `I've pasted a screenshot of a student's STAAR test results. Please analyze the image and identify the two areas where the student showed the biggest deficit or lowest performance. Respond with only the names of these two areas, separated by a comma. For example: "Editing and Revising, Data Analysis". If you cannot determine this from the image, respond with "Information not found in image."`;
      } else if (activeField.summaryIndex !== undefined && ['taksScore', 'rawScore', 'percentCorrect'].includes(activeField.field)) {
          const subject = data.performanceSummarySections[activeField.summaryIndex].subject || 'the relevant subject';
          let scoreType = '';
          if (activeField.field === 'taksScore') scoreType = 'scale score (this is usually a 4-digit number)';
          if (activeField.field === 'rawScore') scoreType = 'raw score (this is usually a smaller number, like "35/52")';
          if (activeField.field === 'percentCorrect') scoreType = 'percent correct (e.g., "67%")';
          
          prompt = `I've pasted a screenshot of a student's test results. For the subject "${subject}", please find the most recent test score and extract only the ${scoreType}. Respond with only the number or percentage. For example, if the scale score is '1452', respond with '1452'. If the raw score is '35/52', respond with '35/52'. If the percent correct is '67%', respond with '67%'. If you cannot find this information, respond with "Information not found in image."`;
      }
      
      const imagePart = { inlineData: { data: base64Image, mimeType } };
      const textPart = { text: prompt };
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, imagePart] },
      });

      const extractedText = response.text.trim();
      if (extractedText && !extractedText.toLowerCase().includes("information not found")) {
         if (activeField.academicIndex !== undefined) {
            const newSections = [...data.academicSections];
            newSections[activeField.academicIndex] = { ...newSections[activeField.academicIndex], [activeField.field]: extractedText };
            setData(prev => ({ ...prev, academicSections: newSections }));
         } else if (activeField.summaryIndex !== undefined) {
            const newSections = [...data.performanceSummarySections];
            newSections[activeField.summaryIndex] = { ...newSections[activeField.summaryIndex], [activeField.field]: extractedText };
            setData(prev => ({ ...prev, performanceSummarySections: newSections }));
         } else {
            setData(prev => ({ ...prev, [activeField.field]: extractedText }));
         }
      } else {
        setModalContent({ title: 'Image Analysis', content: "Could not find relevant information for that field in the image." });
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Gemini API image extraction error:", error);
      setModalContent({ title: 'Error', content: "Sorry, I couldn't analyze the image at this time. Please ensure your API key is correct and has access." });
      setIsModalOpen(true);
    } finally {
      setLoadingMessage(null);
    }
  };
  
  const handlePreviewEdit = useCallback((html: string) => {
    const parserDiv = document.createElement('div');
    parserDiv.innerHTML = html;

    setData(currentData => {
        const newData: PlaafpData = JSON.parse(JSON.stringify(currentData));
        const fields = parserDiv.querySelectorAll<HTMLElement>('.editable-field[data-field]');
        let changed = false;

        fields.forEach(fieldElement => {
            const field = fieldElement.dataset.field;
            const indexStr = fieldElement.dataset.index;
            const sectionType = fieldElement.dataset.sectionType;
            const value = fieldElement.innerText;

            if (!field) return;

            if (indexStr !== undefined) {
                const index = parseInt(indexStr, 10);
                if (sectionType === 'academic' && newData.academicSections[index] && (newData.academicSections[index] as any)[field] !== value) {
                    (newData.academicSections[index] as any)[field] = value;
                    changed = true;
                } else if (sectionType === 'summary' && newData.performanceSummarySections[index] && (newData.performanceSummarySections[index] as any)[field] !== value) {
                    (newData.performanceSummarySections[index] as any)[field] = value;
                    changed = true;
                }
            } else {
                if ((newData as any)[field] !== value) {
                    (newData as any)[field] = value;
                    changed = true;
                }
            }
        });

        return changed ? newData : currentData;
    });
  }, []);

  const renderStepContent = () => {
    const commonProps = { data, handleChange, getSuggestion, setActiveField, activeField };
    const academicProps = { ...commonProps, handleAcademicChange, handleAddAcademicSection };
    const summaryProps = { ...commonProps, handlePerformanceSummaryChange, handleAddPerformanceSummarySection };

    switch (currentStep) {
      case 0: return <IntroStep {...commonProps} />;
      case 1: return <AcademicsStep {...academicProps} />;
      case 2: return <FunctionalStep {...commonProps} />;
      case 3: return <TransitionStep {...commonProps} />;
      case 4: return <PerformanceSummaryStep {...summaryProps} />;
      default: return null;
    }
  };

  if (!apiKey) {
    return <ApiKeyModal onSave={handleSaveApiKey} />;
  }

  return (
    <>
      {loadingMessage && <LoadingOverlay message={loadingMessage} />}
      <SuggestionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={modalContent.title}
        content={modalContent.content}
      />
      <header className="app-header">
        <h1>PLAAFP AI Assistant</h1>
        <DocumentManager
            savedPlaafps={savedPlaafps}
            currentId={currentPlaafpId}
            onSave={handleSave}
            onLoad={handleLoad}
            onNew={handleNew}
            onDelete={handleDelete}
        />
        <button className="clear-btn" onClick={handleClearAll} title="Deletes all saved student documents">Delete All Data</button>
      </header>
      <main className="main-content">
        <div className="form-container">
          <nav className="stepper">
            {STEPS.map((step, index) => (
              <button key={step} className={`step ${currentStep === index ? 'active' : ''}`} onClick={() => setCurrentStep(index)}>
                {step}
              </button>
            ))}
          </nav>
          {renderStepContent()}
          <ImageExtractor onImagePaste={extractFromImage} isActive={!!activeField} />
        </div>
        <div className="preview-container">
          <Preview data={data} onEdit={handlePreviewEdit} />
        </div>
      </main>
    </>
  );
};

const SuggestionModal = ({ isOpen, onClose, title, content }: {isOpen: boolean, onClose: () => void, title: string, content: string}) => {
  if (!isOpen) return null;

  const formattedContent = content.split('\n').map((line, i) => {
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return <p key={i} dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} />;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {formattedContent}
        </div>
      </div>
    </div>
  );
};

const FormInput = ({ name, label, value, onChange, onFocus, getSuggestion, type = 'text', rows = 3, academicIndex, summaryIndex }: any) => (
  <div className="form-group">
    <label htmlFor={name}>{label}</label>
    <div className="input-wrapper">
      {type === 'textarea' ? (
        <textarea id={name} name={name} value={value} onChange={onChange} onFocus={() => onFocus({ field: name, label, academicIndex, summaryIndex })} rows={rows} />
      ) : (
        <input type={type} id={name} name={name} value={value} onChange={onChange} onFocus={() => onFocus({ field: name, label, academicIndex, summaryIndex })} />
      )}
      <button className="suggestion-btn" title="Get AI Suggestion" onClick={() => getSuggestion(name, label)}>✨</button>
    </div>
  </div>
);

const IntroStep = ({ data, handleChange, getSuggestion, setActiveField }: {data: PlaafpData, handleChange: any, getSuggestion: any, setActiveField: any}) => (
  <div className="form-section">
    <h2>Introductory Paragraph</h2>
    <div className="form-group">
      <label htmlFor="studentName">Student Name</label>
      <div className="input-wrapper">
        <select
          id="studentName"
          name="studentName"
          value={data.studentName}
          onChange={handleChange}
          onFocus={() => setActiveField({ field: 'studentName', label: 'Student Name' })}
        >
          <option value="">Select a student...</option>
          {FAKE_STUDENT_NAMES.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
    </div>
    <FormInput name="grade" label="Grade" value={data.grade} onChange={handleChange} onFocus={setActiveField} getSuggestion={getSuggestion} />
    <FormInput name="disabilities" label="Disability(ies)" value={data.disabilities} onChange={handleChange} onFocus={setActiveField} getSuggestion={getSuggestion} />
    <FormInput name="subjects" label="Subjects/Courses" value={data.subjects} onChange={handleChange} onFocus={setActiveField} getSuggestion={getSuggestion} />
    <FormInput name="cognitiveDeficits" label="Cognitive Deficits" value={data.cognitiveDeficits} onChange={handleChange} onFocus={setActiveField} getSuggestion={getSuggestion} />
    <FormInput name="academicDeficits" label="Academic Deficits" value={data.academicDeficits} onChange={handleChange} onFocus={setActiveField} getSuggestion={getSuggestion} />
    <FormInput name="disabilityImpact" label="Impact of Disability" value={data.disabilityImpact} onChange={handleChange} onFocus={setActiveField} getSuggestion={getSuggestion} type="textarea" />
    <div className="form-group">
        <label>Deficit Type</label>
        <select name="deficitType" value={data.deficitType} onChange={handleChange} onFocus={() => setActiveField({field: 'deficitType', label: 'Deficit Type'})}>
            <option value="">Select...</option>
            <option value="normative">Normative - compared to same-age peers</option>
            <option value="relative">Relative - compared to student's own abilities</option>
        </select>
    </div>
    <FormInput name="specialEdSupport" label="Special Education/Resource Support" value={data.specialEdSupport} onChange={handleChange} onFocus={setActiveField} getSuggestion={getSuggestion} />
    <FormInput name="relatedServices" label="Related Services" value={data.relatedServices} onChange={handleChange} onFocus={setActiveField} getSuggestion={getSuggestion} />
    <FormInput name="accommodations" label="Accommodations" value={data.accommodations} onChange={handleChange} onFocus={setActiveField} getSuggestion={getSuggestion} />
  </div>
);

const AcademicsStep = ({ data, handleAcademicChange, handleAddAcademicSection, getSuggestion, setActiveField }: {data: PlaafpData, handleAcademicChange: any, handleAddAcademicSection: any, getSuggestion: any, setActiveField: any}) => (
  <div className="form-section">
    <h2>Academics</h2>
    {data.academicSections.map((section, index) => (
      <div key={section.id} className="academic-section">
        <h3>Academic Section {index + 1}</h3>
        <FormInput name="subject" label="Subject/Course" value={section.subject} onChange={(e) => handleAcademicChange(index, e)} onFocus={setActiveField} getSuggestion={getSuggestion} academicIndex={index} />
        <FormInput name="staarProficient" label="STAAR Proficient Areas (TEKS)" value={section.staarProficient} onChange={(e) => handleAcademicChange(index, e)} onFocus={setActiveField} getSuggestion={getSuggestion} academicIndex={index} />
        <FormInput name="staarDeficits" label="STAAR Deficit Areas (TEKS)" value={section.staarDeficits} onChange={(e) => handleAcademicChange(index, e)} onFocus={setActiveField} getSuggestion={getSuggestion} academicIndex={index} />
        <FormInput name="readingFluency" label="Reading Fluency (Score/Percentile)" value={section.readingFluency} onChange={(e) => handleAcademicChange(index, e)} onFocus={setActiveField} getSuggestion={getSuggestion} academicIndex={index} />
        <FormInput name="readingComprehension" label="Reading Comprehension (Score/Percentile)" value={section.readingComprehension} onChange={(e) => handleAcademicChange(index, e)} onFocus={setActiveField} getSuggestion={getSuggestion} academicIndex={index} />
        <FormInput name="mathProblemSolving" label="Math Problem-Solving (Score/Percentile)" value={section.mathProblemSolving} onChange={(e) => handleAcademicChange(index, e)} onFocus={setActiveField} getSuggestion={getSuggestion} academicIndex={index} />
        <FormInput name="classroomStrengths" label="Classroom Strengths" value={section.classroomStrengths} onChange={(e) => handleAcademicChange(index, e)} onFocus={setActiveField} getSuggestion={getSuggestion} academicIndex={index} type="textarea" />
        <FormInput name="classroomDeficits" label="Classroom Deficits" value={section.classroomDeficits} onChange={(e) => handleAcademicChange(index, e)} onFocus={setActiveField} getSuggestion={getSuggestion} academicIndex={index} type="textarea" />
        <FormInput name="deficitsEvidence" label="Evidence of Deficits" value={section.deficitsEvidence} onChange={(e) => handleAcademicChange(index, e)} onFocus={setActiveField} getSuggestion={getSuggestion} academicIndex={index} type="textarea" />
        <FormInput name="criticalNeeds" label="Critical Areas of Need" value={section.criticalNeeds} onChange={(e) => handleAcademicChange(index, e)} onFocus={setActiveField} getSuggestion={getSuggestion} academicIndex={index} type="textarea" />
      </div>
    ))}
    <button className="add-section-btn" onClick={handleAddAcademicSection}>+ Add Academic Section</button>
  </div>
);

const PerformanceSummaryStep = ({ data, handlePerformanceSummaryChange, handleAddPerformanceSummarySection, getSuggestion, setActiveField }: {data: PlaafpData, handlePerformanceSummaryChange: any, handleAddPerformanceSummarySection: any, getSuggestion: any, setActiveField: any}) => (
    <div className="form-section">
      <h2>Summary of Performance</h2>
      {data.performanceSummarySections.map((section, index) => (
        <div key={section.id} className="academic-section">
          <h3>Summary for Subject {index + 1}</h3>
          <FormInput name="subject" label="Subject" value={section.subject} onChange={(e) => handlePerformanceSummaryChange(index, e)} onFocus={setActiveField} getSuggestion={getSuggestion} summaryIndex={index} />
          <div className="form-group">
              <label>State Assessment Outcome</label>
              <select name="passedStateAssessment" value={section.passedStateAssessment} onChange={(e) => handlePerformanceSummaryChange(index, e)} onFocus={() => setActiveField({field: 'passedStateAssessment', label: 'State Assessment Outcome', summaryIndex: index})}>
                  <option value="">Select...</option>
                  <option value="passed">Passed</option>
                  <option value="did not pass">Did not pass</option>
              </select>
          </div>
          <FormInput name="taksScore" label="TAKS/STAAR Scale Score" value={section.taksScore} onChange={(e) => handlePerformanceSummaryChange(index, e)} onFocus={setActiveField} getSuggestion={getSuggestion} summaryIndex={index} />
          <FormInput name="rawScore" label="Raw Score" value={section.rawScore} onChange={(e) => handlePerformanceSummaryChange(index, e)} onFocus={setActiveField} getSuggestion={getSuggestion} summaryIndex={index} />
          <FormInput name="percentCorrect" label="Percent Correct" value={section.percentCorrect} onChange={(e) => handlePerformanceSummaryChange(index, e)} onFocus={setActiveField} getSuggestion={getSuggestion} summaryIndex={index} />
          <FormInput name="gradeInSubject" label="Grade in Subject" value={section.gradeInSubject} onChange={(e) => handlePerformanceSummaryChange(index, e)} onFocus={setActiveField} getSuggestion={getSuggestion} summaryIndex={index} />
          <FormInput name="accommodations" label="Accommodations / Modifications / Assistive Technology" value={section.accommodations} onChange={(e) => handlePerformanceSummaryChange(index, e)} onFocus={setActiveField} getSuggestion={getSuggestion} summaryIndex={index} type="textarea" />
          <FormInput name="needs" label="Needs due to disability" value={section.needs} onChange={(e) => handlePerformanceSummaryChange(index, e)} onFocus={setActiveField} getSuggestion={getSuggestion} summaryIndex={index} type="textarea" />
          <div className="form-group">
              <label>Receives Special Education Support</label>
              <select name="receivesSpecialEdSupport" value={section.receivesSpecialEdSupport} onChange={(e) => handlePerformanceSummaryChange(index, e)} onFocus={() => setActiveField({field: 'receivesSpecialEdSupport', label: 'Receives Special Education Support', summaryIndex: index})}>
                  <option value="">Select...</option>
                  <option value="receives">Receives</option>
                  <option value="does not receive">Does not receive</option>
              </select>
          </div>
          <FormInput name="strengths" label="PLAAFP Strengths for Subject" value={section.strengths} onChange={(e) => handlePerformanceSummaryChange(index, e)} onFocus={setActiveField} getSuggestion={getSuggestion} summaryIndex={index} type="textarea" />
        </div>
      ))}
      <button className="add-section-btn" onClick={handleAddPerformanceSummarySection}>+ Add Summary Section</button>
    </div>
);

const FunctionalStep = ({ data, handleChange, getSuggestion, setActiveField }: {data: PlaafpData, handleChange: any, getSuggestion: any, setActiveField: any}) => (
    <div className="form-section">
      <h2>Functional</h2>
      <FormInput name="functionalDataSource" label="Data Source(s)" value={data.functionalDataSource} onChange={handleChange} onFocus={setActiveField} getSuggestion={getSuggestion} placeholder="e.g., teacher information, informal observation, checklists"/>
      <FormInput name="functionalStrengths" label="Functional Strengths" value={data.functionalStrengths} onChange={handleChange} onFocus={setActiveField} getSuggestion={getSuggestion} type="textarea" />
      <FormInput name="functionalDeficits" label="Functional Deficits & Data" value={data.functionalDeficits} onChange={handleChange} onFocus={setActiveField} getSuggestion={getSuggestion} type="textarea" placeholder="Describe deficits with data (frequency, duration, intensity)"/>
      <FormInput name="functionalImpact" label="Impact on Progress" value={data.functionalImpact} onChange={handleChange} onFocus={setActiveField} getSuggestion={getSuggestion} type="textarea" />
    </div>
);

const TransitionStep = ({ data, handleChange, getSuggestion, setActiveField }: {data: PlaafpData, handleChange: any, getSuggestion: any, setActiveField: any}) => (
    <div className="form-section">
      <h2>Transition (Secondary)</h2>
      <FormInput name="transitionStrengths" label="Strengths (Life Skills, Community)" value={data.transitionStrengths} onChange={handleChange} onFocus={setActiveField} getSuggestion={getSuggestion} />
      <FormInput name="transitionSupportNeeds" label="Support Needs" value={data.transitionSupportNeeds} onChange={handleChange} onFocus={setActiveField} getSuggestion={getSuggestion} />
      <FormInput name="transitionIndependentLiving" label="Independent Living Skills" value={data.transitionIndependentLiving} onChange={handleChange} onFocus={setActiveField} getSuggestion={getSuggestion} />
      <FormInput name="transitionSchedules" label="Follows Schedules (visual/verbal)" value={data.transitionSchedules} onChange={handleChange} onFocus={setActiveField} getSuggestion={getSuggestion} />
      <FormInput name="transitionEmploymentGoal" label="Post-High School Employment Goal" value={data.transitionEmploymentGoal} onChange={handleChange} onFocus={setActiveField} getSuggestion={getSuggestion} />
      <FormInput name="parentName" label="Parent Name(s)" value={data.parentName} onChange={handleChange} onFocus={setActiveField} getSuggestion={getSuggestion} />
      <FormInput name="parentEmploymentPlan" label="Parent's Employment Plan (full/part-time)" value={data.parentEmploymentPlan} onChange={handleChange} onFocus={setActiveField} getSuggestion={getSuggestion} />
      <FormInput name="parentEmploymentGoal" label="Parent's Desired Employment Area" value={data.parentEmploymentGoal} onChange={handleChange} onFocus={setActiveField} getSuggestion={getSuggestion} />
      <FormInput name="parentLivingPlan" label="Parent's Post-Education Living Plan" value={data.parentLivingPlan} onChange={handleChange} onFocus={setActiveField} getSuggestion={getSuggestion} />
    </div>
);

const LoadingOverlay = ({ message }: { message: string }) => (
  <div className="loading-overlay">
    <div className="spinner"></div>
    <span>{message}</span>
  </div>
);

const ImageExtractor = ({ onImagePaste, isActive }: { onImagePaste: (base64: string, mimeType: string) => void; isActive: boolean }) => {
  const handlePaste = useCallback((event: ClipboardEvent) => {
    const items = event.clipboardData?.files;
    if (items && items.length > 0) {
      const file = items[0];
      if (file.type.startsWith('image/')) {
        event.preventDefault();
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = (e.target?.result as string).split(',')[1];
          onImagePaste(base64, file.type);
        };
        reader.readAsDataURL(file);
      }
    }
  }, [onImagePaste]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  return (
    <div className={`image-extractor ${isActive ? 'active' : ''}`}>
      <h3>🖼️ Screenshot Extractor</h3>
      <p>{isActive ? "Ready! Paste your screenshot anywhere on the page." : "First, click into a text field you want to fill."}</p>
    </div>
  );
};


const Preview = ({ data, onEdit }: { data: PlaafpData, onEdit: (html: string) => void }) => {
    const previewRef = useRef<HTMLDivElement>(null);

    const generatePreviewHtml = useCallback((data: PlaafpData): string => {
        const sanitize = (str: string) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        const editableSpan = (field: string, value: string, sectionType?: 'academic' | 'summary', index?: number) => {
            const indexAttr = index !== undefined ? `data-index="${index}"` : '';
            const sectionAttr = sectionType ? `data-section-type="${sectionType}"` : '';
            const sanitizedValue = sanitize(value);
            return `<span class="editable-field" data-field="${field}" ${indexAttr} ${sectionAttr}>${sanitizedValue}</span>`;
        };

        const studentName = data.studentName || '______ (student name)';
        const parentName = data.parentName || '______ (parent name)';
        
        const htmlParts: string[] = [];
        
        htmlParts.push(`<strong>Introductory Paragraph</strong>`);
        htmlParts.push(`<p>${editableSpan('studentName', studentName)} is a ${editableSpan('grade', fill(data.grade, 'grade'))} grade student diagnosed with a ${editableSpan('disabilities', fill(data.disabilities, 'disability(ies)'))} disability(ies). ${sanitize(studentName)} is currently receiving enrolled grade-level instruction in ${editableSpan('subjects', fill(data.subjects, 'subjects/courses'))} in the general education classroom. ${sanitize(fillPossessive(data.studentName, studentName))} full individual evaluation indicates that ${fillPronoun(data.studentName, 'he/she')} has cognitive deficits in ${editableSpan('cognitiveDeficits', fill(data.cognitiveDeficits, 'cognitive areas'))} and academic deficits in ${editableSpan('academicDeficits', fill(data.academicDeficits, 'academic areas'))}.</p>`);
        htmlParts.push(`<p>The student’s disability affects their ability to ${editableSpan('disabilityImpact', fill(data.disabilityImpact, 'describe impact on access/progress'))}. These deficits are noted as ${data.deficitType ? `${data.deficitType.charAt(0).toUpperCase() + data.deficitType.slice(1)}` : '☐ normative ☐ relative'} according to cognitive and achievement assessments.</p>`);
        htmlParts.push(`<p>Currently, ${sanitize(studentName)} receives ${editableSpan('specialEdSupport', fill(data.specialEdSupport, 'special education/resource support'))} and ${editableSpan('relatedServices', fill(data.relatedServices, 'related services'))} with accommodations including ${editableSpan('accommodations', fill(data.accommodations, 'list of accommodations'))}.</p>`);

        data.academicSections.forEach((section, index) => {
            htmlParts.push(`<strong>Academics: ${sanitize(section.subject || `(Subject ${index + 1})`)}</strong>`);
            htmlParts.push(`<p>On the spring STAAR ${editableSpan('subject', fill(section.subject, 'subject/course'), 'academic', index)} assessment, ${sanitize(studentName)} was relatively proficient in ${editableSpan('staarProficient', fill(section.staarProficient, 'TEKS Student Expectations'), 'academic', index)}. ${sanitize(studentName)} demonstrated deficits in ${editableSpan('staarDeficits', fill(section.staarDeficits, 'Student Essential Outcome or TEKS'), 'academic', index)}.</p>`);
            htmlParts.push(`<p>Baseline data shows that ${sanitize(studentName)} performs at ${editableSpan('readingFluency', fill(section.readingFluency, 'score/percentile'), 'academic', index)} in reading fluency, ${editableSpan('readingComprehension', fill(section.readingComprehension, 'score/percentile'), 'academic', index)} in reading comprehension, and ${editableSpan('mathProblemSolving', fill(section.mathProblemSolving, 'score/percentile'), 'academic', index)} in math problem-solving.</p>`);
            htmlParts.push(`<p>In the classroom setting, ${sanitize(studentName)} is able to ${editableSpan('classroomStrengths', fill(section.classroomStrengths, 'strengths'), 'academic', index)}. However, ${fillPronoun(data.studentName, 'he/she')} demonstrates deficits in the classroom in ${editableSpan('classroomDeficits', fill(section.classroomDeficits, 'needs—aligned with STAAR weak areas'), 'academic', index)}, as evidenced by ${editableSpan('deficitsEvidence', fill(section.deficitsEvidence, 'work samples, CBM, rubrics'), 'academic', index)}.</p>`);
            htmlParts.push(`<p>Critical areas of need remain ${editableSpan('criticalNeeds', fill(section.criticalNeeds, 'area'), 'academic', index)}, which affect independent access to the grade-level curriculum.</p>`);
        });

        htmlParts.push(`<strong>Functional</strong>`);
        htmlParts.push(`<p>According to ${editableSpan('functionalDataSource', fill(data.functionalDataSource, 'teacher information, observation, etc.'))}, ${sanitize(studentName)} has strengths in ${editableSpan('functionalStrengths', fill(data.functionalStrengths, 'functional strengths'))}. However, according to the same sources, ${sanitize(studentName)} has deficits in ${editableSpan('functionalDeficits', fill(data.functionalDeficits, 'functional deficits and data'))}. At this time, these functional deficits are negatively impacting ${sanitize(fillPossessive(data.studentName, studentName))} rate of progress by ${editableSpan('functionalImpact', fill(data.functionalImpact, 'describe impact'))}.</p>`);

        htmlParts.push(`<strong>Transition (Secondary)</strong>`);
        htmlParts.push(`<p>According to teacher survey and classroom observation, ${sanitize(studentName)} was relatively proficient in ${editableSpan('transitionStrengths', fill(data.transitionStrengths, 'strengths - Life Skills, Community experiences, etc.'))}. In order to progress in independent living, employment, post-secondary educational training, and community experiences ${sanitize(studentName)} will need support in ${editableSpan('transitionSupportNeeds', fill(data.transitionSupportNeeds, 'support areas'))}.</p>`);
        htmlParts.push(`<p>${sanitize(studentName)} would like to work in the ${editableSpan('transitionEmploymentGoal', fill(data.transitionEmploymentGoal, 'area of employment'))} after high school.</p>`);
        htmlParts.push(`<p>${editableSpan('parentName', parentName)} plans for him/her to work ${editableSpan('parentEmploymentPlan', fill(data.parentEmploymentPlan, 'full or part'))} time when he/she graduates. ${editableSpan('parentName', parentName)} would like to see ${sanitize(studentName)} work in ${editableSpan('parentEmploymentGoal', fill(data.parentEmploymentGoal, 'employment area'))} industry after their educational career. ${editableSpan('parentName', parentName)} is planning for ${sanitize(studentName)} to live ${editableSpan('parentLivingPlan', fill(data.parentLivingPlan, 'with a friend / independently / at home'))} after educational career.</p>`);

        if (data.performanceSummarySections.length > 0) {
            htmlParts.push(`<strong>Summary of Performance</strong>`);
            data.performanceSummarySections.forEach((section, index) => {
                htmlParts.push(`<p>${sanitize(studentName)} ${editableSpan('passedStateAssessment', fill(section.passedStateAssessment, 'passed/did not pass'), 'summary', index)} the ${editableSpan('subject', fill(section.subject, 'subject'), 'summary', index)} state assessment with a performance of ${editableSpan('taksScore', fill(section.taksScore, 'TAKS score'), 'summary', index)}, obtaining a raw score of ${editableSpan('rawScore', fill(section.rawScore, 'raw score'), 'summary', index)} which was ${editableSpan('percentCorrect', fill(section.percentCorrect, '% correct'), 'summary', index)} correct. ${sanitize(studentName)} is currently making or made a ${editableSpan('gradeInSubject', fill(section.gradeInSubject, 'grade in subject'), 'summary', index)}. ${sanitize(studentName)} requires accommodations/modifications/assistive technology of ${editableSpan('accommodations', fill(section.accommodations, 'accommodations/assist tech'), 'summary', index)} due to his/her disability and ${editableSpan('needs', fill(section.needs, 'needs'), 'summary', index)}. ${sanitize(fillPronoun(data.studentName, 'He/She'))} ${editableSpan('receivesSpecialEdSupport', fill(section.receivesSpecialEdSupport, 'receives/does not receive'), 'summary', index)} special education support in ${editableSpan('subject', section.subject, 'summary', index)}. In ${editableSpan('subject', fill(section.subject, 'subject'), 'summary', index)} ${sanitize(studentName)} exhibits skills of ${editableSpan('strengths', fill(section.strengths, 'PLAAFP strengths for subject'), 'summary', index)}.</p>`);
            });
        }

        return htmlParts.join('');
    }, []);

    const html = generatePreviewHtml(data);

    useEffect(() => {
        if (previewRef.current && html !== previewRef.current.innerHTML) {
            previewRef.current.innerHTML = html;
        }
    }, [html]);
    
    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        if (onEdit && e.currentTarget.innerHTML !== html) {
            onEdit(e.currentTarget.innerHTML);
        }
    };

    return (
        <div
            ref={previewRef}
            className="preview-content"
            contentEditable
            suppressContentEditableWarning={true}
            onBlur={handleBlur}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};


const root = createRoot(document.getElementById('root')!);
root.render(<App />);
