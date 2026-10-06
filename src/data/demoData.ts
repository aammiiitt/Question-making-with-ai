import { DocumentItem, Chapter, Topic, KnowledgeChunk, QuestionItem, User, SectionBlueprint } from '../types';

export const INITIAL_USER: User = {
  id: 'teacher-101',
  name: 'Teacher',
  email: 'teacher@school.edu.in',
  board: 'Not configured',
  preferred_language: 'en',
  created_at: '2026-09-01T08:00:00Z',
};

export const DEMO_BOOK: DocumentItem = {
  id: 'doc-demo-class10-physics',
  user_id: 'teacher-101',
  title: 'DEMO / SAMPLE — Class X Physical Science',
  file_name: 'Class_X_Physical_Science_Sample.pdf',
  file_size: 14250000, // ~14.2 MB
  page_count: 148,
  language: 'Bilingual',
  status: 'ready',
  detected_chapters_count: 6,
  is_demo: true,
  teacher_confirmed: true,
  teacher_confirmed_at: '2026-09-15T10:30:00Z',
  total_extracted_chars: 120500,
  total_words: 18200,
  usable_pages_count: 142,
  attention_pages_count: 6,
  coverage_percentage: 95.9,
  created_at: '2026-09-15T10:30:00Z',
};

export const DEMO_CHAPTERS: Chapter[] = [
  {
    id: 'chap-1-measurement',
    document_id: 'doc-demo-class10-physics',
    title: 'Measurement & System of Units',
    chapter_number: 1,
    page_start: 1,
    page_end: 18,
    topics_count: 4,
    status: 'verified',
  },
  {
    id: 'chap-2-force-motion',
    document_id: 'doc-demo-class10-physics',
    title: 'Force and Motion',
    chapter_number: 2,
    page_start: 19,
    page_end: 42,
    topics_count: 5,
    status: 'verified',
  },
  {
    id: 'chap-3-heat',
    document_id: 'doc-demo-class10-physics',
    title: 'Heat and Thermal Expansion',
    chapter_number: 3,
    page_start: 43,
    page_end: 60,
    topics_count: 4,
    status: 'verified',
  },
  {
    id: 'chap-4-light',
    document_id: 'doc-demo-class10-physics',
    title: 'Light and Refraction',
    chapter_number: 4,
    page_start: 61,
    page_end: 85,
    topics_count: 6,
    status: 'verified',
  },
  {
    id: 'chap-5-electricity',
    document_id: 'doc-demo-class10-physics',
    title: 'Electricity and Electric Current',
    chapter_number: 5,
    page_start: 86,
    page_end: 112,
    topics_count: 6,
    status: 'verified',
  },
  {
    id: 'chap-6-magnetism',
    document_id: 'doc-demo-class10-physics',
    title: 'Magnetism and Electromagnetism',
    chapter_number: 6,
    page_start: 113,
    page_end: 138,
    topics_count: 5,
    status: 'verified',
  },
];

export const DEMO_TOPICS: Topic[] = [
  // Measurement
  { id: 'top-1-1', chapter_id: 'chap-1-measurement', document_id: 'doc-demo-class10-physics', title: 'Fundamental & Derived Units' },
  { id: 'top-1-2', chapter_id: 'chap-1-measurement', document_id: 'doc-demo-class10-physics', title: 'SI System and Standards' },
  { id: 'top-1-3', chapter_id: 'chap-1-measurement', document_id: 'doc-demo-class10-physics', title: 'Vernier Calipers & Screw Gauge' },
  { id: 'top-1-4', chapter_id: 'chap-1-measurement', document_id: 'doc-demo-class10-physics', title: 'Measurement of Mass and Density' },
  // Force & Motion
  { id: 'top-2-1', chapter_id: 'chap-2-force-motion', document_id: 'doc-demo-class10-physics', title: "Newton's First Law of Motion & Inertia" },
  { id: 'top-2-2', chapter_id: 'chap-2-force-motion', document_id: 'doc-demo-class10-physics', title: "Newton's Second Law & Momentum" },
  { id: 'top-2-3', chapter_id: 'chap-2-force-motion', document_id: 'doc-demo-class10-physics', title: "Action & Reaction (Third Law)" },
  { id: 'top-2-4', chapter_id: 'chap-2-force-motion', document_id: 'doc-demo-class10-physics', title: 'Conservation of Linear Momentum' },
  { id: 'top-2-5', chapter_id: 'chap-2-force-motion', document_id: 'doc-demo-class10-physics', title: 'Friction and its Applications' },
  // Heat
  { id: 'top-3-1', chapter_id: 'chap-3-heat', document_id: 'doc-demo-class10-physics', title: 'Thermal Expansion of Solids & Liquids' },
  { id: 'top-3-2', chapter_id: 'chap-3-heat', document_id: 'doc-demo-class10-physics', title: 'Anomalous Expansion of Water' },
  { id: 'top-3-3', chapter_id: 'chap-3-heat', document_id: 'doc-demo-class10-physics', title: 'Specific Heat Capacity' },
  { id: 'top-3-4', chapter_id: 'chap-3-heat', document_id: 'doc-demo-class10-physics', title: 'Principle of Calorimetry' },
  // Light
  { id: 'top-4-1', chapter_id: 'chap-4-light', document_id: 'doc-demo-class10-physics', title: 'Refraction of Light & Snell’s Law' },
  { id: 'top-4-2', chapter_id: 'chap-4-light', document_id: 'doc-demo-class10-physics', title: 'Refractive Index and Speed of Light' },
  { id: 'top-4-3', chapter_id: 'chap-4-light', document_id: 'doc-demo-class10-physics', title: 'Total Internal Reflection & Critical Angle' },
  { id: 'top-4-4', chapter_id: 'chap-4-light', document_id: 'doc-demo-class10-physics', title: 'Spherical Lenses & Ray Diagrams' },
  { id: 'top-4-5', chapter_id: 'chap-4-light', document_id: 'doc-demo-class10-physics', title: 'Lens Formula & Power of a Lens' },
  // Electricity
  { id: 'top-5-1', chapter_id: 'chap-5-electricity', document_id: 'doc-demo-class10-physics', title: "Ohm's Law and Resistance (V = IR)" },
  { id: 'top-5-2', chapter_id: 'chap-5-electricity', document_id: 'doc-demo-class10-physics', title: 'Factors Affecting Resistance & Resistivity' },
  { id: 'top-5-3', chapter_id: 'chap-5-electricity', document_id: 'doc-demo-class10-physics', title: 'Series and Parallel Resistor Combinations' },
  { id: 'top-5-4', chapter_id: 'chap-5-electricity', document_id: 'doc-demo-class10-physics', title: "Joule's Law of Heating Effect (H = I²Rt)" },
  { id: 'top-5-5', chapter_id: 'chap-5-electricity', document_id: 'doc-demo-class10-physics', title: 'Electric Power and Commercial Unit of Energy (kWh)' },
  // Magnetism
  { id: 'top-6-1', chapter_id: 'chap-6-magnetism', document_id: 'doc-demo-class10-physics', title: 'Magnetic Field & Field Lines' },
  { id: 'top-6-2', chapter_id: 'chap-6-magnetism', document_id: 'doc-demo-class10-physics', title: "Oersted's Experiment & Right-Hand Thumb Rule" },
  { id: 'top-6-3', chapter_id: 'chap-6-magnetism', document_id: 'doc-demo-class10-physics', title: "Fleming's Left-Hand Rule & Electric Motor" },
  { id: 'top-6-4', chapter_id: 'chap-6-magnetism', document_id: 'doc-demo-class10-physics', title: 'Electromagnetic Induction & Faraday’s Laws' },
  { id: 'top-6-5', chapter_id: 'chap-6-magnetism', document_id: 'doc-demo-class10-physics', title: "Lenz's Law and Electric Generator" },
];

export const DEMO_KNOWLEDGE_CHUNKS: KnowledgeChunk[] = [
  // Chapter 1: Measurement & System of Units
  {
    id: 'chunk-meas-units-1',
    document_id: 'doc-demo-class10-physics',
    chapter_id: 'chap-1-measurement',
    topic_id: 'top-1-1',
    page_start: 3,
    page_end: 6,
    extraction_confidence: 0.96,
    text: `Section 1.2: Fundamental and Derived Physical Quantities and SI Units.
A physical quantity is any property of a material or system that can be quantified and measured with a suitable measuring tool.
Physical quantities are classified into two broad categories:
1. Fundamental Quantities: Quantities that are independent of each other and cannot be expressed in terms of other physical quantities. In the International System of Units (SI), there are 7 fundamental quantities: Length (meter, m), Mass (kilogram, kg), Time (second, s), Electric current (ampere, A), Thermodynamic temperature (kelvin, K), Amount of substance (mole, mol), and Luminous intensity (candela, cd).
2. Derived Quantities: Quantities that are derived mathematically from fundamental quantities by multiplication or division, such as Velocity (m/s), Acceleration (m/s²), Force (Newton, N = kg·m/s²), Density (kg/m³), and Pressure (Pascal, Pa = N/m²).
বাংলা অনুবাদ ও ব্যাখ্যা:
পরিমাপ ও একক: যে সমস্ত প্রাকৃতিক বিষয়কে প্রত্যক্ষ বা পরোক্ষভাবে পরিমাপ করা যায় তাদের ভৌত রাশি বলে। মৌলিক রাশি (যেমন দৈর্ঘ্য, ভর, সময়, তাপমাত্রা ইত্যাদি) একে অপরের উপর নির্ভর করে না। লব্ধ রাশি মৌলিক রাশিগুলির গুণ বা ভাগের মাধ্যমে গঠিত হয় (যেমন বেগ, ত্বরণ, বল, ঘনত্ব ইত্যাদি)।`,
  },
  {
    id: 'chunk-meas-inst-2',
    document_id: 'doc-demo-class10-physics',
    chapter_id: 'chap-1-measurement',
    topic_id: 'top-1-3',
    page_start: 11,
    page_end: 14,
    extraction_confidence: 0.95,
    text: `Section 1.4: Precision Measuring Instruments - Vernier Calipers and Screw Gauge.
Standard meter rulers can measure lengths accurately up to 1 mm (0.1 cm). To measure smaller dimensions, precision instruments are required:
1. Vernier Calipers: Invented by Pierre Vernier. It consists of a main scale and a sliding vernier scale.
Vernier Constant (VC) = Value of 1 Main Scale Division (MSD) - Value of 1 Vernier Scale Division (VSD).
If 10 vernier divisions coincide with 9 main scale divisions (each 1 mm):
VC = 1 mm - 0.9 mm = 0.1 mm = 0.01 cm.
Total Reading = Main Scale Reading (MSR) + (Vernier Coincidence × VC).
2. Screw Gauge / Micrometer: Works on the principle of the screw in a nut.
Pitch = Distance moved along the linear axis in one complete rotation of the thimble.
Least Count (LC) = Pitch / Total number of circular scale divisions. For a standard screw gauge with pitch 1 mm and 100 divisions: LC = 1 mm / 100 = 0.01 mm = 0.001 cm.
বাংলা অনুবাদ:
ভার্নিয়ার ধ্রুবক ও স্ক্রু গেজ: সাধারণ স্কেলে ক্ষুদ্রতম পাঠ ১ মিমি। ভার্নিয়ার স্কেলে ভার্নিয়ার ধ্রুবক (VC) = ১ মূল স্কেল ভাগ - ১ ভার্নিয়ার স্কেল ভাগ = ০.০১ সেমি। স্ক্রু গেজের লঘিষ্ঠ গণন (Least Count) = পিচ / বৃত্তাকার স্কেলের মোট ভাগসংখ্যা = ০.০১ মিমি।`,
  },
  // Chapter 2: Force and Motion
  {
    id: 'chunk-force-newton2-1',
    document_id: 'doc-demo-class10-physics',
    chapter_id: 'chap-2-force-motion',
    topic_id: 'top-2-2',
    page_start: 24,
    page_end: 27,
    extraction_confidence: 0.95,
    text: `Section 2.4: Newton's Second Law of Motion.
Linear momentum (p) of a body is defined as the product of its mass (m) and velocity (v): p = mv.
Newton's Second Law: The rate of change of momentum of an object is directly proportional to the applied unbalanced external force and takes place in the direction in which the force acts.
Derivation of F = ma:
Let a body of mass m move with initial velocity u. When an external force F acts on it for time t, its velocity changes to v.
Initial momentum p₁ = mu; Final momentum p₂ = mv.
Change in momentum = mv - mu = m(v - u).
Rate of change of momentum = m(v - u) / t = ma (since acceleration a = (v - u) / t).
According to Newton's 2nd Law: F ∝ ma, or F = k · ma. In SI units, 1 Newton is defined such that k = 1.
Therefore: F = ma (Force = Mass × Acceleration).
বাংলা অনুবাদ:
নিউটন এর দ্বিতীয় গতিসূত্র: কোনো বস্তুর ভরবেগের পরিবর্তনের হার প্রযুক্ত বলের সমানুপাতিক এবং বল যেদিকে প্রযুক্ত হয় ভরবেগের পরিবর্তনও সেদিকে ঘটে। গাণিতিক প্রতিপাদন: F = ma।`,
  },
  {
    id: 'chunk-force-inertia-2',
    document_id: 'doc-demo-class10-physics',
    chapter_id: 'chap-2-force-motion',
    topic_id: 'top-2-1',
    page_start: 20,
    page_end: 23,
    extraction_confidence: 0.94,
    text: `Section 2.2: Newton's First Law of Motion and Concept of Inertia.
Newton's First Law states: Every body continues in its state of rest or of uniform motion in a straight line unless compelled to change that state by an external unbalanced force.
Inertia: The inherent property of a body by virtue of which it resists any change in its state of rest or uniform rectilinear motion.
Inertia is directly proportional to the mass of the body; mass is the quantitative measure of inertia.
Two types of inertia:
1. Inertia of Rest: Tendency to remain at rest (e.g., passengers jerk backward when a bus starts suddenly).
2. Inertia of Motion: Tendency to continue moving (e.g., passengers lurch forward when brakes are applied).
বাংলা অনুবাদ:
জাড্যধর্ম ও নিউটনের প্রথম গতিসূত্র: বাইরে থেকে বল প্রয়োগ না করলে স্থির বস্তু চিরকাল স্থির থাকবে এবং সচল বস্তু চিরকাল সমবেগে সরলরেখায় চলতে থাকবে। ভর হলো বস্তুর জাড্যের পরিমাপ। স্থিতি জাড্য ও গতি জাড্য এর প্রধান উদাহরণ।`,
  },
  // Chapter 3: Heat and Thermal Expansion
  {
    id: 'chunk-heat-expansion-1',
    document_id: 'doc-demo-class10-physics',
    chapter_id: 'chap-3-heat',
    topic_id: 'top-3-1',
    page_start: 45,
    page_end: 48,
    extraction_confidence: 0.95,
    text: `Section 3.2: Thermal Expansion of Solids - Coefficients of Linear, Superficial, and Cubical Expansion.
Almost all solid substances expand when heated and contract when cooled due to the increased amplitude of atomic thermal vibrations.
1. Coefficient of Linear Expansion (α): The fractional increase in length of a solid rod per unit original length per unit rise in temperature.
α = (L₂ - L₁) / [L₁ · (T₂ - T₁)]  => Units: °C⁻¹ or K⁻¹.
2. Coefficient of Superficial (Area) Expansion (β):
β = (A₂ - A₁) / [A₁ · (T₂ - T₁)]  => Units: °C⁻¹ or K⁻¹.
3. Coefficient of Cubical (Volume) Expansion (γ):
γ = (V₂ - V₁) / [V₁ · (T₂ - T₁)]  => Units: °C⁻¹ or K⁻¹.
Relationship among coefficients for an isotropic homogeneous solid:
α : β : γ = 1 : 2 : 3, or β = 2α and γ = 3α.
বাংলা অনুবাদ ও ব্যাখ্যা:
কঠিনের তাপীয় প্রসারণ: তাপমাত্রা বৃদ্ধিতে কঠিন পদার্থের দৈর্ঘ্য, ক্ষেত্রফল ও আয়তন বৃদ্ধি পায়। দৈর্ঘ্য প্রসারণ গুণাঙ্ক (α), ক্ষেত্র প্রসারণ গুণাঙ্ক (β), এবং আয়তন প্রসারণ গুণাঙ্ক (γ)। এদের পারস্পরিক সম্পর্ক: α = β/2 = γ/3, অর্থাৎ α : β : γ = ১ : ২ : ৩।`,
  },
  {
    id: 'chunk-heat-water-2',
    document_id: 'doc-demo-class10-physics',
    chapter_id: 'chap-3-heat',
    topic_id: 'top-3-2',
    page_start: 51,
    page_end: 54,
    extraction_confidence: 0.96,
    text: `Section 3.4: Anomalous Expansion of Water and Aquatic Life Survival.
Most liquids expand continuously when their temperature increases. Water exhibits an exceptional anomalous behavior between 0 °C and 4 °C:
When water at 0 °C is heated, instead of expanding, it contracts, and its volume decreases until it reaches 4 °C.
Above 4 °C, water expands normally like other liquids.
Therefore, at 4 °C:
- Volume of water is minimum.
- Density of water is maximum (1.000 g/cm³ or 1000 kg/m³).
Biological significance: In cold winter regions, surface water cools down to 4 °C, becomes denser, and sinks to the bottom. Once the entire water body reaches 4 °C, further cooling at the surface produces lighter water (< 4 °C) which freezes into ice at 0 °C. Because ice is less dense and a poor conductor of heat, it floats at the top, insulating the water beneath at 4 °C. This allows fish and aquatic organisms to survive beneath the frozen surface.
বাংলা অনুবাদ:
জলের ব্যতিক্রমী প্রসারণ: ০°C থেকে ৪°C পর্যন্ত জলের উষ্ণতা বৃদ্ধি করলে জলের আয়তন না বেড়ে কমে এবং ৪°C উষ্ণতায় জলের আয়তন সর্বনিম্ন ও ঘনত্ব সর্বাধিক হয় (১০০০ কেজি/মি³)। শীতপ্রধান দেশে জলাশয়ের উপরিভাগ বরফে পরিণত হলেও তলদেশের জলের উষ্ণতা ৪°C থাকে, যার ফলে জলচর প্রাণীরা জীবিত থাকতে পারে।`,
  },
  // Chapter 4: Light and Refraction
  {
    id: 'chunk-light-snell-1',
    document_id: 'doc-demo-class10-physics',
    chapter_id: 'chap-4-light',
    topic_id: 'top-4-1',
    page_start: 64,
    page_end: 66,
    extraction_confidence: 0.95,
    text: `Section 4.3: Laws of Refraction and Snell's Law.
When a ray of light travels obliquely from one transparent optical medium to another, it deviates from its initial straight path at the interface of the two media.
First Law: The incident ray, the refracted ray, and the normal to the interface at the point of incidence all lie in the same geometric plane.
Second Law (Snell's Law): For a light of given color (wavelength) and for a given pair of media, the ratio of the sine of the angle of incidence (i) to the sine of the angle of refraction (r) is constant.
Mathematical expression:
sin(i) / sin(r) = constant = ₁μ₂ (refractive index of medium 2 relative to medium 1).
বাংলা অনুবাদ:
প্রতিসরণের সূত্র ও স্নেলের সূত্র: আপতিত রশ্মি, প্রতিসৃত রশ্মি এবং আপতন বিন্দুতে দুই মাধ্যমের বিভেদতলের উপর অঙ্কিত অভিলম্ব একই সমতলে থাকে। নির্দিষ্ট বর্ণের আলো এবং নির্দিষ্ট মাধ্যমদ্বয়ের ক্ষেত্রে আপতন কোণের সাইন ও প্রতিসরণ কোণের সাইনের অনুপাত সর্বদা ধ্রুবক থাকে (sin i / sin r = μ)।`,
  },
  {
    id: 'chunk-light-lens-2',
    document_id: 'doc-demo-class10-physics',
    chapter_id: 'chap-4-light',
    topic_id: 'top-4-4',
    page_start: 72,
    page_end: 76,
    extraction_confidence: 0.94,
    text: `Section 4.5: Spherical Lenses, Lens Formula and Power.
A lens is a transparent optical medium bounded by two curved surfaces, at least one of which is spherical.
1. Convex (Converging) Lens: Thicker in the middle and thinner at edges.
2. Concave (Diverging) Lens: Thinner in the middle and thicker at edges.
Lens Formula:
1/v - 1/u = 1/f
(where u = object distance, v = image distance, and f = focal length according to Cartesian sign convention).
Magnification (m) = Image height / Object height = v / u.
Power of a Lens (P): The ability of a lens to converge or diverge light rays incident on it.
P = 1 / f (where f is focal length in meters).
SI Unit of Power: Diopter (D). 1 Diopter is the power of a lens having a focal length of 1 meter (1 D = 1 m⁻¹). Convex lenses have positive power (+D); concave lenses have negative power (-D).
বাংলা অনুবাদ:
লেন্স ও লেন্সের ক্ষমতা: লেন্সের সাধারণ সমীকরণ: 1/v - 1/u = 1/f। লেন্সের ক্ষমতা P = 1/f (মিটার এককে)। ক্ষমতার এসআই একক হলো ডাইঅপ্টার (D)। উত্তল লেন্সের ক্ষমতা ধনাত্মক এবং অবতল লেন্সের ক্ষমতা ঋণাত্মক।`,
  },
  // Chapter 5: Electricity and Electric Current
  {
    id: 'chunk-elec-ohm-1',
    document_id: 'doc-demo-class10-physics',
    chapter_id: 'chap-5-electricity',
    topic_id: 'top-5-1',
    page_start: 90,
    page_end: 92,
    extraction_confidence: 0.96,
    text: `Section 5.2: Ohm's Law and Mathematical Formulation.
In 1827, German physicist Georg Simon Ohm studied the relationship between the potential difference across a conductor and the electric current passing through it.
Ohm's Law Statement: At constant temperature and other physical conditions remaining unchanged, the electric current (I) flowing through a metallic conductor is directly proportional to the potential difference (V) applied across its two terminals.
Mathematical expression:
V ∝ I
Or, V / I = R (where R is a constant of proportionality termed Resistance).
Therefore: V = I × R.
SI Unit: Potential difference V is measured in Volts (V), current I in Amperes (A), and resistance R in Ohms (Ω). One Ohm is defined as the resistance of a conductor through which 1 Ampere current flows when a potential difference of 1 Volt is applied across its ends.
বাংলা অনুবাদ ও ব্যাখ্যা:
ওহমের সূত্র: উষ্ণতা ও অন্যান্য ভৌত অবস্থা অপরিবর্তিত থাকলে কোনো পরিবাহীর মধ্য দিয়ে তড়িৎপ্রবাহমাত্রা পরিবাহীর দুই প্রান্তের বিভবপ্রভেদের সমানুপাতিক। গাণিতিক রূপ: V = IR।`,
  },
  {
    id: 'chunk-elec-joule-2',
    document_id: 'doc-demo-class10-physics',
    chapter_id: 'chap-5-electricity',
    topic_id: 'top-5-4',
    page_start: 101,
    page_end: 103,
    extraction_confidence: 0.94,
    text: `Section 5.6: Heating Effect of Electric Current - Joule's Law.
When an electric current flows through a conductor offering resistance, electrical energy is converted into heat energy.
Joule formulated three laws governing the heat produced (H):
1. First Law: The heat produced in a conductor of given resistance for a given time is directly proportional to the square of the electric current passing through it (H ∝ I² when R and t are constant).
2. Second Law: The heat produced for a given current and time is directly proportional to the resistance of the conductor (H ∝ R when I and t are constant).
3. Third Law: The heat produced in a given conductor carrying a given current is directly proportional to the duration of current flow (H ∝ t when I and R are constant).
Combining the three laws: H ∝ I²Rt. In SI units: H = I²Rt Joules. In calories: H = (I²Rt) / 4.18 cal.
বাংলা অনুবাদ:
জুলের সূত্র: পরিবাহীতে উৎপন্ন তাপ প্রবাহমাত্রার বর্গের সমানুপাতিক (H ∝ I²), রোধের সমানুপাতিক (H ∝ R), এবং প্রবাহকালের সমানুপাতিক (H ∝ t)। গাণিতিক রূপ: H = (I²Rt)/J ক্যালোরি।`,
  },
  // Chapter 6: Magnetism and Electromagnetism
  {
    id: 'chunk-mag-oersted-1',
    document_id: 'doc-demo-class10-physics',
    chapter_id: 'chap-6-magnetism',
    topic_id: 'top-6-2',
    page_start: 116,
    page_end: 119,
    extraction_confidence: 0.96,
    text: `Section 6.2: Magnetic Effect of Electric Current - Oersted's Experiment & Right-Hand Thumb Rule.
In 1820, Christian Oersted discovered that when an electric current is passed through a conducting wire held parallel to a magnetic needle, the needle gets deflected. This proved that a magnetic field is produced around any current-carrying conductor.
Right-Hand Thumb Rule (Maxwell's Corkscrew Rule):
Imagine that you are holding a current-carrying straight conductor in your right hand such that the thumb points in the direction of the electric current. Then your wrapped fingers will curl around the conductor in the direction of the concentric magnetic field lines.
Properties of Magnetic Field Lines:
1. They originate from the North Pole and terminate at the South Pole outside the magnet, and continue from South to North inside, forming continuous closed loops.
2. The tangent at any point on a field line gives the direction of the magnetic field at that point.
3. Two magnetic field lines NEVER intersect each other, because if they did, the compass needle at the intersection would point in two different directions simultaneously, which is impossible.
বাংলা অনুবাদ:
অরস্টেডের পরীক্ষা ও ডান হাতের বৃদ্ধাঙ্গুলি নিয়ম: পরিবাহী তারের মধ্য দিয়ে তড়িৎ প্রবাহিত হলে তার চারপাশে চৌম্বক ক্ষেত্র সৃষ্টি হয়। ডান হাতের বৃদ্ধাঙ্গুষ্ঠ তড়িৎপ্রবাহের দিক নির্দেশ করলে বাঁকানো আঙুলগুলি চৌম্বক বলরেখার দিক নির্দেশ করে। দুটি চৌম্বক বলরেখা কখনো পরস্পরকে ছেদ করতে পারে না।`,
  },
  {
    id: 'chunk-mag-induction-2',
    document_id: 'doc-demo-class10-physics',
    chapter_id: 'chap-6-magnetism',
    topic_id: 'top-6-4',
    page_start: 125,
    page_end: 129,
    extraction_confidence: 0.95,
    text: `Section 6.4: Electromagnetic Induction - Faraday's Laws and Lenz's Law.
In 1831, Michael Faraday demonstrated that a changing magnetic flux through a closed circuit induces an electromotive force (EMF) and an induced electric current in the circuit.
Faraday's Laws of Electromagnetic Induction:
1. First Law: Whenever there is a relative motion between a magnet and a coil (i.e. changing magnetic flux linked with a closed circuit), an induced EMF is set up in the circuit which lasts as long as the change in magnetic flux continues.
2. Second Law: The magnitude of the induced EMF (e) in a circuit is directly proportional to the time rate of change of magnetic flux (Φ) through the circuit: e ∝ (dΦ / dt).
Lenz's Law (Direction of Induced Current):
The direction of an induced EMF and current is always such as to oppose the very cause (change in magnetic flux) that produces it.
Mathematical formulation: e = - N (dΦ / dt) (where N is number of turns and the negative sign represents Lenz's law).
Lenz's law is a direct consequence of the Law of Conservation of Energy.
বাংলা অনুবাদ:
তড়িৎচৌম্বকীয় আবেশ ও ফ্যারাডের সূত্র: কোনো বদ্ধ কুণ্ডলীতে জড়িত চৌম্বক প্রবাহের পরিবর্তন ঘটলে কুণ্ডলীতে তড়িৎচালক বল আবিষ্ট হয় এবং আবিষ্ট তড়িৎচালক বল চৌম্বক প্রবাহের পরিবর্তনের হারের সমানুপাতিক। লেঞ্জের সূত্র: আবিষ্ট তড়িৎপ্রবাহের অভিমুখ এমন হয় যে এটি সর্বদা তার সৃষ্টির কারণকে বাধা দেয় (লেঞ্জের সূত্র শক্তির সংরক্ষণ সূত্রের একটি রূপান্তর)।`,
  },
];

export const DEMO_QUESTIONS: QuestionItem[] = [
  {
    id: 'q-demo-1',
    user_id: 'teacher-101',
    document_id: 'doc-demo-class10-physics',
    chapter_id: 'chap-5-electricity',
    topic_id: 'top-5-1',
    book_name: 'Class X Physical Science',
    chapter_name: 'Electricity and Electric Current',
    topic_name: "Ohm's Law and Resistance",
    question_text: "State Ohm's law and write down its mathematical expression. Define 1 Ohm resistance in SI units.",
    question_type: 'short_answer',
    marks: 3,
    difficulty: 'moderate',
    bloom_level: 'understand',
    language: 'en',
    status: 'approved',
    created_at: '2026-09-18T14:20:00Z',
    updated_at: '2026-09-18T14:22:00Z',
    answer: {
      id: 'ans-demo-1',
      question_id: 'q-demo-1',
      answer_text: `Ohm's Law: At constant temperature and other physical conditions remaining unchanged, the electric current passing through a conductor is directly proportional to the potential difference applied across its two terminals.
Mathematical expression:
V ∝ I  =>  V = IR (where R is the resistance of the conductor).

Definition of 1 Ohm:
One Ohm (1 Ω) is the resistance of a conductor through which a current of 1 Ampere flows when a potential difference of 1 Volt is maintained across its ends (1 Ω = 1 V / 1 A).`,
      marking_scheme: [
        { criterion: "Accurate statement of Ohm's law with condition (constant temperature)", marks: 1 },
        { criterion: "Correct mathematical formula (V = IR) with symbol definition", marks: 1 },
        { criterion: "Precise definition of 1 Ohm with units (1 V / 1 A)", marks: 1 },
      ],
    },
    source: {
      id: 'src-demo-1',
      question_id: 'q-demo-1',
      document_id: 'doc-demo-class10-physics',
      book_title: 'Class X Physical Science',
      chapter_title: 'Electricity and Electric Current',
      page_start: 90,
      page_end: 92,
      source_text: `Ohm's Law Statement: At constant temperature and other physical conditions remaining unchanged, the electric current (I) flowing through a metallic conductor is directly proportional to the potential difference (V)... V = I × R. One Ohm is defined as the resistance of a conductor through which 1 Ampere current flows when a potential difference of 1 Volt is applied...`,
      source_confidence: 0.96,
    },
  },
  {
    id: 'q-demo-2',
    user_id: 'teacher-101',
    document_id: 'doc-demo-class10-physics',
    chapter_id: 'chap-4-light',
    topic_id: 'top-4-1',
    book_name: 'Class X Physical Science',
    chapter_name: 'Light and Refraction',
    topic_name: "Refraction & Snell's Law",
    question_text: "আলোর প্রতিসরণ সংক্রান্ত স্নেলের সূত্রটি বিবৃতি কর এবং এর গাণিতিক রূপটি লেখ। শূন্যস্থানে আলোর বেগ ও কোনো মাধ্যমে আলোর বেগের সম্পর্ক উল্লেখ কর।",
    question_type: 'short_answer',
    marks: 2,
    difficulty: 'easy',
    bloom_level: 'remember',
    language: 'bn',
    status: 'approved',
    created_at: '2026-09-20T11:15:00Z',
    updated_at: '2026-09-20T11:15:00Z',
    answer: {
      id: 'ans-demo-2',
      question_id: 'q-demo-2',
      answer_text: `স্নেলের সূত্র: নির্দিষ্ট দুটি মাধ্যমের ক্ষেত্রে এবং নির্দিষ্ট বর্ণের আলোর জন্য আপতন কোণের সাইন (sin i) এবং প্রতিসরণ কোণের সাইনের (sin r) অনুপাত সর্বদা ধ্রুবক থাকে।
গাণিতিক রূপ:
sin i / sin r = μ (যেখানে μ হলো প্রথম মাধ্যমের সাপেক্ষে দ্বিতীয় মাধ্যমের প্রতিসরাঙ্ক)।

আলোর বেগের সম্পর্ক:
μ = c / v (যেখানে c = শূন্যস্থানে আলোর বেগ, v = মাধ্যমে আলোর বেগ)।`,
      marking_scheme: [
        { criterion: "স্নেলের সূত্রের সঠিক বিবৃতি ও শর্ত", marks: 1 },
        { criterion: "গাণিতিক রূপ (sin i / sin r = μ) ও আলোর বেগের সম্পর্ক", marks: 1 },
      ],
    },
    source: {
      id: 'src-demo-2',
      question_id: 'q-demo-2',
      document_id: 'doc-demo-class10-physics',
      book_title: 'Class X Physical Science',
      chapter_title: 'Light and Refraction',
      page_start: 64,
      page_end: 66,
      source_text: `Second Law (Snell's Law): For a light of given color (wavelength) and for a given pair of media, the ratio of the sine of the angle of incidence (i) to the sine of the angle of refraction (r) is constant: sin(i) / sin(r) = constant = μ...`,
      source_confidence: 0.95,
    },
  },
  {
    id: 'q-demo-3',
    user_id: 'teacher-101',
    document_id: 'doc-demo-class10-physics',
    chapter_id: 'chap-2-force-motion',
    topic_id: 'top-2-2',
    book_name: 'Class X Physical Science',
    chapter_name: 'Force and Motion',
    topic_name: "Newton's Second Law & Momentum",
    question_text: "A constant force acts on an object of mass 5 kg for a duration of 2 seconds. It increases the object's velocity from 3 m/s to 7 m/s. Find the magnitude of the applied force. Also write Newton's 2nd Law in mathematical form.",
    question_type: 'numerical',
    marks: 3,
    difficulty: 'moderate',
    bloom_level: 'apply',
    language: 'en',
    status: 'approved',
    created_at: '2026-09-22T09:40:00Z',
    updated_at: '2026-09-22T09:40:00Z',
    answer: {
      id: 'ans-demo-3',
      question_id: 'q-demo-3',
      answer_text: `Solution:
Given:
Mass of object (m) = 5 kg
Initial velocity (u) = 3 m/s
Final velocity (v) = 7 m/s
Time interval (t) = 2 s

Step 1: Calculate acceleration (a)
a = (v - u) / t = (7 - 3) / 2 = 4 / 2 = 2 m/s²

Step 2: Calculate Force (F)
According to Newton's Second Law of Motion:
F = m × a = 5 kg × 2 m/s² = 10 N

Answer: The magnitude of the applied force is 10 Newtons (N).`,
      marking_scheme: [
        { criterion: "Formula & calculation of acceleration (a = 2 m/s²)", marks: 1 },
        { criterion: "Formula of force F = ma with substitution", marks: 1 },
        { criterion: "Final correct answer with SI unit (10 N)", marks: 1 },
      ],
    },
    source: {
      id: 'src-demo-3',
      question_id: 'q-demo-3',
      document_id: 'doc-demo-class10-physics',
      book_title: 'Class X Physical Science',
      chapter_title: 'Force and Motion',
      page_start: 24,
      page_end: 27,
      source_text: `Newton's Second Law: The rate of change of momentum of an object is directly proportional to the applied unbalanced force... F = ma (Force = Mass × Acceleration)...`,
      source_confidence: 0.95,
    },
  },
  {
    id: 'q-demo-4',
    user_id: 'teacher-101',
    document_id: 'doc-demo-class10-physics',
    chapter_id: 'chap-5-electricity',
    topic_id: 'top-5-4',
    book_name: 'Class X Physical Science',
    chapter_name: 'Electricity and Electric Current',
    topic_name: "Joule's Law of Heating Effect",
    question_text: "According to Joule's law of heating in an electric circuit, what happens to the heat produced in a resistor if the electric current is doubled while the resistance and time remain constant?\n(A) It becomes halved\n(B) It remains unchanged\n(C) It becomes doubled\n(D) It becomes four times",
    options: [
      "(A) It becomes halved",
      "(B) It remains unchanged",
      "(C) It becomes doubled",
      "(D) It becomes four times"
    ],
    question_type: 'mcq',
    marks: 1,
    difficulty: 'easy',
    bloom_level: 'understand',
    language: 'en',
    status: 'ai_generated',
    created_at: '2026-09-25T16:10:00Z',
    updated_at: '2026-09-25T16:10:00Z',
    answer: {
      id: 'ans-demo-4',
      question_id: 'q-demo-4',
      answer_text: `Correct Option: (D) It becomes four times.
Explanation:
According to Joule's first law of heating, heat generated H ∝ I² when resistance R and time t are constant.
If current I is doubled (I' = 2I), then H' ∝ (2I)² = 4I² = 4H.
Hence, the heat generated quadruples (becomes four times).`,
      marking_scheme: [
        { criterion: "Correct option (D) with relation H ∝ I²", marks: 1 },
      ],
    },
    source: {
      id: 'src-demo-4',
      question_id: 'q-demo-4',
      document_id: 'doc-demo-class10-physics',
      book_title: 'Class X Physical Science',
      chapter_title: 'Electricity and Electric Current',
      page_start: 101,
      page_end: 103,
      source_text: `Joule formulated three laws: First Law: The heat produced in a conductor is directly proportional to the square of the electric current passing through it (H ∝ I² when R and t are constant)...`,
      source_confidence: 0.94,
    },
  },
];

// ========================================================
// CLASS VI MATHEMATICS CURRICULUM DATA (70-MARK REAL EXAM)
// ========================================================

export const CLASS_VI_MATH_BOOK: DocumentItem = {
  id: 'doc-class6-math-sample',
  user_id: 'teacher-101',
  title: 'DEMO / SAMPLE — NOT FROM YOUR UPLOADED TEXTBOOK (Class VI Math)',
  file_name: 'Sample_Class_VI_Mathematics_Demo.pdf',
  file_size: 18400000,
  page_count: 220,
  language: 'Bilingual',
  status: 'ready',
  detected_chapters_count: 8,
  is_demo: true,
  teacher_confirmed: true,
  teacher_confirmed_at: '2026-09-28T09:00:00Z',
  total_extracted_chars: 168000,
  total_words: 24500,
  usable_pages_count: 216,
  attention_pages_count: 4,
  coverage_percentage: 98.2,
  created_at: '2026-09-28T09:00:00Z',
};

export const CLASS_VI_MATH_CHAPTERS: Chapter[] = [
  {
    id: 'c6-chap-1-integers',
    document_id: 'doc-class6-math',
    title: 'Integers',
    chapter_number: 1,
    page_start: 110,
    page_end: 132,
    topics_count: 4,
    status: 'verified',
  },
  {
    id: 'c6-chap-2-fractions',
    document_id: 'doc-class6-math',
    title: 'Fractions',
    chapter_number: 2,
    page_start: 133,
    page_end: 160,
    topics_count: 5,
    status: 'verified',
  },
  {
    id: 'c6-chap-3-decimals',
    document_id: 'doc-class6-math',
    title: 'Decimals',
    chapter_number: 3,
    page_start: 161,
    page_end: 184,
    topics_count: 4,
    status: 'verified',
  },
  {
    id: 'c6-chap-4-geometry',
    document_id: 'doc-class6-math',
    title: 'Basic Geometrical Ideas',
    chapter_number: 4,
    page_start: 68,
    page_end: 92,
    topics_count: 6,
    status: 'verified',
  },
  {
    id: 'c6-chap-5-elem-shapes',
    document_id: 'doc-class6-math',
    title: 'Understanding Elementary Shapes',
    chapter_number: 5,
    page_start: 93,
    page_end: 109,
    topics_count: 5,
    status: 'verified',
  },
  {
    id: 'c6-chap-6-mensuration',
    document_id: 'doc-class6-math',
    title: 'Mensuration',
    chapter_number: 6,
    page_start: 185,
    page_end: 204,
    topics_count: 4,
    status: 'verified',
  },
  {
    id: 'c6-chap-7-algebra',
    document_id: 'doc-class6-math',
    title: 'Algebra',
    chapter_number: 7,
    page_start: 205,
    page_end: 220,
    topics_count: 4,
    status: 'verified',
  },
  {
    id: 'c6-chap-8-ratio-prop',
    document_id: 'doc-class6-math',
    title: 'Ratio and Proportion',
    chapter_number: 8,
    page_start: 46,
    page_end: 67,
    topics_count: 4,
    status: 'verified',
  },
];

export const CLASS_VI_MATH_TOPICS: Topic[] = [
  // Integers
  { id: 'c6-top-1-1', chapter_id: 'c6-chap-1-integers', document_id: 'doc-class6-math', title: 'Concept of Negative Numbers & Number Line' },
  { id: 'c6-top-1-2', chapter_id: 'c6-chap-1-integers', document_id: 'doc-class6-math', title: 'Ordering & Comparison of Integers' },
  { id: 'c6-top-1-3', chapter_id: 'c6-chap-1-integers', document_id: 'doc-class6-math', title: 'Addition of Integers & Additive Inverse' },
  { id: 'c6-top-1-4', chapter_id: 'c6-chap-1-integers', document_id: 'doc-class6-math', title: 'Subtraction of Integers on Number Line' },
  // Fractions
  { id: 'c6-top-2-1', chapter_id: 'c6-chap-2-fractions', document_id: 'doc-class6-math', title: 'Fraction on the Number Line & Proper/Improper' },
  { id: 'c6-top-2-2', chapter_id: 'c6-chap-2-fractions', document_id: 'doc-class6-math', title: 'Equivalent Fractions & Simplest Form' },
  { id: 'c6-top-2-3', chapter_id: 'c6-chap-2-fractions', document_id: 'doc-class6-math', title: 'Like and Unlike Fractions & Comparison' },
  { id: 'c6-top-2-4', chapter_id: 'c6-chap-2-fractions', document_id: 'doc-class6-math', title: 'Addition and Subtraction of Fractions' },
  // Decimals
  { id: 'c6-top-3-1', chapter_id: 'c6-chap-3-decimals', document_id: 'doc-class6-math', title: 'Tenths, Hundredths & Place Value Chart' },
  { id: 'c6-top-3-2', chapter_id: 'c6-chap-3-decimals', document_id: 'doc-class6-math', title: 'Conversion between Fractions and Decimals' },
  { id: 'c6-top-3-3', chapter_id: 'c6-chap-3-decimals', document_id: 'doc-class6-math', title: 'Comparison & Money/Length/Weight Units' },
  { id: 'c6-top-3-4', chapter_id: 'c6-chap-3-decimals', document_id: 'doc-class6-math', title: 'Addition and Subtraction of Decimals' },
  // Geometry
  { id: 'c6-top-4-1', chapter_id: 'c6-chap-4-geometry', document_id: 'doc-class6-math', title: 'Points, Line Segment, Ray and Intersecting Lines' },
  { id: 'c6-top-4-2', chapter_id: 'c6-chap-4-geometry', document_id: 'doc-class6-math', title: 'Parallel Lines and Collinear Points' },
  { id: 'c6-top-4-3', chapter_id: 'c6-chap-4-geometry', document_id: 'doc-class6-math', title: 'Angles, Vertex and Arms of an Angle' },
  { id: 'c6-top-4-4', chapter_id: 'c6-chap-4-geometry', document_id: 'doc-class6-math', title: 'Triangles, Quadrilaterals and Polygons' },
  { id: 'c6-top-4-5', chapter_id: 'c6-chap-4-geometry', document_id: 'doc-class6-math', title: 'Circles: Center, Radius, Diameter, Chord, Arc, Sector' },
  // Elementary Shapes
  { id: 'c6-top-5-1', chapter_id: 'c6-chap-5-elem-shapes', document_id: 'doc-class6-math', title: 'Measuring Line Segments & Types of Angles' },
  { id: 'c6-top-5-2', chapter_id: 'c6-chap-5-elem-shapes', document_id: 'doc-class6-math', title: 'Perpendicular Lines and Perpendicular Bisector' },
  { id: 'c6-top-5-3', chapter_id: 'c6-chap-5-elem-shapes', document_id: 'doc-class6-math', title: 'Classification of Triangles (Scalene, Isosceles, Equilateral)' },
  { id: 'c6-top-5-4', chapter_id: 'c6-chap-5-elem-shapes', document_id: 'doc-class6-math', title: 'Quadrilaterals (Square, Rectangle, Parallelogram, Rhombus, Trapezium)' },
  // Mensuration
  { id: 'c6-top-6-1', chapter_id: 'c6-chap-6-mensuration', document_id: 'doc-class6-math', title: 'Perimeter of Rectangle and Regular Polygon' },
  { id: 'c6-top-6-2', chapter_id: 'c6-chap-6-mensuration', document_id: 'doc-class6-math', title: 'Word Problems on Perimeter & Fencing' },
  { id: 'c6-top-6-3', chapter_id: 'c6-chap-6-mensuration', document_id: 'doc-class6-math', title: 'Area of Rectangle and Square' },
  { id: 'c6-top-6-4', chapter_id: 'c6-chap-6-mensuration', document_id: 'doc-class6-math', title: 'Tiling Problems and Unit Conversions' },
  // Algebra
  { id: 'c6-top-7-1', chapter_id: 'c6-chap-7-algebra', document_id: 'doc-class6-math', title: 'Matchstick Patterns & Introduction to Variables' },
  { id: 'c6-top-7-2', chapter_id: 'c6-chap-7-algebra', document_id: 'doc-class6-math', title: 'Common Rules from Arithmetic and Geometry' },
  { id: 'c6-top-7-3', chapter_id: 'c6-chap-7-algebra', document_id: 'doc-class6-math', title: 'Expressions with Variables and Verbal Translation' },
  { id: 'c6-top-7-4', chapter_id: 'c6-chap-7-algebra', document_id: 'doc-class6-math', title: 'Simple Linear Equations and Solution by Trial/Transposition' },
  // Ratio and Proportion
  { id: 'c6-top-8-1', chapter_id: 'c6-chap-8-ratio-prop', document_id: 'doc-class6-math', title: 'Concept of Ratio & Simplest Form' },
  { id: 'c6-top-8-2', chapter_id: 'c6-chap-8-ratio-prop', document_id: 'doc-class6-math', title: 'Equivalent Ratios and Comparison' },
  { id: 'c6-top-8-3', chapter_id: 'c6-chap-8-ratio-prop', document_id: 'doc-class6-math', title: 'Proportion and Extremes / Means Rule' },
  { id: 'c6-top-8-4', chapter_id: 'c6-chap-8-ratio-prop', document_id: 'doc-class6-math', title: 'Unitary Method and Real-life Applications' },
];

export const CLASS_VI_MATH_CHUNKS: KnowledgeChunk[] = [
  // Integers
  {
    id: 'chunk-c6-int-1',
    document_id: 'doc-class6-math',
    chapter_id: 'c6-chap-1-integers',
    topic_id: 'c6-top-1-1',
    page_start: 112,
    page_end: 115,
    extraction_confidence: 0.98,
    text: `Chapter 1: Integers - Negative Numbers and The Number Line (Pages 112–115).
Collection of Numbers:
Natural numbers: 1, 2, 3, 4, ...
Whole numbers: 0, 1, 2, 3, ...
Negative numbers: -1, -2, -3, -4, ... which represent quantities below zero (e.g. temperature below freezing, financial debt, depth below sea level).
Integers (Z) = {..., -3, -2, -1, 0, 1, 2, 3, ...}.
Zero (0) is an integer which is neither positive nor negative.
On a horizontal number line:
1. Positive integers lie to the right of 0, and negative integers lie to the left of 0.
2. Every integer to the right of another integer is greater than it (e.g. -2 > -5, 0 > -3).
3. The absolute value of an integer x, denoted |x|, is its numerical value regardless of sign: |-7| = 7, |+5| = 5, |0| = 0.
বাংলা অনুবাদ:
পূর্ণসংখ্যা (Integers): ধনাত্মক সংখ্যা, শূন্য এবং ঋণাত্মক সংখ্যাগুলিকে একত্রে পূর্ণসংখ্যা বলে। সংখ্যারেখায় শূন্যের ডানদিকের সংখ্যা ধনাত্মক এবং বাঁদিকের সংখ্যা ঋণাত্মক। সংখ্যারেখায় যেকোনো সংখ্যার ডানদিকের সংখ্যাটি সর্বদাই বড় হয় (যেমন -২ > -৫)।`,
  },
  {
    id: 'chunk-c6-int-2',
    document_id: 'doc-class6-math',
    chapter_id: 'c6-chap-1-integers',
    topic_id: 'c6-top-1-3',
    page_start: 120,
    page_end: 124,
    extraction_confidence: 0.98,
    text: `Chapter 1: Integers - Addition, Subtraction and Additive Inverse (Pages 120–124).
Rules for Operations on Integers:
1. Adding two positive integers: Add their values and keep positive sign: (+4) + (+7) = +11.
2. Adding two negative integers: Add their values and put a negative sign: (-5) + (-8) = -13.
3. Adding one positive and one negative integer: Subtract the smaller numerical value from the larger, and attach the sign of the integer with the larger absolute value: (+9) + (-14) = -5; (-6) + (+11) = +5.
4. Additive Inverse: Two numbers whose sum is zero are called additive inverses of each other: a + (-a) = 0.
Example: Additive inverse of +8 is -8; additive inverse of -23 is +23.
5. Subtraction Rule: To subtract an integer b from a, add the additive inverse of b to a:
a - b = a + (-b)
Example: (-15) - (-8) = (-15) + (+8) = -7.
Example: (+12) - (+19) = 12 + (-19) = -7.
বাংলা অনুবাদ:
পূর্ণসংখ্যার যোগ ও বিয়োগ: দুটি ঋণাত্মক পূর্ণসংখ্যার যোগফল সর্বদা ঋণাত্মক। বিপরীত সংখ্যা (Additive inverse): a-এর বিপরীত সংখ্যা হলো (-a), কারণ a + (-a) = ০। বিয়োগ করার নিয়ম: কোনো সংখ্যা বিয়োগ করা মানে তার বিপরীত সংখ্যা যোগ করা (a - b = a + (-b))।`,
  },
  // Fractions
  {
    id: 'chunk-c6-frac-1',
    document_id: 'doc-class6-math',
    chapter_id: 'c6-chap-2-fractions',
    topic_id: 'c6-top-2-1',
    page_start: 135,
    page_end: 139,
    extraction_confidence: 0.98,
    text: `Chapter 2: Fractions - Types, Equivalence and Simplest Form (Pages 135–139).
A fraction represents a part of a whole or a collection: Fraction = Numerator / Denominator (where denominator ≠ 0).
Types of Fractions:
1. Proper Fraction: Numerator < Denominator (e.g. 3/7, 5/9, value < 1).
2. Improper Fraction: Numerator ≥ Denominator (e.g. 11/4, 7/3, value ≥ 1).
3. Mixed Fraction: A combination of a whole number and a proper fraction (e.g. 2 ¾ = (2×4 + 3)/4 = 11/4).
4. Equivalent Fractions: Two fractions that represent the same part of a whole: (a/b) = (a×k)/(b×k).
Example: 2/5 = 4/10 = 6/15 = 8/20.
Simplest Form (Lowest Terms): A fraction is in simplest form if the HCF of its numerator and denominator is 1.
Example: 36/48 divided by HCF(36,48)=12 gives 3/4.
বাংলা অনুবাদ:
ভগ্নাংশ: প্রকৃত ভগ্নাংশ (লব < হর), অপ্রকৃত ভগ্নাংশ (লব ≥ হর) এবং মিশ্র ভগ্নাংশ। সমতুল্য ভগ্নাংশ: লব ও হরকে একই অশূন্য সংখ্যা দিয়ে গুণ বা ভাগ করলে সমতুল্য ভগ্নাংশ পাওয়া যায়। লঘিষ্ঠ আকার: লব ও হরের গসাগু ১ হলে ভগ্নাংশটি লঘিষ্ঠ আকারে থাকে।`,
  },
  {
    id: 'chunk-c6-frac-2',
    document_id: 'doc-class6-math',
    chapter_id: 'c6-chap-2-fractions',
    topic_id: 'c6-top-2-4',
    page_start: 148,
    page_end: 154,
    extraction_confidence: 0.98,
    text: `Chapter 2: Fractions - Addition and Subtraction of Unlike Fractions (Pages 148–154).
Like fractions have the same denominator (e.g. 2/9 and 5/9). Sum = (2+5)/9 = 7/9.
Unlike fractions have different denominators (e.g. 3/8 and 5/12).
Algorithm to add or subtract unlike fractions:
Step 1: Find the LCM (Least Common Multiple) of the denominators.
LCM(8, 12) = 24.
Step 2: Convert each fraction into an equivalent fraction with denominator equal to LCM:
3/8 = (3×3)/(8×3) = 9/24
5/12 = (5×2)/(12×2) = 10/24
Step 3: Add or subtract numerators over the common denominator:
3/8 + 5/12 = (9 + 10)/24 = 19/24.
Subtraction Example:
4/5 - 2/3: LCM(5,3) = 15.
4/5 = 12/15, 2/3 = 10/15.
Difference = (12 - 10)/15 = 2/15.
Mixed fraction addition: 2 ½ + 3 ⅓ = (5/2) + (10/3) = (15 + 20)/6 = 35/6 = 5 ⅚.
বাংলা অনুবাদ:
অসম হরবিশিষ্ট ভগ্নাংশের যোগ ও বিয়োগ: প্রথমে হরগুলির লসাগু নির্ণয় করতে হয়। তারপর সমতুল্য ভগ্নাংশে রূপান্তরিত করে লবগুলির যোগ বা বিয়োগ করতে হয়।`,
  },
  // Decimals
  {
    id: 'chunk-c6-dec-1',
    document_id: 'doc-class6-math',
    chapter_id: 'c6-chap-3-decimals',
    topic_id: 'c6-top-3-1',
    page_start: 164,
    page_end: 170,
    extraction_confidence: 0.98,
    text: `Chapter 3: Decimals - Tenths, Hundredths, Place Value and Operations (Pages 164–170).
Place Value Structure:
Thousands (1000) | Hundreds (100) | Tens (10) | Ones (1) . Tenths (1/10) | Hundredths (1/100) | Thousandths (1/1000).
Example: In 253.48, the place value of 4 is 4/10 (four tenths) and of 8 is 8/100 (eight hundredths).
Conversion:
Fraction to decimal: 7/10 = 0.7; 3/100 = 0.03; 235/100 = 2.35.
Decimal to fraction: 0.45 = 45/100 = 9/20.
Unit Conversions:
Money: 1 Rupee = 100 paise => 65 paise = ₹ 0.65; ₹ 8 and 75 paise = ₹ 8.75.
Length: 1 m = 100 cm => 4 cm = 0.04 m; 1 km = 1000 m => 350 m = 0.35 km.
Weight: 1 kg = 1000 g => 450 g = 0.45 kg; 5 kg 75 g = 5.075 kg.
Addition and Subtraction of Decimals:
Align decimal points vertically before operating:
Example: Add 18.42 + 9.7 + 0.356 = 18.420 + 9.700 + 0.356 = 28.476.
Subtract: 34.5 - 19.85 = 34.50 - 19.85 = 14.65.
বাংলা অনুবাদ:
দশমিক ভগ্নাংশ: দশাংশ (১/১০), শতাংশ (১/১০০), সহস্রাংশ (১/১০০০)। দশমিক বিন্দুর স্থান সুনির্দিষ্ট রেখে যোগ ও বিয়োগ সম্পন্ন করতে হয়। ১০০ পয়সা = ১ টাকা, ১০০০ গ্রাম = ১ কেজি।`,
  },
  // Basic Geometrical Ideas
  {
    id: 'chunk-c6-geom-1',
    document_id: 'doc-class6-math',
    chapter_id: 'c6-chap-4-geometry',
    topic_id: 'c6-top-4-1',
    page_start: 70,
    page_end: 78,
    extraction_confidence: 0.98,
    text: `Chapter 4: Basic Geometrical Ideas - Points, Lines, Angles and Polygons (Pages 70–78).
Fundamental Definitions:
1. Point: A dimensionless mark of position, denoted by a capital letter (A, P).
2. Line Segment: Shortest path between two points. It has two definite endpoints and a measurable length. Symbol: AB.
3. Line: Extends endlessly in both directions. It has no endpoints and no fixed length. Symbol: ↔AB.
4. Ray: A portion of a line starting at a fixed initial point and going endlessly in one direction. Symbol: →OA.
5. Intersecting Lines: Two distinct lines having exactly one common point.
6. Parallel Lines: Lines in the same plane that never intersect, maintaining a constant perpendicular distance.
Polygons and Angles:
- Angle: Formed when two rays share a common initial point (vertex). Symbol: ∠ABC.
- Polygon: A simple closed figure made entirely of line segments. Triangle (3 sides), Quadrilateral (4 sides), Pentagon (5 sides).
- Circle: A simple closed curve where every boundary point is equidistant from the center.
Diameter = 2 × Radius (d = 2r). Chord joins any two points on circle; the diameter is the longest chord.
বাংলা অনুবাদ:
জ্যামিতির মৌলিক ধারণা: বিন্দু, রেখাংশ (নির্দিষ্ট দৈর্ঘ্য আছে), সরলরেখা (উভয়দিকে অসীম), রশ্মি (একটি আদিবিন্দু আছে)। কোণ (∠ABC), বহুভুজ, এবং বৃত্ত। ব্যাস = ২ × ব্যাসার্ধ (d = 2r)। ব্যাস হলো বৃত্তের বৃহত্তম জ্যা।`,
  },
  // Mensuration
  {
    id: 'chunk-c6-mens-1',
    document_id: 'doc-class6-math',
    chapter_id: 'c6-chap-6-mensuration',
    topic_id: 'c6-top-6-1',
    page_start: 188,
    page_end: 198,
    extraction_confidence: 0.99,
    text: `Chapter 6: Mensuration - Perimeter and Area (Pages 188–198).
Perimeter: The total length of the continuous boundary enclosing a closed figure.
Formulas for Perimeter:
1. Rectangle: Perimeter = 2 × (Length + Breadth) = 2(l + b).
2. Square: Perimeter = 4 × Side = 4s.
3. Equilateral Triangle: Perimeter = 3 × Side = 3s.
4. Regular Polygon with n sides: Perimeter = n × length of one side.
Area: The amount of region enclosed inside the boundary of a closed planar figure.
Formulas for Area:
1. Rectangle: Area = Length × Breadth = l × b (Unit: sq cm or m²).
2. Square: Area = Side × Side = s² (Unit: sq cm or m²).
Practical Word Problem Standard:
Cost of fencing around a rectangular park = Perimeter × Cost per meter.
Cost of paving tiles / flooring = Area × Cost per square meter.
Number of tiles required = (Total area of floor) / (Area of one tile).
Example: A room is 8 m long and 6 m wide. Its perimeter = 2(8+6) = 28 m. Its area = 8 × 6 = 48 m².
বাংলা অনুবাদ:
পরিমিতি (Mensuration): পরিসীমা = কোনো বদ্ধ ক্ষেত্রের চারপাশের মোট সীমানার দৈর্ঘ্য। আয়তক্ষেত্রের পরিসীমা = ২ × (দৈর্ঘ্য + প্রস্থ)। বর্গক্ষেত্রের পরিসীমা = ৪ × বাহুর দৈর্ঘ্য। ক্ষেত্রফল: আয়তক্ষেত্রের ক্ষেত্রফল = দৈর্ঘ্য × প্রস্থ। বর্গক্ষেত্রের ক্ষেত্রফল = বাহু × বাহু।`,
  },
  // Algebra
  {
    id: 'chunk-c6-alg-1',
    document_id: 'doc-class6-math',
    chapter_id: 'c6-chap-7-algebra',
    topic_id: 'c6-top-7-1',
    page_start: 208,
    page_end: 218,
    extraction_confidence: 0.98,
    text: `Chapter 7: Algebra - Variables, Expressions and Linear Equations (Pages 208–218).
Concept of Variable:
A variable is a quantity that can take various numerical values; its value is not fixed. It is represented by letters such as x, y, z, m, n, p.
Constants have fixed numerical values (e.g. 5, -8, 12).
Algebraic Expressions:
Operations (+, -, ×, ÷) performed on variables and constants.
1. "5 added to x" = x + 5.
2. "7 subtracted from 3 times y" = 3y - 7.
3. "Product of m and 4 divided by 9" = 4m / 9.
Equation:
An equation is a condition on a variable containing an equality sign '=' between two expressions: LHS = RHS.
Solving Simple Linear Equations:
1. x + 7 = 15  =>  x = 15 - 7  =>  x = 8.
2. y - 9 = 4   =>  y = 4 + 9   =>  y = 13.
3. 4m = 28     =>  m = 28 / 4  =>  m = 7.
4. p / 5 = 6   =>  p = 6 × 5   =>  p = 30.
5. 2n + 3 = 11 =>  2n = 11 - 3 = 8 => n = 4.
The value of the variable that makes LHS equal to RHS is called the solution or root of the equation.
বাংলা অনুবাদ:
বীজগণিত: চলরাশি (Variable) হলো যার মান নির্দিষ্ট নয় (যেমন x, y, z)। ধ্রুবক (Constant)-এর মান নির্দিষ্ট। সমীকরণ (Equation): সমান চিহ্নের দুই পাশে রাশিমালা থাকে (LHS = RHS)। সমীকরণ সমাধান: চলরাশির যে মানের জন্য উভয় পক্ষ সমান হয় তাকে সমীকরণের বীজ বা সমাধান বলে।`,
  },
  // Ratio and Proportion
  {
    id: 'chunk-c6-ratio-1',
    document_id: 'doc-class6-math',
    chapter_id: 'c6-chap-8-ratio-prop',
    topic_id: 'c6-top-8-1',
    page_start: 48,
    page_end: 58,
    extraction_confidence: 0.98,
    text: `Chapter 8: Ratio and Proportion - Ratios, Proportions and Unitary Method (Pages 48–58).
Ratio: A comparison of two quantities of the same kind by division. The ratio of a to b is written as a : b or a/b (b ≠ 0).
Rules:
1. The quantities compared must be in the same units (e.g. compare 20 cm and 1.5 m -> convert 1.5 m to 150 cm -> ratio is 20 : 150 = 2 : 15).
2. A ratio has no unit.
Proportion: An equality of two ratios: a : b = c : d, written as a : b :: c : d.
Terms: a and d are called extreme terms (extremes); b and c are called middle terms (means).
Rule of Proportion: Product of Extremes = Product of Means (a × d = b × c).
Unitary Method:
The method in which first we find the value of one unit, and then the value of the required number of units.
Example: If cost of 6 pens is ₹ 72, then cost of 1 pen = 72 / 6 = ₹ 12.
Cost of 11 pens = 11 × 12 = ₹ 132.
বাংলা অনুবাদ:
অনুপাত ও সমানুপাত: দুটি সমজাতীয় রাশির তুলনামূলক সম্পর্ককে অনুপাত বলে (a : b)। অনুপাতের কোনো একক থাকে না। চারটি রাশি a, b, c, d সমানুপাতে থাকলে প্রান্তীয় পদদ্বয়ের গুণফল = মধ্যম পদদ্বয়ের গুণফল (a × d = b × c)। ঐকিক নিয়ম: প্রথমে একটির মান বের করে প্রয়োজনীয় সংখ্যক রাশির মান নির্ণয় করা।`,
  },
];

export const DEFAULT_SECTION_BLUEPRINTS: SectionBlueprint[] = [
  {
    id: 'sec-a',
    name: 'Section A',
    description: 'Multiple Choice & Very Short Answer (1 mark each)',
    marksPerQuestion: 1,
    numberOfQuestions: 10,
    totalSectionMarks: 10,
    questionType: 'mcq',
  },
  {
    id: 'sec-b',
    name: 'Section B',
    description: 'Short Answer Type I (2 marks each)',
    marksPerQuestion: 2,
    numberOfQuestions: 10,
    totalSectionMarks: 20,
    questionType: 'short_answer',
  },
  {
    id: 'sec-c',
    name: 'Section C',
    description: 'Short Answer Type II (3 marks each)',
    marksPerQuestion: 3,
    numberOfQuestions: 8,
    totalSectionMarks: 24,
    questionType: 'short_answer',
  },
  {
    id: 'sec-d',
    name: 'Section D',
    description: 'Long Answer / Application Problem (4 marks each)',
    marksPerQuestion: 4,
    numberOfQuestions: 4,
    totalSectionMarks: 16,
    questionType: 'long_answer',
  },
];

