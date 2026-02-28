import React, { useState, createContext, useContext } from 'react';
import { ChevronRight, ChevronLeft, Check, AlertCircle, Target, Calendar, Users, Brain, Clock, Zap, Shield, BarChart3, Sparkles, ArrowRight, BookOpen, ShieldCheck, ChevronDown, X, Download, Loader2 } from 'lucide-react';
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
    <div className="border-b border-neutral-200 last:border-0">
      <button onClick={onClick} className="w-full flex items-center justify-between py-5 text-left group">
        <span className="font-medium text-neutral-900 pr-8 group-hover:text-neutral-700 transition-colors" style={{ fontFamily: sans }}>{q}</span>
        <ChevronDown className={`w-5 h-5 text-neutral-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="pb-5 -mt-1"><p className="text-neutral-600 leading-relaxed text-sm" style={{ fontFamily: sans }}>{a}</p></div>}
    </div>
  );
}

// ─── Playbook Modal ──────────────────────────────────────────
function PlaybookModal() {
  const { playbookSubmitted, playbookEmail, setPlaybookEmail, handlePlaybookSubmit, playbookSubmitting, setShowPlaybookModal, setPlaybookSubmitted } = useContext(AppContext);
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowPlaybookModal(false); setPlaybookSubmitted(false); }}>
      <div className="bg-white rounded-2xl max-w-md w-full p-8 relative" onClick={e => e.stopPropagation()}>
        <button onClick={() => { setShowPlaybookModal(false); setPlaybookSubmitted(false); }} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button>
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-neutral-900 rounded-xl flex items-center justify-center mx-auto mb-4"><BookOpen className="w-7 h-7 text-amber-400" /></div>
          <h3 className="text-xl font-bold text-neutral-900" style={{ fontFamily: serif }}>The Execution Playbook</h3>
          <p className="text-neutral-500 text-sm mt-1" style={{ fontFamily: sans }}>Chapters One & Two — free, no obligation</p>
        </div>
        {playbookSubmitted ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="w-6 h-6 text-emerald-600" /></div>
            <p className="text-neutral-900 font-semibold mb-3" style={{ fontFamily: sans }}>Your playbook is ready</p>
            <a href="/Execution-Playbook.pdf" download="Execution-Playbook.pdf"
              className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors text-sm"
              style={{ fontFamily: sans }}>
              <Download className="w-4 h-4" /> Download PDF
            </a>
            <p className="text-neutral-400 text-xs mt-3" style={{ fontFamily: sans }}>A copy has also been sent to {playbookEmail}</p>
          </div>
        ) : (
          <>
            <p className="text-neutral-600 text-sm leading-relaxed mb-6 text-center" style={{ fontFamily: sans }}>
              Why motivation fails. Why planners don't stick. How the three-lever model works — plus the three habits that carry the entire system. Enter your email to download instantly.
            </p>
            <input type="email" placeholder="Your email address" value={playbookEmail} onChange={e => setPlaybookEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePlaybookSubmit()}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-none mb-3 text-sm" style={{ fontFamily: sans }} />
            <button onClick={handlePlaybookSubmit} disabled={playbookSubmitting || !playbookEmail.includes('@')}
              className="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ fontFamily: sans }}>
              {playbookSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing...</> : <><Download className="w-4 h-4" /> Get the Playbook →</>}
            </button>
            <p className="text-xs text-neutral-400 text-center mt-3" style={{ fontFamily: sans }}>No spam. Unsubscribe anytime.</p>
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
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Nav */}
      <nav className="bg-neutral-950 border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-white font-semibold tracking-tight" style={{ fontFamily: serif, fontSize: '1.15rem' }}>Whetstone</span>
            <span className="text-neutral-600 text-sm">|</span>
            <span className="text-neutral-400 text-sm" style={{ fontFamily: sans }}>The Execution System</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentView('diagnostic')} className="bg-white text-neutral-900 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-100 transition-colors hidden sm:block" style={{ fontFamily: sans }}>Take the Diagnostic</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-neutral-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="max-w-5xl mx-auto px-6 pt-24 pb-20 relative">
          <div className="max-w-3xl">
            <p className="text-neutral-500 text-sm font-medium tracking-widest uppercase mb-6" style={{ fontFamily: sans }}>FROM WHETSTONE</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-[1.15]" style={{ fontFamily: serif }}>Stop Trying Harder.<br /><span className="text-amber-400">Install Structure.</span></h1>
            <p className="text-xl text-neutral-400 mb-10 leading-relaxed max-w-2xl" style={{ fontFamily: sans }}>
              {"We diagnose exactly where your execution breaks down, then install the support infrastructure that makes follow-through inevitable."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => setCurrentView('diagnostic')} className="bg-white text-neutral-900 px-8 py-4 rounded-lg font-semibold text-base hover:bg-neutral-100 transition-all shadow-lg shadow-black/20" style={{ fontFamily: sans }}>Take the Free Diagnostic →</button>
              <button onClick={() => setShowPlaybookModal(true)} className="text-neutral-400 hover:text-white px-6 py-4 rounded-lg font-medium text-base transition-all flex items-center gap-2 border border-neutral-800 hover:border-neutral-600" style={{ fontFamily: sans }}><BookOpen className="w-5 h-5" /> Read the Playbook</button>
            </div>
            <p className="text-neutral-600 mt-5 text-sm" style={{ fontFamily: sans }}>5 minutes · Personalized results · No spam</p>
          </div>
        </div>
      </div>

      {/* Positioning Line */}
      <div className="bg-neutral-900 border-y border-neutral-800 py-6">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-neutral-400 text-base leading-relaxed" style={{ fontFamily: sans }}>
            We sit <em className="text-neutral-200 not-italic font-medium">underneath</em> therapy, tutoring, and productivity apps — making them work.
            {" We're not another tool. We're the infrastructure that holds your tools together."}
          </p>
        </div>
      </div>

      {/* Problem Section */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4" style={{ fontFamily: serif }}>The Problem Isn't Motivation</h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto" style={{ fontFamily: sans }}>
            {"You know what to do. You've tried planners, apps, and productivity systems. They work for a week, then collapse. The issue isn't effort — it's missing structural support."}
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Brain, title: "Not a Character Flaw", desc: "Executive function has 11 distinct capacities. Most people have 1–2 weak ones that bottleneck everything else." },
            { icon: Target, title: "Three Levers, Not One", desc: "Every capacity improves through training, environment design, OR accountability. Most people only try training." },
            { icon: Users, title: "Accountability Is Underrated", desc: "The single most effective intervention is the most neglected: structured external support." }
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-7 border border-neutral-200 hover:border-neutral-300 transition-colors">
              <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mb-5"><item.icon className="w-6 h-6 text-neutral-700" /></div>
              <h3 className="font-semibold text-lg text-neutral-900 mb-2" style={{ fontFamily: serif }}>{item.title}</h3>
              <p className="text-neutral-600 leading-relaxed text-sm" style={{ fontFamily: sans }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white border-y border-neutral-200 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4" style={{ fontFamily: serif }}>How The System Works</h2>
            <p className="text-neutral-500 max-w-xl mx-auto" style={{ fontFamily: sans }}>Three layers of support. Maximum drift: seven days.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              { num: "01", title: "Weekly Accountability Coach", desc: "45–60 minutes. Wins, losses, learnings, commitments. When something breaks, we diagnose exactly what failed and adjust the system. Misses become data, not discouragement.", detail: "Trained in executive function diagnostics and failure-mode analysis" },
              { num: "02", title: "Dedicated Executive Assistant", desc: "10-minute daily planning call. Reviews today's calendar, confirms start times, identifies friction, logs yesterday's completions. Your schedule becomes real.", detail: "Also handles: reminders, logistics, friction removal, completion logging" },
              { num: "03", title: "Failure-Mode Diagnostics", desc: "After weeks 3–4, a formalized written analysis: pattern-level diagnosis, prescription map, updated load calibration, and explicit identification of sabotage points.", detail: "Converts misses into data — prevents the discouragement spiral" }
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-bold text-neutral-100 mb-4 leading-none select-none" style={{ fontFamily: serif }}>{step.num}</div>
                <h3 className="font-semibold text-lg text-neutral-900 mb-2" style={{ fontFamily: serif }}>{step.title}</h3>
                <p className="text-neutral-600 text-sm leading-relaxed mb-3" style={{ fontFamily: sans }}>{step.desc}</p>
                <p className="text-neutral-400 text-xs italic" style={{ fontFamily: sans }}>{step.detail}</p>
              </div>
            ))}
          </div>
          <div className="bg-neutral-950 rounded-2xl p-8 max-w-2xl mx-auto">
            <p className="text-neutral-300 text-lg leading-relaxed" style={{ fontFamily: serif, fontStyle: 'italic' }}>"Even when every other system collapses, the weekly meeting ensures return. Without it, a bad week becomes a bad month. With it, maximum drift is seven days."</p>
            <p className="text-neutral-600 text-sm mt-4" style={{ fontFamily: sans }}>— The Execution System Playbook</p>
          </div>
        </div>
      </div>

      {/* Client Scenarios */}
      <div className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4" style={{ fontFamily: serif }}>What This Looks Like in Practice</h2>
            <p className="text-neutral-500" style={{ fontFamily: sans }}>Composite scenarios drawn from real client patterns. Details changed for privacy.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {scenarios.map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-neutral-200 p-6 flex flex-col">
                <p className="text-neutral-400 text-xs font-medium uppercase tracking-wider mb-4" style={{ fontFamily: sans }}>{s.label}</p>
                <p className="text-neutral-700 text-sm leading-relaxed flex-1 mb-5" style={{ fontFamily: sans }}>{s.summary}</p>
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3"><p className="text-neutral-900 text-sm font-semibold" style={{ fontFamily: sans }}>{s.outcome}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Guarantee */}
      <div className="bg-neutral-950 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full text-sm mb-6" style={{ fontFamily: sans }}><ShieldCheck className="w-4 h-4" /> Our Guarantee</div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: serif }}>Do the Work, or Don't Pay.</h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto" style={{ fontFamily: sans }}>If you follow the system and execution doesn't improve within 30 days, we refund you.</p>
          </div>
          <div className="bg-neutral-900 rounded-2xl p-8 border border-neutral-800">
            <p className="text-neutral-300 text-sm mb-6" style={{ fontFamily: sans }}><strong className="text-white">Execution improvement</strong> means any two of the following within 30 days:</p>
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {["Higher completion rate of declared commitments", "Smaller gap between planned and completed tasks", "On-time initiation of time-blocked work", "Fewer repeated misses without structural adjustment"].map((item, i) => (
                <div key={i} className="flex items-start gap-3"><Check className="w-4 h-4 text-emerald-400 mt-1 flex-shrink-0" /><span className="text-neutral-300 text-sm" style={{ fontFamily: sans }}>{item}</span></div>
              ))}
            </div>
            <div className="border-t border-neutral-800 pt-6">
              <p className="text-neutral-400 text-sm leading-relaxed" style={{ fontFamily: sans }}><strong className="text-neutral-200">The logic:</strong> Execution improves when structure is followed. If you attend every session, follow the daily structure, respond to check-ins, and report honestly — and execution still doesn't improve — the system has failed. We refund you. This is epistemic integrity, not customer service.</p>
            </div>
          </div>
          <p className="text-neutral-600 text-xs text-center mt-6 max-w-lg mx-auto" style={{ fontFamily: sans }}>The guarantee covers structural execution metrics. It does not cover grades, admissions outcomes, motivation levels, or clinical symptoms.</p>
        </div>
      </div>

      {/* What This Replaces */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4" style={{ fontFamily: serif }}>What This Replaces</h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto" style={{ fontFamily: sans }}>{"You may already be spending this much on tools and support that address symptoms, not structure."}</p>
          </div>
          <div className="space-y-3">
            {[
              { item: "Executive function coach (1x/week)", cost: "$400–600/mo", note: "Included — plus formalized failure diagnostics" },
              { item: "Private tutor (2x/week)", cost: "$600–1,200/mo", note: "Often unnecessary once execution improves" },
              { item: "Productivity app subscriptions", cost: "$30–80/mo", note: "Apps fail without structure underneath" },
              { item: "Time lost to panic-mode catch-up", cost: "Hours/week", note: "Replaced by daily EA planning calls" },
            ].map((row, i) => (
              <div key={i} className="bg-white rounded-lg border border-neutral-200 px-6 py-4 flex items-center justify-between">
                <div className="flex-1"><p className="text-neutral-900 text-sm font-medium" style={{ fontFamily: sans }}>{row.item}</p><p className="text-neutral-500 text-xs mt-0.5" style={{ fontFamily: sans }}>{row.note}</p></div>
                <span className="text-red-500 font-semibold text-sm ml-4 whitespace-nowrap" style={{ fontFamily: sans }}>{row.cost}</span>
              </div>
            ))}
            <div className="bg-neutral-950 rounded-lg px-6 py-5 flex items-center justify-between">
              <div><p className="text-white font-semibold" style={{ fontFamily: serif }}>The Full Execution System</p><p className="text-neutral-400 text-xs mt-0.5" style={{ fontFamily: sans }}>One integrated system replacing piecemeal interventions</p></div>
              <div className="text-right ml-4"><p className="text-white text-xl font-bold" style={{ fontFamily: sans }}>$1,750<span className="text-neutral-500 text-sm font-normal">/mo avg</span></p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Playbook Lead Magnet */}
      <div className="bg-neutral-100 border-y border-neutral-200 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-10 items-center">
            <div className="md:col-span-3">
              <p className="text-neutral-500 text-xs font-semibold uppercase tracking-widest mb-4" style={{ fontFamily: sans }}>NOT READY FOR A CALL?</p>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4" style={{ fontFamily: serif }}>Start with the Playbook</h2>
              <p className="text-neutral-600 leading-relaxed text-sm mb-6" style={{ fontFamily: sans }}><em>The Execution Playbook</em> explains why motivation fails, why planners don't stick, and how the three-lever model works. It's the intellectual foundation of everything we do.</p>
              <div className="space-y-2 mb-6">
                {["Why effort isn't the issue", "Why environment beats willpower", "The three-lever model for executive function", "The commitment protocol"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3"><Check className="w-4 h-4 text-neutral-400 flex-shrink-0" /><span className="text-neutral-700 text-sm" style={{ fontFamily: sans }}>{item}</span></div>
                ))}
              </div>
              <button onClick={() => setShowPlaybookModal(true)} className="bg-neutral-900 text-white px-6 py-3 rounded-lg font-medium text-sm hover:bg-neutral-800 transition-colors" style={{ fontFamily: sans }}>Get the Free Playbook →</button>
              <p className="text-neutral-400 text-xs mt-3" style={{ fontFamily: sans }}>The full Playbook is included with every Tier 2 enrollment.</p>
            </div>
            <div className="md:col-span-2 flex justify-center">
              <div className="bg-neutral-950 rounded-xl p-8 text-center w-full max-w-[220px] aspect-[3/4] flex flex-col items-center justify-center">
                <BookOpen className="w-10 h-10 text-amber-400 mb-4" />
                <p className="text-white font-bold text-sm leading-tight" style={{ fontFamily: serif }}>The Execution Playbook</p>
                <p className="text-neutral-500 text-xs mt-2" style={{ fontFamily: sans }}>Cole Whetstone</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4" style={{ fontFamily: serif }}>Service Tiers</h2>
            <p className="text-neutral-600 max-w-xl mx-auto" style={{ fontFamily: sans }}>The diagnostic recommends which tier fits. Most multi-lever cases need Tier 2. We take a limited number of new clients each month.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-neutral-200 p-8">
              <p className="text-neutral-400 text-xs font-semibold uppercase tracking-widest mb-2" style={{ fontFamily: sans }}>TIER 1</p>
              <h3 className="text-2xl font-bold text-neutral-900 mb-2" style={{ fontFamily: serif }}>Coached Execution</h3>
              <p className="text-neutral-500 text-sm mb-6" style={{ fontFamily: sans }}>Single-lever deficits, primarily accountability</p>
              <div className="text-3xl font-bold text-neutral-900 mb-6" style={{ fontFamily: sans }}>$750–900<span className="text-base font-normal text-neutral-400">/month</span></div>
              <ul className="space-y-3 mb-8">
                {["Weekly 1:1 accountability coach", "Commitment protocol", "Weekly execution review", "Failure-mode identification"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3"><Check className="w-4 h-4 text-neutral-400 flex-shrink-0" /><span className="text-neutral-700 text-sm" style={{ fontFamily: sans }}>{item}</span></li>
                ))}
              </ul>
              <button onClick={() => setCurrentView('diagnostic')} className="w-full border border-neutral-300 text-neutral-700 py-3 rounded-lg font-medium text-sm hover:bg-neutral-50 transition-colors" style={{ fontFamily: sans }}>See If This Fits →</button>
            </div>
            <div className="bg-neutral-950 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500" />
              <p className="text-neutral-500 text-xs font-semibold uppercase tracking-widest mb-2" style={{ fontFamily: sans }}>TIER 2 · FLAGSHIP</p>
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: serif }}>Full Execution System</h3>
              <p className="text-neutral-400 text-sm mb-6" style={{ fontFamily: sans }}>Multi-lever deficits requiring daily structure</p>
              <div className="text-3xl font-bold mb-1" style={{ fontFamily: sans }}>$1,500–2,000<span className="text-base font-normal text-neutral-500">/month</span></div>
              <p className="text-neutral-500 text-xs mb-6" style={{ fontFamily: sans }}>3-month minimum · 30-day guarantee</p>
              <ul className="space-y-3 mb-8">
                {["Everything in Tier 1", "Dedicated Executive Assistant", "Daily structure & time-blocking", "EA friction removal & reminders", "Completion logging", "Monthly progress reporting", "Formalized failure diagnostics", "Full bonus package (Playbook, videos, reboot protocol)"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3"><Check className="w-4 h-4 text-amber-400/70 flex-shrink-0" /><span className="text-neutral-200 text-sm" style={{ fontFamily: sans }}>{item}</span></li>
                ))}
              </ul>
              <button onClick={() => setCurrentView('diagnostic')} className="w-full bg-white text-neutral-900 py-3 rounded-lg font-semibold text-sm hover:bg-neutral-100 transition-colors" style={{ fontFamily: sans }}>Take the Diagnostic →</button>
            </div>
          </div>
        </div>
      </div>

      {/* Founder */}
      <div className="bg-white border-y border-neutral-200 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 items-start">
            <div className="md:col-span-1">
              <img src={CONFIG.founderPhotoUrl} alt="Cole Whetstone" className="w-full rounded-xl object-cover border border-neutral-200" style={{ aspectRatio: '3/4' }} />
            </div>
            <div className="md:col-span-3">
              <p className="text-neutral-400 text-xs font-semibold uppercase tracking-widest mb-3" style={{ fontFamily: sans }}>ABOUT THE FOUNDER</p>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4" style={{ fontFamily: serif }}>Cole Whetstone</h2>
              <p className="text-neutral-700 leading-relaxed text-sm mb-4" style={{ fontFamily: sans }}>Cole studied classics at Harvard and did graduate work in philosophy at Oxford, where he taught Ancient Greek at Jesus College and Harris Manchester College. He runs Whetstone Admissions and co-founded the New York Philosophical Society, where he leads Philosophy Club — a weekly program serving 600+ participants with a waitlist of over 3,000.</p>
              <p className="text-neutral-600 leading-relaxed text-sm" style={{ fontFamily: sans }}>The Execution System grew from a pattern Cole saw repeatedly: brilliant students who knew exactly what to do but couldn't make themselves do it. The problem was never information — it was infrastructure. He built this system to install what's missing, drawing on executive function research, cognitive science, and the kind of structural thinking that comes from years working with ancient philosophical frameworks about human flourishing.</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-neutral-900 mb-12 text-center" style={{ fontFamily: serif }}>Frequently Asked Questions</h2>
          <div className="bg-white rounded-xl border border-neutral-200 px-6">
            {faqData.student.map((item, i) => (<FaqItem key={i} q={item.q} a={item.a} isOpen={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)} />))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-neutral-950 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: serif }}>{"Find Your Bottleneck in 5 Minutes"}</h2>
          <p className="text-neutral-400 mb-10" style={{ fontFamily: sans }}>The diagnostic identifies {"your"} weakest executive function capacities and which support levers are missing. Free, instant results.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => setCurrentView('diagnostic')} className="bg-white text-neutral-900 px-8 py-4 rounded-lg font-semibold text-base hover:bg-neutral-100 transition-all" style={{ fontFamily: sans }}>Start the Diagnostic →</button>
            <button onClick={() => setShowPlaybookModal(true)} className="text-neutral-500 hover:text-white px-6 py-4 font-medium transition-all flex items-center gap-2" style={{ fontFamily: sans }}><BookOpen className="w-5 h-5" /> Or read the Playbook first</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-neutral-950 border-t border-neutral-900 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-neutral-500 text-sm" style={{ fontFamily: serif }}>Whetstone</span>
            <span className="text-neutral-800">|</span>
            <span className="text-neutral-600 text-xs" style={{ fontFamily: sans }}>The Execution System</span>
          </div>
          <span className="text-neutral-700 text-xs" style={{ fontFamily: sans }}>Whetstone Advisory LLC</span>
        </div>
      </div>

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
