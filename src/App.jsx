import React, { useState, useEffect, createContext, useContext } from 'react';
import { ChevronRight, ChevronLeft, Check, AlertCircle, Target, Calendar, Users, Brain, Clock, Zap, Shield, BarChart3, Sparkles, ArrowRight, BookOpen, ShieldCheck, ChevronDown, ChevronUp, X, Download, Loader2, Quote, ListTodo, Grid, Plus, RotateCcw, CheckCircle2, Mail, Phone } from 'lucide-react';
import { CONFIG } from './config.js';
import { submitPlaybookEmail, submitDiagnosticResults, submitToMailchimp } from './utils/sheets.js';
import { downloadDiagnosticPDF } from './utils/pdf.js';

// ─── DATA ──────────────────────────────────────────────────────
const efClusters = [
  {
    name: "Inhibition & Regulation",
    capacities: [
      { id: "response_inhibition", name: "Response Inhibition", question: "I can stop myself from acting on impulse, even when I really want to do something.", lowLabel: "I act before thinking", highLabel: "I pause and choose" },
      { id: "emotional_regulation", name: "Emotional Regulation", question: "I can manage my emotions so they don't derail my work or decisions.", lowLabel: "Emotions overwhelm me", highLabel: "I stay steady" },
      { id: "sustained_attention", name: "Sustained Attention", question: "I can maintain focus on a task until it's done, without drifting to other things.", lowLabel: "I constantly drift", highLabel: "I stay locked in" }
    ]
  },
  {
    name: "Initiation & Persistence",
    capacities: [
      { id: "task_initiation", name: "Task Initiation", question: "I can start tasks when I intend to, without needing external pressure or deadlines.", lowLabel: "I wait until last minute", highLabel: "I start when planned" },
      { id: "goal_persistence", name: "Goal-Directed Persistence", question: "I follow through on long-term goals even when motivation fades or obstacles appear.", lowLabel: "I abandon goals", highLabel: "I persist through difficulty" }
    ]
  },
  {
    name: "Planning & Organization",
    capacities: [
      { id: "planning", name: "Planning & Prioritization", question: "I can create realistic plans and identify what's most important to do first.", lowLabel: "I wing it", highLabel: "I plan systematically" },
      { id: "organization", name: "Organization", question: "I keep my materials, information, and commitments organized and accessible.", lowLabel: "Everything is scattered", highLabel: "I have reliable systems" },
      { id: "time_awareness", name: "Time Awareness", question: "I accurately estimate how long things take and manage my time accordingly.", lowLabel: "Time slips away", highLabel: "I track time well" }
    ]
  },
  {
    name: "Flexibility & Metacognition",
    capacities: [
      { id: "working_memory", name: "Working Memory", question: "I can hold multiple pieces of information in mind while working with them.", lowLabel: "I forget mid-task", highLabel: "I hold it all" },
      { id: "cognitive_flexibility", name: "Cognitive Flexibility", question: "I can shift strategies when something isn't working and adapt to changes.", lowLabel: "I get stuck", highLabel: "I adapt easily" },
      { id: "metacognition", name: "Metacognition", question: "I can observe my own thinking patterns and adjust my approach accordingly.", lowLabel: "I don't notice patterns", highLabel: "I self-correct" }
    ]
  }
];

const interventions = {
  response_inhibition: {
    training: [
      { id: "ri_implementation", text: "I have a pre-decided plan for impulse moments — 'When I feel the urge to X, I will do Y instead'" },
      { id: "ri_mindfulness", text: "I practice deliberate pausing — noticing an urge before acting on it" }
    ],
    environment: [
      { id: "ri_sleep", text: "I get consistent sleep (7–9 hours, same wake time daily)" },
      { id: "ri_friction", text: "I've made temptations harder to reach — apps deleted, phone in another room, distractions physically removed" }
    ],
    accountability: [
      { id: "ri_blocker", text: "Someone else manages my screen time limits or app restrictions" },
      { id: "ri_body_double", text: "I work with other people in the room so I'm less likely to go off track" }
    ]
  },
  emotional_regulation: {
    training: [
      { id: "er_reappraisal", text: "I reframe stressful situations before reacting — asking 'what else could this mean?' rather than going with my first emotional read" },
      { id: "er_labeling", text: "I name my emotions precisely — 'frustrated' or 'overwhelmed,' not just 'stressed'" }
    ],
    environment: [
      { id: "er_sleep", text: "I get consistent sleep (7–9 hours, same wake time daily)" },
      { id: "er_exercise", text: "I exercise at least 3 times per week" }
    ],
    accountability: [
      { id: "er_checkin", text: "I have regular check-ins with someone I trust about how I'm doing emotionally" },
      { id: "er_therapist", text: "I work with a therapist or counselor" }
    ]
  },
  sustained_attention: {
    training: [
      { id: "sa_meditation", text: "I practice focused-attention meditation — even 10 minutes a day trains the ability to hold focus" },
      { id: "sa_pomodoro", text: "I work in timed blocks with scheduled breaks (e.g., 25 or 50 minutes on, then rest)" }
    ],
    environment: [
      { id: "sa_one_tab", text: "During focused work, I limit myself to one tab, one app, one task at a time" },
      { id: "sa_nature", text: "I take 20-minute breaks outdoors or in green space — nature restores the ability to concentrate" }
    ],
    accountability: [
      { id: "sa_body_double", text: "I work alongside other people (library, study partner, co-working) to stay on task" },
      { id: "sa_timer", text: "I use a visible timer and tell someone how many focused blocks I completed" }
    ]
  },
  task_initiation: {
    training: [
      { id: "ti_implementation", text: "I pre-commit to exactly when and where I'll start — 'At 9am at my desk, I will open the document'" },
      { id: "ti_temptation_bundle", text: "I pair dreaded tasks with something I enjoy — a favorite playlist, a good drink, a comfortable spot" }
    ],
    environment: [
      { id: "ti_activation", text: "I make starting as easy as possible — materials already out, browser tab already open, zero setup needed" },
      { id: "ti_trigger", text: "I have a consistent start ritual — same place, same time, same first action" }
    ],
    accountability: [
      { id: "ti_start_time", text: "I tell someone else exactly when I'm going to start, and they expect to hear from me" },
      { id: "ti_daily_call", text: "I have a daily planning call or check-in that creates a real start time" }
    ]
  },
  goal_persistence: {
    training: [
      { id: "gp_woop", text: "I picture the outcome I want, then immediately picture what's most likely to get in the way — this combination works better than positive thinking alone" },
      { id: "gp_process", text: "I set goals around actions I control ('write for 30 minutes') rather than outcomes I can't ('get an A')" }
    ],
    environment: [
      { id: "gp_visible", text: "I track progress somewhere visible — a streak chart, a whiteboard, a checklist I can see daily" },
      { id: "gp_milestones", text: "I've broken big goals into smaller milestones with their own deadlines" }
    ],
    accountability: [
      { id: "gp_commitment", text: "I've made a commitment with real stakes — someone who follows up, a public promise, something I'd lose" },
      { id: "gp_coach", text: "I check in regularly with someone who asks what I committed to and whether I did it" }
    ]
  },
  planning: {
    training: [
      { id: "pl_premortem", text: "Before starting a plan, I ask: 'Imagine this has already failed — what went wrong?' This catches blind spots normal planning misses" },
      { id: "pl_multiplier", text: "I multiply my first time estimate by 1.5–2x — people almost always underestimate how long things take" }
    ],
    environment: [
      { id: "pl_calendar", text: "I use a calendar with time-blocks, not just a to-do list — tasks get a specific slot or they don't happen" },
      { id: "pl_daily", text: "I spend 5–10 minutes each morning reviewing what's ahead and deciding what matters most today" }
    ],
    accountability: [
      { id: "pl_review", text: "Someone reviews my plans with me — not just what I intend to do, but whether the time math works" },
      { id: "pl_weekly", text: "I do a weekly review with another person: what got done, what didn't, what to adjust" }
    ]
  },
  organization: {
    training: [
      { id: "or_reset", text: "I do an end-of-day reset: clear the desk, process the inbox, close open loops" },
      { id: "or_one_touch", text: "I handle things once — decide on the spot rather than moving them to a different pile" }
    ],
    environment: [
      { id: "or_single_inbox", text: "I have one single place where all new tasks, ideas, and info get captured" },
      { id: "or_taxonomy", text: "I have a filing system I actually use — consistent folders, consistent names" }
    ],
    accountability: [
      { id: "or_audit", text: "Someone periodically looks at my systems with me and helps me clean them up" },
      { id: "or_checkin", text: "I report on whether my systems are actually being maintained, not just whether they exist" }
    ]
  },
  time_awareness: {
    training: [
      { id: "ta_estimate", text: "Before starting a task, I guess how long it will take — then I time it and compare. This calibrates my internal clock" },
      { id: "ta_track", text: "I track where my time actually goes each day, even roughly — most people are shocked by the gap between perception and reality" }
    ],
    environment: [
      { id: "ta_visible_time", text: "I keep visible clocks and timers in my workspace so time doesn't become invisible" },
      { id: "ta_buffer", text: "I schedule buffer time between commitments rather than stacking everything back-to-back" }
    ],
    accountability: [
      { id: "ta_shared_cal", text: "I share my calendar with someone who can see how packed it actually is" },
      { id: "ta_deadline", text: "I tell someone else my deadlines and time estimates so I can't quietly ignore them" }
    ]
  },
  working_memory: {
    training: [
      { id: "wm_external", text: "I write things down immediately — if it's in my head, it's at risk. If it's on paper, it's safe" },
      { id: "wm_chunking", text: "I group related information into clusters rather than trying to remember individual pieces" }
    ],
    environment: [
      { id: "wm_singletask", text: "I keep only one task visible at a time — one app, one document, one thing" },
      { id: "wm_whiteboard", text: "I use a whiteboard or visible dashboard so active priorities aren't buried in my head" }
    ],
    accountability: [
      { id: "wm_retrieval", text: "I test myself on what I'm supposed to remember rather than just re-reading it — recall beats review" },
      { id: "wm_checkin", text: "I regularly talk through what's on my plate with someone, so nothing slips through the cracks" }
    ]
  },
  cognitive_flexibility: {
    training: [
      { id: "cf_interleave", text: "I mix up types of practice rather than grinding one thing — alternating between different problems builds adaptability" },
      { id: "cf_opposite", text: "I argue the opposite side of my own position before committing to it" }
    ],
    environment: [
      { id: "cf_rotate", text: "I change my setting or approach periodically — same routine too long creates rigidity" },
      { id: "cf_novelty", text: "I deliberately seek out unfamiliar perspectives — new people, different fields, methods I haven't tried" }
    ],
    accountability: [
      { id: "cf_cross", text: "I get feedback from people outside my usual world" },
      { id: "cf_challenge", text: "I have someone who will push back on my thinking, not just agree with me" }
    ]
  },
  metacognition: {
    training: [
      { id: "mc_calibration", text: "Before a task, I predict how I'll do — then I compare the prediction to what actually happened. This builds self-awareness fast" },
      { id: "mc_reflection", text: "I do a brief daily review: what worked, what didn't, what I'd do differently" }
    ],
    environment: [
      { id: "mc_journal", text: "I use a structured template for reflection — not freeform journaling, but specific prompts that force honest answers" },
      { id: "mc_data", text: "I keep a simple log of what I committed to vs. what I completed — the pattern tells me more than any single day" }
    ],
    accountability: [
      { id: "mc_debrief", text: "I debrief regularly with someone who asks hard questions about my process, not just my results" },
      { id: "mc_feedback", text: "I ask people who will be honest to tell me what I'm not seeing about myself" }
    ]
  }
};

const capacityIcons = {
  response_inhibition: Shield, emotional_regulation: Sparkles, sustained_attention: Target,
  task_initiation: Zap, goal_persistence: BarChart3, planning: Calendar, organization: Check,
  time_awareness: Clock, working_memory: Brain, cognitive_flexibility: ArrowRight, metacognition: Users
};

const faqData = {
  parent: [
    { q: "How is this different from an ADHD coach?", a: "Most ADHD coaches focus on one lever: training your child to build better habits. That's necessary, but often insufficient. The Execution System also installs environment design (changing what surrounds your child) and external accountability infrastructure (daily EA calls, weekly coaching). We diagnose which levers are missing and install all of them — not just the one most coaches rely on." },
    { q: "Does this replace therapy?", a: "No. We sit underneath therapy, tutoring, and productivity tools — we make them work. If your child is in therapy for anxiety, we ensure the structural breakdowns that feed that anxiety (missed deadlines, chaotic mornings, chronic overcommitment) are addressed. We don't do emotional processing. We do execution infrastructure." },
    { q: "What if my child refuses to participate?", a: "This is a real risk, and we screen for it. During the diagnostic call, we assess whether your child has minimum buy-in — they don't need to be enthusiastic, but they need to not be actively hostile. If the fit isn't right, we'll tell you. We'd rather turn away a client than take money for a system that can't work." },
    { q: "What does the Executive Assistant actually do?", a: "Your child's EA conducts a 10-minute daily planning call: reviewing today's calendar, confirming start times for key tasks, identifying friction points, and logging completion from yesterday. They also send reminders, remove logistical friction (booking study rooms, printing materials), and feed data to the weekly coach. Think of them as the scaffolding that makes the calendar real." },
    { q: "What happens over summer or school breaks?", a: "The system adapts. Summer structure looks different — fewer academic commitments, more project and habit goals — but the accountability architecture stays. Many families find summer is when the system is most valuable, because the external structure school provides disappears." },
    { q: "How long do clients typically stay?", a: "The minimum commitment for Tier 2 is three months. Most families stay 6–12 months. The goal is to build enough internal capacity and environmental design that the accountability layer becomes less necessary. We want to make ourselves obsolete." }
  ],
  student: [
    { q: "How is this different from an ADHD coach?", a: "Most coaches focus on one lever: training you to build better habits. That's necessary but often insufficient. The Execution System also installs environment design (changing what's around you) and external accountability (daily EA calls, weekly coaching). We diagnose which levers are missing and install all of them." },
    { q: "Does this replace therapy?", a: "No. We sit underneath therapy, tutoring, and productivity tools — we make them work. If you're dealing with anxiety, we address the structural breakdowns that feed it: missed deadlines, chaotic mornings, chronic overcommitment. We don't do emotional processing. We do execution infrastructure." },
    { q: "This sounds like someone micromanaging me.", a: "It's the opposite. Right now, someone is already managing you — your parents, your anxiety, your last-minute panic. The system replaces that with a professional structure you control. You set the goals. The EA helps you execute them. The coach helps you learn from what breaks. The goal is to build your capacity until you don't need us." },
    { q: "What does the Executive Assistant actually do?", a: "A 10-minute daily call: review today's calendar, confirm start times, identify friction points, log what you completed yesterday. They also send reminders and handle logistics. Think of them as the scaffolding that makes your calendar real — not someone checking up on you, but someone holding the structure so you can focus on the work." },
    { q: "How long do people typically stay?", a: "Minimum commitment is three months for Tier 2. Most people stay 6–12 months. The goal is to build enough internal capacity and environmental design that the accountability layer becomes less necessary. We want to make ourselves obsolete." }
  ]
};

const scenarios = [
  { label: "Composite scenario based on multiple Tier 2 clients", summary: "High school junior, diagnosed ADHD. Parents had tried tutoring, a planner app, and weekly therapy. All helped with symptoms but nothing addressed the daily execution gap. Within three weeks of the system, task initiation improved markedly. The daily EA calls were the primary driver — homework started before parents asked.", outcome: "Task initiation moved from 2/10 to 7/10 in six weeks" },
  { label: "Composite scenario based on multiple Tier 2 clients", summary: "College sophomore, engineering major. No clinical diagnosis — just chronic procrastination and a widening gap between capability and output. The weekly coach identified a pattern: every missed deadline traced back to the same failure mode (overcommitment without time-awareness). After recalibrating load and installing daily planning calls, completion rate climbed from roughly 40% to 85% of weekly commitments.", outcome: "Commitment completion rate: ~40% → 85% in two months" },
  { label: "Composite scenario based on multiple parent experiences", summary: "Parent of 10th grader. The biggest shift wasn't academic — it was relational. Monthly reports replaced the daily cycle of texting, reminding, and arguing about assignments. The parent went from functioning as the accountability system to simply reading a PDF. Student's execution improved. The relationship improved more.", outcome: "Parent-student conflict reduced substantially; GPA up 0.6 points" }
];

// ─── HELPERS ───────────────────────────────────────────────────
const openCalendly = () => window.open(CONFIG.calendlyUrl, '_blank');
const serif = "'Playfair Display', Georgia, serif";
const sans = "'DM Sans', system-ui, sans-serif";

// ═══════════════════════════════════════════════════════════════
//  SHARED CONTEXT — all state flows through here
// ═══════════════════════════════════════════════════════════════
const AppContext = createContext();

// ─── Stateless FAQ Item ──────────────────────────────────────
function FaqItem({ q, a, isOpen, onClick }) {
  return (
    <div className="border border-slate-800 rounded-sm overflow-hidden bg-slate-950 mb-4">
      <button onClick={onClick} className="w-full px-6 py-4 flex justify-between items-center hover:bg-slate-900 transition-colors text-left">
        <span className="font-serif font-semibold text-white text-lg pr-4">{q}</span>
        {isOpen ? <ChevronUp className="w-5 h-5 text-amber-500 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0" />}
      </button>
      {isOpen && (
        <div className="px-6 py-5 bg-slate-900 text-slate-300 font-light leading-relaxed border-t border-slate-800 text-sm">
          {a}
        </div>
      )}
    </div>
  );
}

// ─── Playbook Modal ──────────────────────────────────────────
function PlaybookModal() {
  const { playbookSubmitted, playbookEmail, setPlaybookEmail, handlePlaybookSubmit, playbookSubmitting, setShowPlaybookModal, setPlaybookSubmitted } = useContext(AppContext);
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowPlaybookModal(false); setPlaybookSubmitted(false); }}>
      <div className="bg-slate-900 border border-slate-700 rounded-sm max-w-md w-full p-8 relative shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={() => { setShowPlaybookModal(false); setPlaybookSubmitted(false); }} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        <div className="text-center mb-6">
          <BookOpen className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-serif font-semibold text-white">The Execution Playbook</h3>
          <p className="text-slate-400 text-sm mt-1">Chapters One & Two — free, no obligation</p>
        </div>
        {playbookSubmitted ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <p className="text-white font-semibold mb-3">Your playbook is ready</p>
            <a href="/Execution-Playbook.pdf" download="Execution-Playbook.pdf"
              className="inline-flex items-center gap-2 bg-white text-slate-950 px-6 py-3 rounded-sm font-medium hover:bg-slate-200 transition-colors text-sm">
              <Download className="w-4 h-4" /> Download PDF
            </a>
            <p className="text-slate-500 text-xs mt-3">A copy has also been sent to {playbookEmail}</p>
          </div>
        ) : (
          <>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 text-center">
              Why motivation fails. Why planners don't stick. How the three-lever model works. Enter your email to download instantly.
            </p>
            <input type="email" placeholder="Your email address" value={playbookEmail} onChange={e => setPlaybookEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePlaybookSubmit()}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 mb-3 text-sm" />
            <button onClick={handlePlaybookSubmit} disabled={playbookSubmitting || !playbookEmail.includes('@')}
              className="w-full bg-white text-slate-950 py-3 rounded-sm font-medium hover:bg-slate-200 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {playbookSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing...</> : <><Download className="w-4 h-4" /> Get the Playbook</>}
            </button>
            <p className="text-xs text-slate-600 text-center mt-3">No spam. Unsubscribe anytime.</p>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  LANDING PAGE
// ═══════════════════════════════════════════════════════════════
function LandingPage() {
  const { setCurrentView, setShowPlaybookModal, showPlaybookModal, openFaq, setOpenFaq } = useContext(AppContext);
  
  // --- DEMO STATE ---
  const [activePage, setActivePage] = useState('home');
  const [demoStep, setDemoStep] = useState(1);
  const [newTaskText, setNewTaskText] = useState("");
  const [demoTasks, setDemoTasks] = useState([
    { id: 1, text: "Draft 2 pages for History essay", quad: null },
    { id: 2, text: "Email Mr. Davis about extension", quad: null },
    { id: 3, text: "Research summer programs", quad: null },
    { id: 4, text: "Scroll TikTok / watch YouTube", quad: null },
  ]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [activePage]);

  // Demo handlers
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setDemoTasks([...demoTasks, { id: Date.now(), text: newTaskText, quad: null }]);
    setNewTaskText("");
  };
  const handleAssignQuad = (quadId) => {
    if (!selectedTaskId) return;
    setDemoTasks(demoTasks.map(t => t.id === selectedTaskId ? { ...t, quad: quadId } : t));
    setSelectedTaskId(null);
  };
  const unassignedTasks = demoTasks.filter(t => t.quad === null);
  const allAssigned = demoTasks.length > 0 && unassignedTasks.length === 0;
  const getTasksByQuad = (quadId) => demoTasks.filter(t => t.quad === quadId);

  // Helper arrow icon for the matrix overlay
  const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
  );

  // ── PRICING PAGE ──
  if (activePage === 'pricing') return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Nav */}
      <nav className={`fixed w-full z-50 transition-all duration-500 border-b ${isScrolled ? 'bg-slate-950/95 backdrop-blur-md border-slate-800 py-4' : 'bg-transparent border-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          <button onClick={() => setActivePage('home')} className="font-serif font-bold text-2xl text-white">Whetstone<span className="text-amber-500">.</span></button>
          <div className="hidden md:flex items-center p-1.5 bg-slate-900/80 border border-slate-700 rounded-full backdrop-blur-md">
            <button onClick={() => setActivePage('home')} className="px-6 py-2 rounded-full text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all">Overview</button>
            <button className="px-6 py-2 rounded-full text-sm font-semibold bg-amber-500 text-slate-950">Pricing</button>
            <button onClick={() => setActivePage('about')} className="px-6 py-2 rounded-full text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all">Contact</button>
          </div>
          <button onClick={() => setCurrentView('diagnostic')} className="bg-white hover:bg-slate-200 text-slate-950 px-6 py-2.5 text-sm font-bold rounded-sm hidden sm:block">Free Diagnostic</button>
        </div>
      </nav>

      <div className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12">

          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="font-serif text-4xl md:text-6xl font-semibold text-white mb-6">Service Tiers</h1>
            <p className="text-lg text-slate-300 font-light">The diagnostic recommends which tier fits. Most multi-lever cases need Tier 2. We take a limited number of new clients each month.</p>
          </div>

          {/* Two-Tier Pricing */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
            {/* Tier 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-sm p-8 flex flex-col">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Tier 1</div>
              <h3 className="font-serif text-2xl font-semibold text-white mb-2">Coached Execution</h3>
              <p className="text-slate-400 text-sm mb-6 font-light">Single-lever deficits, primarily accountability</p>
              <div className="text-4xl font-bold text-white mb-8">$750–900 <span className="text-lg text-slate-500 font-normal">/ month</span></div>
              <ul className="space-y-4 mb-8 flex-1 text-sm text-slate-300">
                {["Weekly 1:1 accountability coach", "Commitment protocol", "Weekly execution review", "Failure-mode identification"].map((item, i) => (
                  <li key={i} className="flex gap-3"><Check className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />{item}</li>
                ))}
              </ul>
              <button onClick={() => setCurrentView('diagnostic')} className="w-full py-3 bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors rounded-sm border border-slate-700">See If This Fits →</button>
            </div>

            {/* Tier 2 — Flagship */}
            <div className="bg-slate-800 border-2 border-amber-500/50 rounded-sm p-8 flex flex-col relative md:-translate-y-4 shadow-2xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500"></div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Tier 2 · Flagship</div>
              <h3 className="font-serif text-2xl font-semibold text-white mb-2">Full Execution System</h3>
              <p className="text-slate-300 text-sm mb-4 font-light">Multi-lever deficits requiring daily structure</p>
              <div className="text-4xl font-bold text-amber-500 mb-1">$1,500–2,000 <span className="text-lg text-slate-400 font-normal">/ month</span></div>
              <p className="text-slate-500 text-xs mb-8">3-month minimum · 30-day guarantee</p>
              <ul className="space-y-4 mb-8 flex-1 text-sm text-white">
                {[
                  "Everything in Tier 1",
                  "Dedicated Executive Assistant",
                  "Daily structure & time-blocking",
                  "EA friction removal & reminders",
                  "Completion logging",
                  "Monthly progress reporting",
                  "Formalized failure diagnostics",
                  "Full bonus package (Playbook, videos, reboot protocol)"
                ].map((item, i) => (
                  <li key={i} className="flex gap-3"><Check className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" /><span className={i === 0 ? 'font-semibold' : ''}>{item}</span></li>
                ))}
              </ul>
              <button onClick={() => setCurrentView('diagnostic')} className="w-full py-3 bg-white text-slate-950 font-bold hover:bg-slate-200 transition-colors rounded-sm">Take the Diagnostic →</button>
            </div>
          </div>

          {/* What This Replaces */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="text-center mb-10">
              <h2 className="font-serif text-3xl font-semibold text-white mb-4">What This Replaces</h2>
              <p className="text-slate-400 font-light">You may already be spending this much on tools and support that address symptoms, not structure.</p>
            </div>
            <div className="space-y-3">
              {[
                { item: "Executive function coach (1x/week)", cost: "$400–600/mo", note: "Included — plus formalized failure diagnostics" },
                { item: "Private tutor (2x/week)", cost: "$600–1,200/mo", note: "Often unnecessary once execution improves" },
                { item: "Productivity app subscriptions", cost: "$30–80/mo", note: "Apps fail without structure underneath" },
                { item: "Time lost to panic-mode catch-up", cost: "Hours/week", note: "Replaced by daily EA planning calls" },
              ].map((row, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-sm px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{row.item}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{row.note}</p>
                  </div>
                  <span className="text-rose-400 font-semibold text-sm whitespace-nowrap">{row.cost}</span>
                </div>
              ))}
              <div className="bg-slate-950 border border-amber-500/30 rounded-sm px-6 py-5 flex items-center justify-between gap-4 mt-4">
                <div>
                  <p className="text-white font-semibold">The Full Execution System</p>
                  <p className="text-slate-400 text-xs">One integrated system replacing piecemeal interventions</p>
                </div>
                <span className="text-amber-500 font-bold text-lg whitespace-nowrap">$1,750<span className="text-sm text-slate-500 font-normal">/mo avg</span></span>
              </div>
            </div>
          </div>

          {/* Guarantee */}
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-900/20 border border-emerald-500/30 text-emerald-400 rounded-full text-sm font-medium mb-6">
                <ShieldCheck className="w-4 h-4" /> Our Guarantee
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white mb-4">Do the Work, or Don't Pay.</h2>
              <p className="text-slate-400 font-light max-w-xl mx-auto">If you follow the system and execution doesn't improve within 30 days, we refund you.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-sm p-8">
              <p className="text-slate-300 text-sm mb-6"><strong className="text-white">Execution improvement</strong> means any two of the following within 30 days:</p>
              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {["Higher completion rate of declared commitments", "Smaller gap between planned and completed tasks", "On-time initiation of time-blocked work", "Fewer repeated misses without structural adjustment"].map((item, i) => (
                  <div key={i} className="flex items-start gap-3"><Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" /><span className="text-slate-300 text-sm">{item}</span></div>
                ))}
              </div>
              <div className="border-t border-slate-800 pt-6">
                <p className="text-slate-400 text-sm leading-relaxed"><strong className="text-slate-200">The logic:</strong> Execution improves when structure is followed. If you attend every session, follow the daily structure, respond to check-ins, and report honestly — and execution still doesn't improve — the system has failed, not you. We refund you. This is epistemic integrity, not customer service.</p>
              </div>
            </div>
            <p className="text-center text-slate-600 text-xs mt-4">The guarantee covers structural execution metrics. It does not cover grades, admissions outcomes, motivation levels, or clinical symptoms.</p>
          </div>

        </div>
      </div>
      {showPlaybookModal && <PlaybookModal />}
    </div>
  );

  // ── ABOUT/CONTACT PAGE ──
  if (activePage === 'about') return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <nav className={`fixed w-full z-50 transition-all duration-500 border-b ${isScrolled ? 'bg-slate-950/95 backdrop-blur-md border-slate-800 py-4' : 'bg-transparent border-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          <button onClick={() => setActivePage('home')} className="font-serif font-bold text-2xl text-white">Whetstone<span className="text-amber-500">.</span></button>
          <div className="hidden md:flex items-center p-1.5 bg-slate-900/80 border border-slate-700 rounded-full backdrop-blur-md">
            <button onClick={() => setActivePage('home')} className="px-6 py-2 rounded-full text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all">Overview</button>
            <button onClick={() => setActivePage('pricing')} className="px-6 py-2 rounded-full text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all">Pricing</button>
            <button className="px-6 py-2 rounded-full text-sm font-semibold bg-amber-500 text-slate-950">Contact</button>
          </div>
          <button onClick={() => setCurrentView('diagnostic')} className="bg-white hover:bg-slate-200 text-slate-950 px-6 py-2.5 text-sm font-bold rounded-sm hidden sm:block">Free Diagnostic</button>
        </div>
      </nav>
      <div className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-900/20 translate-x-4 translate-y-4 rounded-sm border border-amber-900/30"></div>
              <div className="bg-slate-900 relative z-10 rounded-sm overflow-hidden border border-slate-800 shadow-2xl">
                <img src={CONFIG.founderPhotoUrl} alt="Cole Whetstone" className="w-full object-cover" style={{ aspectRatio: '4/5' }} />
              </div>
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-slate-800 bg-slate-900 text-slate-300 text-xs font-semibold uppercase tracking-widest mb-6 rounded-sm">The Founder</div>
              <h1 className="font-serif text-4xl md:text-5xl font-semibold text-white mb-6">Cole Whetstone</h1>
              <p className="text-lg text-slate-300 leading-relaxed mb-6 font-light">Cole studied classics at Harvard and did graduate work in philosophy at Oxford, where he taught Ancient Greek at Jesus College and Harris Manchester College. He runs Whetstone Admissions and co-founded the New York Philosophical Society.</p>
              <p className="text-lg text-slate-300 leading-relaxed mb-8 font-light">The Execution System grew from a pattern Cole saw repeatedly: brilliant students who knew exactly what to do but couldn't make themselves do it. The problem was never information — it was infrastructure.</p>
              <div className="flex flex-col sm:flex-row gap-6 border-t border-slate-800 pt-8">
                <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-amber-500" /><span className="text-sm font-medium text-slate-200">{CONFIG.contactEmail}</span></div>
                <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-amber-500" /><span className="text-sm font-medium text-slate-200">{CONFIG.contactPhone}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showPlaybookModal && <PlaybookModal />}
    </div>
  );

  // ── HOME PAGE (main) ──
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-500 border-b ${isScrolled ? 'bg-slate-950/95 backdrop-blur-md border-slate-800 py-4 shadow-lg shadow-black/20' : 'bg-transparent border-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          <button onClick={() => setActivePage('home')} className="font-serif font-bold text-2xl tracking-tight text-white">Whetstone<span className="text-amber-500">.</span></button>
          <div className="hidden md:flex items-center p-1.5 bg-slate-900/80 border border-slate-700 rounded-full backdrop-blur-md shadow-xl shadow-black/20">
            <button className="px-6 py-2 rounded-full text-sm font-semibold bg-amber-500 text-slate-950 shadow-md">Overview</button>
            <button onClick={() => setActivePage('pricing')} className="px-6 py-2 rounded-full text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all">Pricing</button>
            <button onClick={() => setActivePage('about')} className="px-6 py-2 rounded-full text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all">Contact</button>
          </div>
          <button onClick={() => setCurrentView('diagnostic')} className="bg-white hover:bg-slate-200 text-slate-950 px-6 py-2.5 text-sm font-bold transition-colors rounded-sm hidden sm:block">Free Diagnostic</button>
        </div>
      </nav>

      {/* Hero */}
      {/* Hero */}
      <section className="relative pt-40 pb-24 md:pt-52 md:pb-32 overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 -z-10"></div>
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-slate-700 text-slate-300 text-xs font-semibold uppercase tracking-widest mb-8 bg-slate-900/50 backdrop-blur-sm">From Whetstone</div>
          <h1 className="font-serif text-5xl md:text-7xl font-semibold tracking-tight mb-8 text-white leading-[1.05]">
            Stop Trying Harder.<br /><span className="italic text-amber-500">Install Structure.</span>
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            We diagnose exactly where your execution breaks down, then install the support infrastructure that makes follow-through inevitable.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => setCurrentView('diagnostic')} className="w-full sm:w-auto px-8 py-4 bg-white text-slate-950 font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 group rounded-sm">
              Take the Free Diagnostic <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => setShowPlaybookModal(true)} className="w-full sm:w-auto px-8 py-4 bg-transparent text-white font-medium border border-slate-700 hover:border-slate-500 hover:bg-slate-900/50 transition-colors flex items-center justify-center gap-2 rounded-sm">
              <BookOpen className="w-4 h-4" /> Read the Playbook
            </button>
          </div>
          <p className="text-slate-600 mt-5 text-sm">5 minutes · Personalized results · No spam</p>
        </div>
      </section>
      
      {/* Philosophy */}
      <section className="py-24 md:py-32 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <Quote className="w-12 h-12 text-slate-700 mb-6" />
            <h2 className="font-serif text-3xl md:text-5xl font-semibold text-white leading-tight mb-6">Intelligence isn't the bottleneck. Executive function is.</h2>
            <p className="text-lg text-slate-300 leading-relaxed mb-6 font-light">We consistently see brilliant students hit a wall, not because the material is too difficult, but because the sheer volume of high school demands exceeds their organizational capacity.</p>
            <p className="text-lg text-slate-300 leading-relaxed font-light">Trying to keep every homework assignment, extracurricular, and college deadline in your head leads to chronic anxiety, dropped tasks, and massive procrastination.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { label: "Cognitive Overload", desc: "Relying on memory instead of external systems causes dropped tasks and chronic stress." },
              { label: "Procrastination Loops", desc: "Large, vague tasks create friction, causing students to freeze and avoid starting." },
              { label: "Time Blindness", desc: "Inability to accurately estimate how long tasks will take, leading to constant all-nighters." },
              { label: "Friction & Avoidance", desc: "Without a step-by-step algorithm to process the daily workload, students resort to scrolling." },
            ].map((item, i) => (
              <div key={i} className="p-6 bg-slate-900 border border-slate-800 rounded-sm">
                <div className="text-white font-semibold mb-2">{item.label}</div>
                <div className="text-sm text-slate-400 leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Playbook */}
      <section className="py-24 md:py-32 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-5 relative order-2 lg:order-1">
            <div className="absolute inset-0 bg-blue-900/20 translate-x-4 translate-y-4 rounded-sm border border-blue-900/30"></div>
            <div className="bg-slate-950 border border-slate-800 p-10 relative z-10 shadow-xl rounded-sm">
              <BookOpen className="w-10 h-10 text-amber-500 mb-6" />
              <h3 className="font-serif text-2xl font-semibold text-white mb-4">The Execution Playbook</h3>
              <p className="text-slate-400 mb-6 text-sm leading-relaxed">Our evidence-based framework identifies the 11 critical capacities that drive reliable execution.</p>
              <div className="space-y-4 text-sm text-slate-300 mb-8 border-t border-slate-800 pt-6">
                <div className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" /><span><span className="font-medium text-white">Train:</span> Direct skill acquisition.</span></div>
                <div className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" /><span><span className="font-medium text-white">Environment:</span> Restructuring spaces to remove friction.</span></div>
                <div className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" /><span><span className="font-medium text-white">Accountability:</span> External systems to enforce habits.</span></div>
              </div>
              <button onClick={() => setShowPlaybookModal(true)} className="w-full py-3 bg-white text-slate-950 font-medium hover:bg-slate-200 transition-colors text-sm rounded-sm">Download Free Playbook</button>
            </div>
          </div>
          <div className="lg:col-span-7 order-1 lg:order-2">
            <h2 className="font-serif text-3xl md:text-5xl font-semibold text-white leading-tight mb-6">Systematically training what schools ignore.</h2>
            <p className="text-lg text-slate-300 leading-relaxed mb-8 font-light">Executive function isn't just "willpower." It is the set of mental capacities that enable goal-directed behavior across time, in the face of competing impulses and inevitable obstacles.</p>
            <div className="grid sm:grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-white mb-2 border-b border-slate-800 pb-2">The 3-Lever Model</h4>
                <p className="text-slate-400 text-sm leading-relaxed">We use a three-lever model (Train, Environment, Accountability) to bridge the gap between intention and action.</p>
              </div>
              <div>
                <h4 className="font-bold text-white mb-2 border-b border-slate-800 pb-2">Cognitive Repair</h4>
                <p className="text-slate-400 text-sm leading-relaxed">Our CBT journaling protocols help students process failure logically, preventing the emotional spirals that derail progress.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section className="py-24 md:py-32 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="font-serif text-4xl md:text-5xl font-semibold mb-6 text-white">An engineered approach to productivity.</h2>
            <p className="text-xl text-slate-400 font-light leading-relaxed">The Execution System replaces chaos with a reliable, repeatable methodology.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { num: "1", title: "The Brain Dump", desc: "We eliminate cognitive friction by running a strict 5-minute timer to dump every commitment, assignment, and idea into an external receptacle." },
              { num: "2", title: "Eisenhower Matrix", desc: "Tasks are systematically chunked and routed through the Eisenhower Matrix to separate the vital (Demand) from the trivial (Distraction)." },
              { num: "3", title: "Calendar Sync", desc: "Scheduled items are locked into a calendar to reality-check the day's capacity. Immediate tasks under 2 minutes are executed instantly." },
            ].map((step, i) => (
              <div key={i} className="border-t border-slate-800 pt-8">
                <div className="w-12 h-12 rounded-full border border-amber-500/30 flex items-center justify-center text-amber-500 font-serif text-xl mb-6">{step.num}</div>
                <h3 className="text-2xl font-serif font-semibold text-white mb-4">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed font-light">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How The System Works — Human Infrastructure */}
      <section className="py-24 md:py-32 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-semibold mb-4 text-white">The people behind the algorithm.</h2>
            <p className="text-lg text-slate-400 font-light">You learn the system. They make sure you actually use it. Three layers of support — maximum drift: seven days.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                title: "Weekly Accountability Coach",
                desc: "45–60 minutes reviewing what worked, what broke, and why. Misses become data, not discouragement.",
                tag: "Trained in EF diagnostics & failure-mode analysis",
                color: "border-blue-500/30",
                accent: "text-blue-400"
              },
              {
                num: "02",
                title: "Dedicated Executive Assistant",
                desc: "10-minute daily call. Reviews your calendar, confirms start times, logs completions. Your schedule becomes real.",
                tag: "Also handles reminders, logistics & friction removal",
                color: "border-amber-500/30",
                accent: "text-amber-500"
              },
              {
                num: "03",
                title: "Failure-Mode Diagnostics",
                desc: "After weeks 3–4, a written analysis: pattern diagnosis, prescription map, and identification of sabotage points.",
                tag: "Converts misses into data — prevents the spiral",
                color: "border-emerald-500/30",
                accent: "text-emerald-400"
              },
            ].map((item, i) => (
              <div key={i} className={`bg-slate-900 border ${item.color} rounded-sm p-8`}>
                <div className={`font-serif text-5xl font-bold ${item.accent} opacity-30 mb-4 select-none`}>{item.num}</div>
                <h3 className="font-serif text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-slate-300 leading-relaxed text-sm mb-4">{item.desc}</p>
                <p className="text-slate-500 text-xs italic border-t border-slate-800 pt-3">{item.tag}</p>
              </div>
            ))}
          </div>
          <div className="max-w-3xl mx-auto mt-12">
            <div className="bg-slate-900 border border-slate-800 rounded-sm p-8">
              <p className="font-serif text-lg text-slate-300 italic leading-relaxed">
                "Even when every other system collapses, the weekly meeting ensures return. Without it, a bad week becomes a bad month. With it, maximum drift is seven days."
              </p>
              <p className="text-slate-600 text-sm mt-3">— The Execution System Playbook</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section id="demo" className="py-24 md:py-32 bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="mb-16 text-center max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl md:text-5xl font-semibold text-white mb-6">Experience the Algorithm</h2>
            <p className="text-lg text-slate-400 font-light">Walk through our daily three-stage protocol designed to bypass procrastination and force action.</p>
          </div>
          <div className="bg-slate-950 border border-slate-800 shadow-2xl rounded-sm overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-900 overflow-x-auto no-scrollbar">
              {[{ n: 1, label: "Brain Dump" }, { n: 2, label: "Eisenhower Matrix" }, { n: 3, label: "Calendar Sync" }].map(tab => (
                <button key={tab.n} onClick={() => setDemoStep(tab.n)} className={`flex-1 min-w-[150px] py-4 px-6 flex items-center justify-center gap-2 text-sm font-medium transition-colors border-b-2 ${demoStep === tab.n ? 'border-amber-500 text-amber-500 bg-slate-950' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                  <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">{tab.n}</span>{tab.label}
                </button>
              ))}
            </div>
            <div className="p-8 md:p-12 min-h-[500px]">
              {/* Step 1: Brain Dump */}
              {demoStep === 1 && (
                <div className="max-w-3xl mx-auto animate-fade-in">
                  <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-900/30 text-blue-400 rounded-full mb-4 border border-blue-900/50"><ListTodo className="w-6 h-6" /></div>
                    <h3 className="font-serif text-3xl font-semibold text-white mb-3">Timer 1: The Brain Dump</h3>
                    <p className="text-slate-400">Start the timer. Get everything out of your head and onto paper. Do not organize—just capture.</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-sm p-6">
                    <form onSubmit={handleAddTask} className="flex gap-3 mb-6">
                      <input type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="e.g., Read chapter 4 for Bio..." className="flex-1 px-4 py-3 bg-slate-950 rounded-sm border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
                      <button type="submit" className="bg-white text-slate-950 px-6 py-3 rounded-sm hover:bg-slate-200 transition-colors flex items-center gap-2 font-medium"><Plus className="w-4 h-4" /> Add</button>
                    </form>
                    <div className="space-y-2">
                      {demoTasks.map(task => (
                        <div key={task.id} className="bg-slate-800 border border-slate-700 px-4 py-3 rounded-sm flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                          <span className="text-slate-200">{task.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button onClick={() => setDemoStep(2)} className="bg-amber-600 text-white px-8 py-3 rounded-sm font-medium hover:bg-amber-500 transition-colors flex items-center gap-2">Next: Timer 2 <ArrowRight className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
              {/* Step 2: Eisenhower Matrix */}
              {demoStep === 2 && (
                <div className="animate-fade-in">
                  <div className="text-center mb-10 max-w-2xl mx-auto">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-900/30 text-amber-500 rounded-full mb-4 border border-amber-900/50"><Grid className="w-6 h-6" /></div>
                    <h3 className="font-serif text-3xl font-semibold text-white mb-3">Timer 2: Eisenhower Matrix</h3>
                    <p className="text-slate-400">Select an unassigned task, then click a quadrant to assign it.</p>
                  </div>
                  <div className="grid lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4">
                      <h4 className="font-bold text-slate-400 mb-4 uppercase text-xs tracking-widest border-b border-slate-800 pb-2">Unassigned Tasks</h4>
                      <div className="space-y-2">
                        {unassignedTasks.map(task => (
                          <button key={task.id} onClick={() => setSelectedTaskId(task.id)} className={`w-full text-left px-4 py-3 rounded-sm border transition-all ${selectedTaskId === task.id ? 'bg-slate-800 border-amber-500 ring-1 ring-amber-500' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}>
                            <span className={`text-sm ${selectedTaskId === task.id ? 'text-white font-medium' : 'text-slate-300'}`}>{task.text}</span>
                          </button>
                        ))}
                        {unassignedTasks.length === 0 && <div className="bg-emerald-900/20 text-emerald-400 border border-emerald-900/50 px-4 py-6 rounded-sm text-center font-medium flex flex-col items-center gap-2"><CheckCircle2 className="w-8 h-8" />All tasks triaged!</div>}
                      </div>
                    </div>
                    <div className="lg:col-span-8 grid grid-cols-2 gap-4 relative">
                      {!selectedTaskId && unassignedTasks.length > 0 && (
                        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-sm">
                          <div className="bg-white text-slate-950 px-6 py-3 rounded-sm shadow-xl font-medium flex items-center gap-2 animate-bounce"><ArrowLeftIcon /> Select a task first</div>
                        </div>
                      )}
                      {[
                        { id: 'do', label: 'Demand', action: 'Do Now', colors: 'hover:bg-rose-900/30 border-rose-500/50', textColor: 'text-rose-400', itemColor: 'text-rose-200', tag: 'Urgent & Important' },
                        { id: 'schedule', label: 'Fulfillment', action: 'Schedule', colors: 'hover:bg-blue-900/30 border-blue-500/50', textColor: 'text-blue-400', itemColor: 'text-blue-200', tag: 'Not Urgent & Important' },
                        { id: 'delegate', label: 'Delusion', action: 'Delegate', colors: 'hover:bg-amber-900/30 border-amber-500/50', textColor: 'text-amber-500', itemColor: 'text-amber-200', tag: 'Urgent & Not Important' },
                        { id: 'delete', label: 'Distraction', action: 'Delete', colors: 'hover:bg-slate-800 border-slate-600', textColor: 'text-slate-400', itemColor: 'text-slate-500 line-through', tag: 'Not Urgent & Not Important' },
                      ].map(q => (
                        <div key={q.id} onClick={() => handleAssignQuad(q.id)} className={`border rounded-sm p-4 transition-colors cursor-pointer min-h-[160px] ${selectedTaskId ? q.colors : 'bg-slate-900 border-slate-800'}`}>
                          <div className="flex justify-between items-start mb-3">
                            <h5 className={`font-bold ${q.textColor}`}>{q.label} <span className="text-xs font-normal opacity-75 ml-1">({q.action})</span></h5>
                            <span className="text-[10px] uppercase font-bold text-slate-500">{q.tag}</span>
                          </div>
                          <ul className="space-y-1">
                            {getTasksByQuad(q.id).map(t => <li key={t.id} className={`text-xs bg-slate-800 border border-slate-700 p-2 rounded-sm ${q.itemColor}`}>{t.text}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button onClick={() => setDemoStep(3)} disabled={!allAssigned} className={`px-8 py-3 rounded-sm font-medium transition-colors flex items-center gap-2 ${allAssigned ? 'bg-amber-600 text-white hover:bg-amber-500' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>Next: Timer 3 <ArrowRight className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
              {/* Step 3: Calendar Sync */}
              {demoStep === 3 && (
                <div className="animate-fade-in">
                  <div className="text-center mb-10 max-w-2xl mx-auto">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-900/30 text-emerald-400 rounded-full mb-4 border border-emerald-900/50"><Calendar className="w-6 h-6" /></div>
                    <h3 className="font-serif text-3xl font-semibold text-white mb-3">Timer 3: Calendar Sync</h3>
                    <p className="text-slate-400">Lock your scheduled tasks into reality. Immediately execute any urgent task under 2 minutes.</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden">
                      <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 font-bold text-slate-300 text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Today's Schedule</div>
                      <div className="divide-y divide-slate-800">
                        {['3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'].map((time, idx) => {
                          const taskForSlot = getTasksByQuad('schedule')[idx];
                          return (
                            <div key={time} className="flex min-h-[60px]">
                              <div className="w-20 p-3 text-xs font-medium text-slate-500 border-r border-slate-800 text-right">{time}</div>
                              <div className="flex-1 p-2">{taskForSlot && <div className="bg-blue-900/30 border border-blue-500/30 text-blue-300 text-sm px-3 py-2 rounded-sm h-full flex items-center">{taskForSlot.text}</div>}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="bg-rose-950/30 border border-rose-900/50 rounded-sm p-6">
                      <h4 className="font-bold text-rose-400 mb-2 flex items-center gap-2"><Clock className="w-5 h-5" /> The "&lt;2 Minute" Rule</h4>
                      <p className="text-sm text-rose-200/70 mb-6">These tasks were marked Demand. Do them right now.</p>
                      <div className="space-y-3">
                        {getTasksByQuad('do').map(task => (
                          <label key={task.id} className="flex items-start gap-3 cursor-pointer group bg-slate-900 p-3 rounded-sm border border-slate-800">
                            <input type="checkbox" className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-950" />
                            <span className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">{task.text}</span>
                          </label>
                        ))}
                        {getTasksByQuad('do').length === 0 && <div className="text-sm text-rose-400/50 italic">No urgent tasks. You're clear!</div>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-10 flex justify-center">
                    <button onClick={() => { setDemoStep(1); setDemoTasks([{ id: 1, text: "Draft 2 pages for History essay", quad: null }, { id: 2, text: "Email Mr. Davis about extension", quad: null }, { id: 3, text: "Research summer programs", quad: null }, { id: 4, text: "Scroll TikTok / watch YouTube", quad: null }]); }} className="text-slate-500 hover:text-white font-medium transition-colors flex items-center gap-2 px-4 py-2 border border-slate-700 rounded-sm hover:bg-slate-800">
                      <RotateCcw className="w-4 h-4" /> Reset Algorithm
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-24 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-amber-900/50 bg-amber-900/10 text-amber-500 text-xs font-semibold uppercase tracking-widest mb-8">Client Success</div>
            <h2 className="font-serif text-3xl md:text-5xl font-semibold text-white mb-4">Transforming Executive Function</h2>
            <p className="text-slate-400 font-light">Composite scenarios drawn from real client patterns. Details changed for privacy.</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                title: 'The "Smart but Scattered"',
                quote: '"He had a 1450 SAT but was drowning in APs. He would spend 6 hours at his desk but only accomplish 1 hour of actual work."',
                bottleneck: "Friction & Avoidance",
                intervention: "Daily EA calls + Brain Dump protocol bypassed task initiation anxiety entirely.",
                result: "Task initiation: 2/10 → 7/10",
                timeline: "6 weeks",
                lift: false
              },
              {
                title: "The Perfectionist",
                quote: '"She couldn\'t start an essay until 11 PM the night before. If she didn\'t know exactly how the whole project would look, she would completely freeze."',
                bottleneck: "Procrastination Loops",
                intervention: "Weekly coach identified the pattern — overcommitment without time awareness. Eisenhower Matrix + load recalibration.",
                result: "Commitment completion: ~40% → 85%",
                timeline: "2 months",
                lift: true
              },
              {
                title: "The Parent Who Stopped Nagging",
                quote: '"Every evening was the same argument about homework. The parent was functioning as the accountability system — and resenting it."',
                bottleneck: "Relational Conflict",
                intervention: "EA replaced the parent as the daily accountability layer. Monthly PDF reports replaced nightly arguments.",
                result: "GPA up 0.6 pts; parent conflict eliminated",
                timeline: "3 months",
                lift: false
              },
            ].map((s, i) => (
              <div key={i} className={`bg-slate-900 border border-slate-800 p-8 rounded-sm shadow-xl flex flex-col ${s.lift ? 'lg:-translate-y-4' : ''}`}>
                <Quote className="w-8 h-8 text-slate-700 mb-6" />
                <h3 className="font-serif text-xl font-semibold text-white mb-4">{s.title}</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6 italic flex-grow">{s.quote}</p>
                <div className="space-y-4 border-t border-slate-800 pt-6">
                  <div><div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">The Bottleneck</div><div className="text-white text-sm">{s.bottleneck}</div></div>
                  <div><div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">The Intervention</div><div className="text-white text-sm">{s.intervention}</div></div>
                  <div className="bg-slate-950 border border-slate-700 rounded-sm p-4 flex items-center justify-between">
                    <div><div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">The Result</div><div className="text-emerald-400 font-semibold text-sm">{s.result}</div></div>
                    <div className="text-xs text-slate-500 font-medium border border-slate-700 px-2.5 py-1 rounded-full">{s.timeline}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-slate-600 text-xs mt-8">Composite scenarios based on multiple Tier 2 clients. Individual results vary.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-slate-900 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-5xl font-semibold text-white mb-6">Frequently Asked Questions</h2>
          </div>
          {[
            { q: "Is this only for students with ADHD?", a: "No. While our methodologies utilize evidence-based interventions for ADHD, The Execution System is designed for any high-achieving student who wants to optimize their time and eliminate procrastination." },
            { q: "How much time does the system take daily?", a: "The core algorithm takes exactly 15 minutes a day, divided into three 5-minute sprints. This typically saves students 2-3 hours of wasted 'friction' time." },
            { q: "How is this different from subject tutoring?", a: "Subject tutors teach you Calculus or History. We teach you how to organize your brain so you can study for Calculus, write the History paper, lead your debate team, and get 8 hours of sleep." },
            { q: "When is the best time to start?", a: "We recommend starting the summer before Sophomore or Junior year. Building executive function takes time, and cementing these habits before Junior year APs and college applications is crucial." },
          ].map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} isOpen={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)} />)}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-slate-950 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-900/20 blur-3xl rounded-full pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center relative z-10">
          <h2 className="font-serif text-3xl md:text-5xl font-semibold text-white mb-6">Identify your executive bottleneck.</h2>
          <p className="text-lg text-slate-300 mb-10 leading-relaxed font-light">Take our complimentary diagnostic tool. We will evaluate 11 key executive capacities and provide a custom report on how to fix it.</p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button onClick={() => setCurrentView('diagnostic')} className="w-full sm:w-auto px-8 py-4 bg-white text-slate-950 font-medium hover:bg-slate-200 transition-colors rounded-sm">Begin Free Diagnostic</button>
            <button onClick={openCalendly} className="w-full sm:w-auto px-8 py-4 bg-transparent text-white font-medium border border-slate-600 hover:border-slate-400 hover:bg-slate-800 transition-colors rounded-sm">Schedule Consultation</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="font-serif font-bold text-xl text-white">Whetstone<span className="text-amber-500">.</span></span>
          <div className="flex gap-8 text-sm font-medium text-slate-500">
            <button onClick={() => setActivePage('home')} className="hover:text-white transition-colors">Overview</button>
            <button onClick={() => setActivePage('pricing')} className="hover:text-white transition-colors">Pricing</button>
            <button onClick={() => setActivePage('about')} className="hover:text-white transition-colors">Contact</button>
          </div>
          <div className="text-sm text-slate-600 font-light">© {new Date().getFullYear()} Whetstone Advisory LLC</div>
        </div>
      </footer>

      {showPlaybookModal && <PlaybookModal />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  DIAGNOSTIC
// ═══════════════════════════════════════════════════════════════
function Diagnostic() {
  const ctx = useContext(AppContext);
  const { fillingFor, setFillingFor, setCurrentView, diagnosticStep, setDiagnosticStep, capacityRatings, handleCapacityRating, interventionStatus, handleInterventionToggle, isStep1Complete, allCapacities, getWeakestCapacities, name, setName, email, setEmail, parentEmail, setParentEmail, studentName, setStudentName, handleViewResults } = ctx;
  const weakest = getWeakestCapacities();
  const isParentProxy = fillingFor === 'child';

  // ── Who-is-filling-this-out gate ──
  if (!fillingFor) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="bg-neutral-950 text-white py-6 border-b border-neutral-800">
          <div className="max-w-3xl mx-auto px-6">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCurrentView('landing')} className="text-neutral-500 hover:text-white flex items-center gap-2 text-sm" style={{ fontFamily: sans }}><ChevronLeft className="w-4 h-4" /> Back</button>
              <div className="flex items-center gap-3"><span className="text-white text-sm font-semibold" style={{ fontFamily: serif }}>Whetstone</span><span className="text-neutral-700">|</span><span className="text-neutral-500 text-xs" style={{ fontFamily: sans }}>Diagnostic</span></div>
            </div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: serif }}>Executive Function Diagnostic</h1>
            <p className="text-neutral-400 text-sm mt-1" style={{ fontFamily: sans }}>Before we begin</p>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-neutral-900 mb-3" style={{ fontFamily: serif }}>Who is taking this diagnostic?</h2>
            <p className="text-neutral-500 text-sm" style={{ fontFamily: sans }}>This determines how we'll phrase the questions and where we send the results.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <button onClick={() => setFillingFor('self')} className="bg-white rounded-xl border-2 border-neutral-200 p-8 text-center hover:border-neutral-900 transition-all group">
              <div className="w-14 h-14 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-neutral-900 transition-colors"><BookOpen className="w-7 h-7 text-neutral-500 group-hover:text-white transition-colors" /></div>
              <h3 className="font-semibold text-neutral-900 mb-1" style={{ fontFamily: serif }}>I'm a student</h3>
              <p className="text-neutral-500 text-xs" style={{ fontFamily: sans }}>I'll rate my own capacities</p>
            </button>
            <button onClick={() => setFillingFor('child')} className="bg-white rounded-xl border-2 border-neutral-200 p-8 text-center hover:border-neutral-900 transition-all group">
              <div className="w-14 h-14 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-neutral-900 transition-colors"><Shield className="w-7 h-7 text-neutral-500 group-hover:text-white transition-colors" /></div>
              <h3 className="font-semibold text-neutral-900 mb-1" style={{ fontFamily: serif }}>I'm a parent</h3>
              <p className="text-neutral-500 text-xs" style={{ fontFamily: sans }}>I'll rate my child's capacities</p>
            </button>
            <button onClick={() => setFillingFor('self')} className="bg-white rounded-xl border-2 border-neutral-200 p-8 text-center hover:border-neutral-900 transition-all group">
              <div className="w-14 h-14 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-neutral-900 transition-colors"><Target className="w-7 h-7 text-neutral-500 group-hover:text-white transition-colors" /></div>
              <h3 className="font-semibold text-neutral-900 mb-1" style={{ fontFamily: serif }}>I'm a professional</h3>
              <p className="text-neutral-500 text-xs" style={{ fontFamily: sans }}>I want to improve my own execution</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-neutral-950 text-white py-6 border-b border-neutral-800">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { if (diagnosticStep === 1) { setFillingFor(null); } else { setDiagnosticStep(1); } }} className="text-neutral-500 hover:text-white flex items-center gap-2 text-sm" style={{ fontFamily: sans }}><ChevronLeft className="w-4 h-4" /> Back</button>
            <div className="flex items-center gap-3"><span className="text-white text-sm font-semibold" style={{ fontFamily: serif }}>Whetstone</span><span className="text-neutral-700">|</span><span className="text-neutral-500 text-xs" style={{ fontFamily: sans }}>Diagnostic{isParentProxy ? ' (Parent)' : ''}</span></div>
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: serif }}>Executive Function Diagnostic</h1>
          <p className="text-neutral-400 text-sm mt-1" style={{ fontFamily: sans }}>Step {diagnosticStep} of 2: {diagnosticStep === 1 ? 'Rate Capacities' : 'Check Interventions'}</p>
          <div className="flex gap-2 mt-4">
            <div className={`h-1.5 flex-1 rounded-full ${diagnosticStep >= 1 ? 'bg-amber-400' : 'bg-neutral-800'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${diagnosticStep >= 2 ? 'bg-amber-400' : 'bg-neutral-800'}`} />
          </div>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-8">
        {diagnosticStep === 1 && (
          <div>
            <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-4 mb-8">
              <p className="text-neutral-700 text-sm" style={{ fontFamily: sans }}>
                <strong className="text-neutral-900">Instructions:</strong> {isParentProxy
                  ? "Rate your child's capacities from 1 (consistently breaks down) to 10 (reliable even under stress). Answer based on the patterns you've observed — not best-case scenarios. It's okay to estimate; your perspective as a parent is valuable data."
                  : "Rate each capacity from 1 (consistently breaks down) to 10 (reliable even under stress). Answer based on patterns, not best-case scenarios."}
              </p>
            </div>
            {efClusters.map((cluster, ci) => (
              <div key={ci} className="mb-8">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2" style={{ fontFamily: serif }}><span className="bg-neutral-200 text-neutral-500 text-xs px-2 py-1 rounded font-medium" style={{ fontFamily: sans }}>Cluster {ci + 1}</span>{cluster.name}</h3>
                {cluster.capacities.map((cap) => {
                  const Icon = capacityIcons[cap.id];
                  return (
                    <div key={cap.id} className="bg-white rounded-xl border border-neutral-200 p-6 mb-4">
                      <div className="flex items-start gap-4 mb-4"><div className="bg-neutral-100 p-2 rounded-lg"><Icon className="w-6 h-6 text-neutral-600" /></div><div><h4 className="font-semibold text-neutral-900" style={{ fontFamily: serif }}>{cap.name}</h4><p className="text-neutral-600 text-sm" style={{ fontFamily: sans }}>{isParentProxy ? cap.question.replace(/^I /,'My child ').replace(/^I'/,"My child'") : cap.question}</p></div></div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-neutral-500 w-24" style={{ fontFamily: sans }}>{cap.lowLabel}</span>
                        <div className="flex-1 flex gap-1">{[1,2,3,4,5,6,7,8,9,10].map(n => (<button key={n} onClick={() => handleCapacityRating(cap.id, n)} className={`flex-1 py-2 text-sm rounded transition-colors ${capacityRatings[cap.id] === n ? 'bg-neutral-900 text-white' : capacityRatings[cap.id] > n ? 'bg-neutral-200 text-neutral-700' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`} style={{ fontFamily: sans }}>{n}</button>))}</div>
                        <span className="text-xs text-neutral-500 w-24 text-right" style={{ fontFamily: sans }}>{cap.highLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="sticky bottom-4 bg-white border border-neutral-200 rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-neutral-600 text-sm" style={{ fontFamily: sans }}>{Object.keys(capacityRatings).length} of {allCapacities.length} rated</p>
                <button onClick={() => setDiagnosticStep(2)} disabled={!isStep1Complete} className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 text-sm ${isStep1Complete ? 'bg-neutral-900 text-white hover:bg-neutral-800' : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'}`} style={{ fontFamily: sans }}>Continue <ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        )}
        {diagnosticStep === 2 && (
          <div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8"><p className="text-amber-900 text-sm" style={{ fontFamily: sans }}><strong>{isParentProxy ? "Your Child's" : "Your"} 3 Weakest Capacities:</strong> Based on {isParentProxy ? "your" : "the"} ratings, we'll now check which support interventions {isParentProxy ? "your child has" : "you've"} already tried.</p></div>
            {weakest.map((cap) => {
              const capInt = interventions[cap.id]; const Icon = capacityIcons[cap.id];
              return (
                <div key={cap.id} className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
                  <div className="flex items-center gap-4 mb-6"><div className="bg-red-50 p-2 rounded-lg border border-red-100"><Icon className="w-6 h-6 text-red-600" /></div><div><h3 className="font-semibold text-lg text-neutral-900" style={{ fontFamily: serif }}>{cap.name}</h3><p className="text-neutral-500 text-sm" style={{ fontFamily: sans }}>Your rating: <span className="text-red-600 font-semibold">{capacityRatings[cap.id]}/10</span></p></div></div>
                  {['training', 'environment', 'accountability'].map(lever => (
                    <div key={lever} className="mb-4">
                      <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-2" style={{ fontFamily: sans }}>
                        {lever === 'training' && <Brain className="w-3.5 h-3.5" />}{lever === 'environment' && <Target className="w-3.5 h-3.5" />}{lever === 'accountability' && <Users className="w-3.5 h-3.5" />}
                        {lever.charAt(0).toUpperCase() + lever.slice(1)} Interventions
                      </h4>
                      <div className="space-y-2">{capInt[lever].map(int => (
                        <label key={int.id} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors border border-transparent hover:border-neutral-200">
                          <input type="checkbox" checked={interventionStatus[int.id] || false} onChange={() => handleInterventionToggle(int.id)} className="w-5 h-5 rounded border-neutral-300 accent-neutral-900" />
                          <span className="text-neutral-700 text-sm" style={{ fontFamily: sans }}>{isParentProxy ? int.text.replace(/^I /,'My child ').replace(/^I'/,"My child'").replace(/^I've/,"My child has") : int.text}</span>
                        </label>
                      ))}</div>
                    </div>
                  ))}
                </div>
              );
            })}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-neutral-900 mb-4" style={{ fontFamily: serif }}>Get {isParentProxy ? "Your Child's" : "Your"} Results</h3>
              {isParentProxy ? (
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1 block" style={{ fontFamily: sans }}>Student's Name</label>
                    <input type="text" placeholder="Your child's name" value={studentName} onChange={(e) => setStudentName(e.target.value)} className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-none text-sm" style={{ fontFamily: sans }} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1 block" style={{ fontFamily: sans }}>Your Name (Parent)</label>
                      <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-none text-sm" style={{ fontFamily: sans }} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1 block" style={{ fontFamily: sans }}>Your Email (Parent)</label>
                      <input type="email" placeholder="Your email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-none text-sm" style={{ fontFamily: sans }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-none text-sm" style={{ fontFamily: sans }} />
                  <input type="email" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-none text-sm" style={{ fontFamily: sans }} />
                </div>
              )}
              <p className="text-sm text-neutral-500 mb-2" style={{ fontFamily: sans }}>{isParentProxy ? "We'll send you a detailed PDF report of your child's results." : "We'll send you a detailed PDF report and save your results."}</p>
              {!(isParentProxy ? parentEmail && parentEmail.includes('@') : email && email.includes('@')) && (
                <p className="text-sm text-amber-600 flex items-center gap-1" style={{ fontFamily: sans }}><AlertCircle className="w-3.5 h-3.5" /> Email is required to view your results.</p>
              )}
            </div>
            <div className="flex gap-4">
              <button onClick={() => setDiagnosticStep(1)} className="px-6 py-3 border border-neutral-300 rounded-lg font-medium text-neutral-700 hover:bg-neutral-50 text-sm" style={{ fontFamily: sans }}><ChevronLeft className="w-4 h-4 inline mr-2" />Back</button>
              <button onClick={handleViewResults} disabled={!(isParentProxy ? (parentEmail && parentEmail.includes('@') && studentName.trim()) : (email && email.includes('@')))} className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors text-sm ${(isParentProxy ? (parentEmail && parentEmail.includes('@') && studentName.trim()) : (email && email.includes('@'))) ? 'bg-neutral-900 text-white hover:bg-neutral-800' : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'}`} style={{ fontFamily: sans }}>See {isParentProxy ? "the" : "My"} Results →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  RESULTS
// ═══════════════════════════════════════════════════════════════
function Results() {
  const ctx = useContext(AppContext);
  const { calculateResults, fillingFor, studentName, name, handleDownloadPDF, pdfDownloaded, pdfGenerating, setCurrentView, setDiagnosticStep, setCapacityRatings, setInterventionStatus, setPdfDownloaded, setResultsSubmitted, setFillingFor, setParentEmail, setStudentName, setName, setEmail, capacityRatings } = ctx;
  const results = calculateResults();
  const leverLabels = { training: { label: "Training", icon: Brain }, environment: { label: "Environment", icon: Target }, accountability: { label: "Accountability", icon: Users } };
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-neutral-950 text-white py-12 border-b border-neutral-800">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-6"><span className="text-white text-sm font-semibold" style={{ fontFamily: serif }}>Whetstone</span><span className="text-neutral-700">|</span><span className="text-neutral-500 text-xs" style={{ fontFamily: sans }}>Your Results</span></div>
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full text-sm mb-6" style={{ fontFamily: sans }}><Check className="w-4 h-4" /> Diagnostic Complete</div>
          <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: serif }}>{(fillingFor === 'child' ? studentName : name) ? `${fillingFor === 'child' ? studentName : name}, here's ${fillingFor === 'child' ? 'the' : 'your'}` : "Here's the"} Execution Profile</h1>
          <p className="text-neutral-400" style={{ fontFamily: sans }}>We've identified your primary bottlenecks and the support levers you're missing.</p>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Download PDF button */}
        <div className="flex justify-end mb-4">
          <button onClick={handleDownloadPDF} disabled={pdfGenerating} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pdfDownloaded ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : pdfGenerating ? 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-wait' : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'}`} style={{ fontFamily: sans }}>
            {pdfGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...</> : pdfDownloaded ? <><Check className="w-4 h-4" /> PDF Downloaded</> : <><Download className="w-4 h-4" /> Download PDF Report</>}
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2" style={{ fontFamily: serif }}><AlertCircle className="w-6 h-6 text-red-500" />Your Primary Bottlenecks</h2>
          {results.weakest.map((result, i) => {
            const Icon = capacityIcons[result.capacity.id]; const MissingIcon = leverLabels[result.missingLever].icon;
            return (
              <div key={i} className="border-b border-neutral-100 last:border-0 py-6 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3"><div className="bg-red-50 p-2 rounded-lg border border-red-100"><Icon className="w-6 h-6 text-red-600" /></div><div><h3 className="font-semibold text-neutral-900" style={{ fontFamily: serif }}>{result.capacity.name}</h3><p className="text-sm text-neutral-500" style={{ fontFamily: sans }}>Rating: {result.rating}/10</p></div></div>
                  <div className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2" style={{ fontFamily: sans }}><MissingIcon className="w-3.5 h-3.5" />Missing: {leverLabels[result.missingLever].label}</div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(result.percentages).map(([lever, pct]) => (
                    <div key={lever} className="text-center">
                      <div className="text-xs text-neutral-500 mb-1" style={{ fontFamily: sans }}>{leverLabels[lever].label}</div>
                      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${lever === result.missingLever ? 'bg-red-400' : 'bg-emerald-400'}`} style={{ width: `${pct * 100}%` }} /></div>
                      <div className="text-xs text-neutral-400 mt-1" style={{ fontFamily: sans }}>{result.implemented[lever]}/{result.total[lever]} implemented</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className={`rounded-2xl p-6 mb-6 ${results.recommendation === 'full_system' ? 'bg-neutral-950 text-white' : 'bg-white border border-neutral-200'}`}>
          <h2 className={`text-xl font-bold mb-4 ${results.recommendation === 'full_system' ? 'text-white' : 'text-neutral-900'}`} style={{ fontFamily: serif }}>Our Recommendation</h2>
          {results.recommendation === 'full_system' ? (
            <div>
              <p className="text-neutral-300 mb-4 text-sm" style={{ fontFamily: sans }}>Based on your results, you have <strong className="text-white">accountability gaps across multiple capacities</strong>. The Full Execution System (Tier 2) is designed for exactly this pattern.</p>
              <div className="bg-white/5 border border-neutral-800 rounded-xl p-4 mb-4">
                <div className="font-semibold mb-2 text-sm" style={{ fontFamily: sans }}>The Full Execution System includes:</div>
                <ul className="space-y-2 text-sm text-neutral-300">
                  {["Weekly 1:1 accountability coach", "Dedicated EA for daily planning calls", "Daily structure & time-blocking", "Formalized failure-mode diagnostics", "Monthly progress reporting"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2" style={{ fontFamily: sans }}><Check className="w-4 h-4 text-amber-400/70" /> {item}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-sm font-medium" style={{ fontFamily: sans }}><ShieldCheck className="w-4 h-4 text-emerald-400" /><span className="text-emerald-300">30-Day "Do the Work or Don't Pay" Guarantee</span></div>
              </div>
              <button onClick={openCalendly} className="w-full bg-white text-neutral-900 py-4 rounded-xl font-semibold hover:bg-neutral-100 transition-colors text-sm" style={{ fontFamily: sans }}>Schedule a Consultation →</button>
            </div>
          ) : (
            <div>
              <p className="text-neutral-600 mb-4 text-sm" style={{ fontFamily: sans }}>Your pattern suggests you may benefit from <strong className="text-neutral-900">Coached Execution (Tier 1)</strong>, which focuses on the accountability lever without daily EA support.</p>
              <button onClick={openCalendly} className="w-full bg-neutral-900 text-white py-4 rounded-xl font-semibold hover:bg-neutral-800 transition-colors text-sm" style={{ fontFamily: sans }}>Schedule a Consultation →</button>
            </div>
          )}
        </div>

        <div className="bg-neutral-100 border border-neutral-200 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-neutral-900 mb-4" style={{ fontFamily: serif }}>What Happens Next</h2>
          <div className="space-y-4">
            {[{ num: 1, text: "Schedule a free 30-minute diagnostic call" }, { num: 2, text: "We'll confirm your bottlenecks and assess fit" }, { num: 3, text: "If it's a match, we onboard you within 48 hours" }].map((step, i) => (
              <div key={i} className="flex items-center gap-4"><div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center font-semibold text-sm" style={{ fontFamily: sans }}>{step.num}</div><p className="text-neutral-700 text-sm" style={{ fontFamily: sans }}>{step.text}</p></div>
            ))}
          </div>
        </div>
        <div className="text-center mt-8"><button onClick={() => { setCurrentView('landing'); setDiagnosticStep(1); setCapacityRatings({}); setInterventionStatus({}); setPdfDownloaded(false); setResultsSubmitted(false); setFillingFor(null); setParentEmail(''); setStudentName(''); setName(''); setEmail(''); }} className="text-neutral-500 hover:text-neutral-700 text-sm" style={{ fontFamily: sans }}>← Start Over</button></div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  APP — state lives here, flows through context
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  // audience removed — landing page is universal
  const [diagnosticStep, setDiagnosticStep] = useState(1);
  const [capacityRatings, setCapacityRatings] = useState({});
  const [interventionStatus, setInterventionStatus] = useState({});
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [playbookEmail, setPlaybookEmail] = useState('');
  const [showPlaybookModal, setShowPlaybookModal] = useState(false);
  const [playbookSubmitted, setPlaybookSubmitted] = useState(false);
  const [playbookSubmitting, setPlaybookSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [resultsSubmitted, setResultsSubmitted] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [fillingFor, setFillingFor] = useState(null);
  const [parentEmail, setParentEmail] = useState('');
  const [studentName, setStudentName] = useState('');

  useEffect(() => { window.scrollTo(0, 0); }, [currentView]);


  const allCapacities = efClusters.flatMap(c => c.capacities);

  const getWeakestCapacities = () => {
    const sorted = Object.entries(capacityRatings).sort(([,a], [,b]) => a - b).slice(0, 3);
    return sorted.map(([id]) => allCapacities.find(c => c.id === id));
  };

  const calculateResults = () => {
    const weakest = getWeakestCapacities();
    const results = weakest.map(cap => {
      const capInt = interventions[cap.id];
      const implemented = { training: capInt.training.filter(i => interventionStatus[i.id]).length, environment: capInt.environment.filter(i => interventionStatus[i.id]).length, accountability: capInt.accountability.filter(i => interventionStatus[i.id]).length };
      const total = { training: capInt.training.length, environment: capInt.environment.length, accountability: capInt.accountability.length };
      const percentages = { training: implemented.training / total.training, environment: implemented.environment / total.environment, accountability: implemented.accountability / total.accountability };
      const lowestLever = Object.entries(percentages).sort(([,a], [,b]) => a - b)[0][0];
      return { capacity: cap, rating: capacityRatings[cap.id], implemented, total, percentages, missingLever: lowestLever };
    });
    const accountabilityGaps = results.filter(r => r.missingLever === 'accountability').length;
    const environmentGaps = results.filter(r => r.missingLever === 'environment').length;
    let recommendation = 'full_system';
    if (environmentGaps >= 2 && accountabilityGaps === 0) recommendation = 'coach_only';
    return { weakest: results, recommendation };
  };

  const handleCapacityRating = (id, value) => setCapacityRatings(prev => ({ ...prev, [id]: value }));
  const handleInterventionToggle = (id) => setInterventionStatus(prev => ({ ...prev, [id]: !prev[id] }));
  const isStep1Complete = Object.keys(capacityRatings).length === allCapacities.length;

  const handlePlaybookSubmit = async () => {
    if (!playbookEmail || !playbookEmail.includes('@')) return;
    setPlaybookSubmitting(true);
    await Promise.all([
      submitPlaybookEmail(playbookEmail),
      submitToMailchimp({ email: playbookEmail, type: 'playbook' }),
    ]);
    setPlaybookSubmitting(false);
    setPlaybookSubmitted(true);
  };

  const handleViewResults = async () => {
    setCurrentView('results');
    const results = calculateResults();
    const contactEmail = fillingFor === 'child' ? parentEmail : email;
    const contactName = fillingFor === 'child' ? name : name;
    if (contactEmail) {
      Promise.all([
        submitDiagnosticResults({
          name: fillingFor === 'child' ? studentName : name,
          email: contactEmail,
          capacityRatings,
          recommendation: results.recommendation,
          weakestCapacities: results.weakest.map(r => r.capacity.name),
          missingLevers: results.weakest.map(r => r.missingLever),
          fillingFor: fillingFor || 'self',
          parentEmail: fillingFor === 'child' ? parentEmail : '',
          studentName: fillingFor === 'child' ? studentName : '',
        }),
        submitToMailchimp({ email: contactEmail, name: contactName, type: 'diagnostic' }),
      ]);
      setResultsSubmitted(true);
    }
  };

  const handleDownloadPDF = () => {
    setPdfGenerating(true);
    // Small delay to let the UI update before heavy PDF work
    setTimeout(() => {
      try {
        const results = calculateResults();
        const reportName = fillingFor === 'child' ? studentName : name;
        const success = downloadDiagnosticPDF({
          name: reportName, capacityRatings,
          results: results.weakest,
          recommendation: results.recommendation,
          allCapacities,
          interventionStatus,
          interventions,
        });
        if (success !== false) setPdfDownloaded(true);
      } catch (err) {
        console.error('handleDownloadPDF error:', err);
        alert('PDF error: ' + err.message + '\n\nPlease try again or contact hello@whetstoneadmissions.com');
      } finally {
        setPdfGenerating(false);
      }
    }, 100);
  };

  const ctx = {
    currentView, setCurrentView, diagnosticStep, setDiagnosticStep,
    capacityRatings, setCapacityRatings, interventionStatus, setInterventionStatus,
    name, setName, email, setEmail, playbookEmail, setPlaybookEmail,
    showPlaybookModal, setShowPlaybookModal, playbookSubmitted, setPlaybookSubmitted,
    playbookSubmitting, openFaq, setOpenFaq, resultsSubmitted, setResultsSubmitted,
    pdfDownloaded, setPdfDownloaded, fillingFor, setFillingFor, parentEmail, setParentEmail,
    studentName, setStudentName, allCapacities, getWeakestCapacities, calculateResults,
    handleCapacityRating, handleInterventionToggle, isStep1Complete,
    handlePlaybookSubmit, handleViewResults, handleDownloadPDF, pdfGenerating,
  };

  return (
    <AppContext.Provider value={ctx}>
      {currentView === 'landing' && <LandingPage />}
      {currentView === 'diagnostic' && <Diagnostic />}
      {currentView === 'results' && <Results />}
    </AppContext.Provider>
  );
}
