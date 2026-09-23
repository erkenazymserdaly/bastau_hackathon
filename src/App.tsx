import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  HeartPulse,
  Info,
  Mic,
  RotateCcw,
  ShieldCheck,
  Siren,
  Sparkles,
  Stethoscope,
  Video,
  Volume2,
  X,
} from 'lucide-react';

type Step = 'welcome' | 'face' | 'arms' | 'speech' | 'results';
type Result = 'clear' | 'warning';

type TestResults = {
  face: Result;
  arms: Result;
  speech: Result;
};

const initialResults: TestResults = {
  face: 'clear',
  arms: 'clear',
  speech: 'clear',
};

const stepOrder: Exclude<Step, 'welcome' | 'results'>[] = ['face', 'arms', 'speech'];

const stepContent = {
  face: {
    letter: 'F',
    label: 'Face',
    instruction: 'Smile naturally and look at the camera.',
    detail: 'Keep your face centered in the frame. The live camera is for positioning only; this prototype does not assess your actual face.',
    analyze: 'Analyze Face',
    clear: 'No obvious asymmetry detected',
    warning: 'Possible facial asymmetry detected',
  },
  arms: {
    letter: 'A',
    label: 'Arms',
    instruction: 'Raise both arms and hold them for 10 seconds.',
    detail: 'Sit or stand safely, keep both arms in view, and hold them steady.',
    analyze: 'Analyze Arms',
    clear: 'Both arms appear steady',
    warning: 'Possible arm drift detected',
  },
  speech: {
    letter: 'S',
    label: 'Speech',
    instruction: 'Repeat this phrase clearly:',
    detail: 'Speak at a natural pace. This prototype uses a simulated analysis.',
    analyze: 'Analyze Speech',
    clear: 'Speech appears clear',
    warning: 'Possible speech difficulty detected',
  },
};

function App() {
  const [step, setStep] = useState<Step>('welcome');
  const [results, setResults] = useState<TestResults>(initialResults);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [cameraMessage, setCameraMessage] = useState('Camera preview is ready when you are.');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const currentStepIndex = stepOrder.indexOf(step as Exclude<Step, 'welcome' | 'results'>);
  const activeContent = step !== 'welcome' && step !== 'results' ? stepContent[step] : null;

  useEffect(() => {
    return () => streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    if (!isRecording) return;
    const interval = window.setInterval(() => setRecordingSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(interval);
  }, [isRecording]);

  async function requestCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraMessage('Live camera preview is not available here. You can continue with the prototype check.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraMessage('Live preview is on — positioning only.');
    } catch {
      setCameraMessage('Camera access was skipped. You can still try the prototype analysis.');
    }
  }

  function startTest() {
    setResults(initialResults);
    setHasAnalyzed(false);
    setStep('face');
    void requestCamera();
  }

  function analyzeCurrentStep() {
    if (!activeContent) return;
    setIsAnalyzing(true);
    window.setTimeout(() => {
      const result: Result = step === 'face' ? 'clear' : (Math.random() > 0.45 ? 'clear' : 'warning');
      setResults((previous) => ({ ...previous, [step]: result } as TestResults));
      setHasAnalyzed(true);
      setIsAnalyzing(false);
    }, 900);
  }

  function goNext() {
    const nextStep = stepOrder[currentStepIndex + 1];
    if (nextStep) {
      setStep(nextStep);
      setHasAnalyzed(false);
      setIsRecording(false);
      setRecordingSeconds(0);
      if (nextStep !== 'speech') void requestCamera();
    } else {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setStep('results');
    }
  }

  function toggleRecording() {
    setIsRecording((recording) => !recording);
    if (!isRecording) setRecordingSeconds(0);
  }

  function restart() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setStep('welcome');
    setResults(initialResults);
    setHasAnalyzed(false);
    setIsRecording(false);
    setRecordingSeconds(0);
  }

  const warningDetected = Object.values(results).some((result) => result === 'warning');

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="topbar">
        <button className="brand" onClick={restart} aria-label="Return to FAST AI welcome screen">
          <span className="brand-mark"><HeartPulse size={18} strokeWidth={2.5} /></span>
          <span>FAST <strong>AI</strong></span>
        </button>
        {step !== 'welcome' && <div className="prototype-pill"><Sparkles size={14} /> Prototype</div>}
      </header>

      <div className="page-wrap">
        {step === 'welcome' && (
          <section className="welcome-screen fade-in">
            <div className="welcome-copy">
              <div className="eyebrow"><span className="eyebrow-line" /> AI-assisted health check</div>
              <h1>A little check.<br /><em>A lot of care.</em></h1>
              <p className="hero-text">A quick AI-assisted check for possible stroke warning signs.</p>
              <div className="trust-row"><span><ShieldCheck size={17} /> Private by design</span><span><Clock3 size={17} /> Takes about 2 min</span></div>
              <button className="primary-button hero-button" onClick={startTest}>Start FAST Test <ArrowRight size={19} /></button>
              <div className="disclaimer"><Info size={16} /><span>This prototype does not provide a medical diagnosis.</span></div>
            </div>
            <div className="hero-mascot-wrap">
              <div className="halo" />
              <div className="welcome-bubble">Hi there. I’ll guide<br />you through this.</div>
              <img className="mascot hero-mascot" src="/assets/images/медведь.jpeg" alt="FAST AI bear doctor mascot" />
              <div className="mascot-caption"><span className="status-dot" /> Your friendly FAST guide</div>
            </div>
          </section>
        )}

        {activeContent && (
          <section className="test-screen fade-in">
            <div className="progress-header">
              <button className="back-button" onClick={() => setStep(currentStepIndex === 0 ? 'welcome' : stepOrder[currentStepIndex - 1])}><ArrowLeft size={17} /> Back</button>
              <div className="step-count">Step {currentStepIndex + 1} <span>of 3</span></div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${((currentStepIndex + 1) / 3) * 100}%` }} /></div>
            </div>
            <div className="test-grid">
              <div className="instruction-panel">
                <div className="section-kicker"><span className="letter-badge">{activeContent.letter}</span><span>{activeContent.label}</span></div>
                <h2>{activeContent.instruction}</h2>
                {step === 'speech' && <div className="phrase-card"><Volume2 size={19} /><span>“Today is a beautiful day.”</span></div>}
                <p className="instruction-detail">{activeContent.detail}</p>
                <div className="guide-row">
                  <img className="mascot step-mascot" src="/assets/images/медведь.jpeg" alt="Bear doctor demonstrating the FAST test" />
                  <div><strong>You’ve got this.</strong><span>Follow along at your own pace.</span></div>
                </div>
              </div>
              <div className="action-panel">
                {step !== 'speech' ? (
                  <div className="camera-box">
                    <video ref={videoRef} autoPlay muted playsInline className="camera-video" />
                    {!cameraMessage.includes('on') && <div className="camera-placeholder"><Video size={30} /><span>Camera view</span></div>}
                    <div className="camera-corner corner-tl" /><div className="camera-corner corner-tr" /><div className="camera-corner corner-bl" /><div className="camera-corner corner-br" />
                    <div className="camera-status"><span className="status-dot" /> {step === 'face' ? 'Preview only — not assessing symmetry.' : cameraMessage}</div>
                  </div>
                ) : (
                  <div className={`record-box ${isRecording ? 'recording' : ''}`}>
                    <div className="mic-orb"><Mic size={32} /></div>
                    <div className="record-title">{isRecording ? 'Listening…' : 'Ready when you are'}</div>
                    <div className="record-subtitle">{isRecording ? `Recording 00:${String(recordingSeconds).padStart(2, '0')}` : 'Tap the button and repeat the phrase'}</div>
                    <button className="record-button" onClick={toggleRecording} aria-label={isRecording ? 'Stop recording' : 'Start recording'}>{isRecording ? <span className="stop-square" /> : <Mic size={22} />}</button>
                    <div className="sound-bars">{[1, 2, 3, 4, 5, 6, 7].map((bar) => <span key={bar} style={{ animationDelay: `${bar * 0.08}s` }} />)}</div>
                  </div>
                )}
                {!hasAnalyzed ? (
                  <button className="primary-button full-button" onClick={analyzeCurrentStep} disabled={isAnalyzing}>{isAnalyzing ? <><span className="spinner" /> Checking…</> : <>{activeContent.analyze} <ArrowRight size={18} /></>}</button>
                ) : (
                  <div className={`result-banner ${results[step as keyof TestResults] === 'warning' ? 'warning' : 'clear'}`}><span className="result-icon">{results[step as keyof TestResults] === 'warning' ? <Info size={17} /> : <Check size={17} />}</span><span>{results[step as keyof TestResults] === 'warning' ? activeContent.warning : activeContent.clear}</span></div>
                )}
                {hasAnalyzed && <button className="primary-button full-button" onClick={goNext}>{currentStepIndex === 2 ? 'See Results' : `Next: ${stepOrder[currentStepIndex + 1] === 'arms' ? 'Arms' : 'Speech'}`} <ArrowRight size={18} /></button>}
                <p className="simulation-note"><Sparkles size={14} /> Prototype analysis — camera positioning only, not a medical diagnosis</p>
              </div>
            </div>
          </section>
        )}

        {step === 'results' && (
          <section className="results-screen fade-in">
            <div className="results-hero">
              <div className="result-mascot-ring"><img className="mascot results-mascot" src="/assets/images/медведь.jpeg" alt="Bear doctor mascot" /><div className="mascot-sparkle sparkle-one"><Sparkles size={15} /></div><div className="mascot-sparkle sparkle-two"><HeartPulse size={15} /></div></div>
              <div className="eyebrow centered"><span className="eyebrow-line" /> Your FAST check <span className="eyebrow-line" /></div>
              <h1>{warningDetected ? 'Let’s take this seriously.' : 'Your check is complete.'}</h1>
              <p>{warningDetected ? 'Possible warning signs detected' : 'No obvious warning signs detected by this prototype.'}</p>
            </div>
            <div className="result-cards">{stepOrder.map((testStep) => { const content = stepContent[testStep]; const hasWarning = results[testStep] === 'warning'; return <div className="result-card" key={testStep}><div className={`result-card-icon ${hasWarning ? 'warning-bg' : ''}`}>{hasWarning ? <Info size={18} /> : <Check size={18} />}</div><div className="result-card-copy"><div><span className="result-letter">{content.letter}</span><strong>{content.label}</strong></div><span>{hasWarning ? content.warning : content.clear}</span></div><div className={`result-tag ${hasWarning ? 'warning-tag' : ''}`}>{hasWarning ? 'Review' : 'Clear'}</div></div> })}</div>
            <div className={`emergency-card ${warningDetected ? 'emergency' : 'reassuring'}`}><div className="emergency-icon">{warningDetected ? <Siren size={23} /> : <ShieldCheck size={23} />}</div><div><h3>{warningDetected ? 'Seek emergency medical assistance immediately.' : 'Please continue to listen to your body.'}</h3><p>{warningDetected ? 'This prototype cannot diagnose a stroke. If you or someone nearby has sudden symptoms that may indicate a stroke, seek emergency medical assistance immediately.' : 'This does not rule out a medical emergency. If symptoms are sudden or concerning, seek medical help.'}</p></div></div>
            <button className="secondary-button" onClick={restart}><RotateCcw size={17} /> Restart FAST Test</button>
          </section>
        )}
      </div>
      <footer className="footer"><Stethoscope size={15} /> FAST AI is a friendly prototype for early awareness. <button onClick={() => setStep('welcome')}><X size={13} /></button></footer>
    </main>
  );
}

export default App;
