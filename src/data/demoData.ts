import { DocumentItem, Chapter, Topic, KnowledgeChunk, QuestionItem, User } from '../types';

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
  title: 'Class X Physical Science',
  file_name: 'Class_X_Physical_Science_NCERT_WBBSE.pdf',
  file_size: 14250000, // ~14.2 MB
  page_count: 148,
  language: 'Bilingual',
  status: 'ready',
  detected_chapters_count: 6,
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
