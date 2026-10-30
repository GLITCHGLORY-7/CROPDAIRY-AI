// CropDiary AI — Verified ICAR & TNAU Plant Pathology Reference Catalog
// Ground-truth agronomic knowledge base for disease, pest, and deficiency diagnosis.

import {
  PlantPart,
  SymptomCategory,
  DiagnosisType,
  DiagnosticAction,
} from '@/types/cropDoctor';

export interface DiseaseReferenceEntry {
  id: string;
  common_name: string;
  scientific_name: string;
  crop_names: string[]; // e.g., ['Paddy / Rice', 'Rice']
  type: DiagnosisType;
  plant_parts: PlantPart[];
  symptom_categories: SymptomCategory[];
  growth_stages: string[];
  key_symptoms: string[];
  diagnostic_summary: string;
  favorable_conditions: string;
  immediate_actions: DiagnosticAction[];
  ipm_remedies: DiagnosticAction[];
  chemical_caution: string;
  kvk_guidance: string;
}

export const DISEASE_REFERENCE_CATALOG: DiseaseReferenceEntry[] = [
  // --- PADDY / RICE ---
  {
    id: 'rice-blast',
    common_name: 'Paddy Blast (Leaf & Neck Blast)',
    scientific_name: 'Magnaporthe oryzae (Pyricularia oryzae)',
    crop_names: ['Paddy / Rice', 'Rice', 'Paddy'],
    type: 'fungal_disease',
    plant_parts: ['Leaves', 'Stem / Stalk', 'Flowers'],
    symptom_categories: ['Spots / Lesions', 'Wilting / Drooping', 'Discoloration / Yellowing'],
    growth_stages: ['Vegetative', 'Tillering', 'Panicle Initiation', 'Flowering'],
    key_symptoms: [
      'Spindle-shaped or diamond-shaped lesions with grey or whitish centers and dark reddish-brown margins',
      'Lesions enlarge and coalesce causing entire leaf blade to desiccate and dry up',
      'Blackish discoloration around panicle neck causing grain chaffiness',
    ],
    diagnostic_summary:
      'Fungal foliar pathogen favored by high nitrogen application, high humidity (>90%), cool night temperatures (18-24°C), and dew presence.',
    favorable_conditions: 'Excessive nitrogenous fertilizers, cloudy weather, prolonged leaf wetness.',
    immediate_actions: [
      {
        category: 'cultural',
        title: 'Withhold Top-Dress Nitrogen Fertilizer',
        description: 'Immediately stop urea application; excess nitrogen softens plant tissue and accelerates fungal sporulation.',
        timing: 'Immediate (Day 1)',
      },
      {
        category: 'cultural',
        title: 'Maintain Shallow Water Layer',
        description: 'Avoid field drying; maintain 2-3 cm standing water as drought stress exacerbates blast susceptibility.',
        timing: 'Ongoing',
      },
    ],
    ipm_remedies: [
      {
        category: 'biological',
        title: 'Pseudomonas fluorescens Foliar Spray',
        description: 'Spray talc-formulated Pseudomonas fluorescens @ 10 g/litre (or 2.5 kg/ha) at early onset and repeat after 10 days.',
        timing: 'Early morning or late afternoon',
        safety_precaution: 'Ensure biocontrol is fresh (within 3 months of manufacture); avoid tank-mixing with chemical fungicides.',
      },
      {
        category: 'cultural',
        title: 'Seed and Field Sanitation',
        description: 'Collect and burn severely infected tillers/straw after harvest to prevent conidia overwintering.',
        timing: 'Post-harvest',
      },
    ],
    chemical_caution:
      'If blast lesions exceed 2-5% of leaf area at panicle initiation, consult local KVK before chemical spraying. Use CIBRC-approved fungicides (such as Tricyclazole 75% WP @ 0.6 g/L or Isoprothiolane 40% EC @ 1.5 ml/L). STRICT WARNING: Do not use banned or WHO Class Ia/Ib chemicals. Always wear nitrile gloves, protective mask, and eye goggles during application.',
    kvk_guidance: 'Submit affected leaf sample to nearest Krishi Vigyan Kendra for conidia microscopic isolation.',
  },
  {
    id: 'rice-bph',
    common_name: 'Brown Plant Hopper (BPH) & Hopper Burn',
    scientific_name: 'Nilaparvata lugens',
    crop_names: ['Paddy / Rice', 'Rice', 'Paddy'],
    type: 'pest_infestation',
    plant_parts: ['Stem / Stalk', 'Leaves', 'Whole Plant'],
    symptom_categories: ['Pest / Insect Sighting', 'Discoloration / Yellowing', 'Wilting / Drooping'],
    growth_stages: ['Tillering', 'Panicle Initiation', 'Flowering', 'Fruiting / Grains / Pods'],
    key_symptoms: [
      'Brown insects clustered at the base of tillers near water level',
      'Leaves turning yellow, orange, and rapidly drying up in circular patches ("hopper burn")',
      'Sooty mold growth on lower stems due to honeydew excretion',
    ],
    diagnostic_summary:
      'Sap-sucking delphacid planthopper. Clusters at stem base, sucking phloem sap and vectoring grassy stunt virus. Causes sudden lodging in circular patches.',
    favorable_conditions: 'Dense plant canopy, warm humid weather (25-30°C), excessive synthetic pyrethroid usage which kills natural spider predators.',
    immediate_actions: [
      {
        category: 'cultural',
        title: 'Drain Standing Water for 3 to 4 Days',
        description: 'Drain field water completely to disrupt the humid microclimate at the base of the rice hills where nymphs congregate.',
        timing: 'Immediate',
      },
      {
        category: 'cultural',
        title: 'Create Alleyways (Skip Rows)',
        description: 'Part the canopy every 2-3 meters to increase sunlight penetration and air aeration.',
        timing: 'Day 1-2',
      },
    ],
    ipm_remedies: [
      {
        category: 'biological',
        title: 'Neem Oil Spray at Stem Base',
        description: 'Spray Azadirachtin 1% (10,000 ppm) @ 2 ml/litre directed strictly at the base of the tillers.',
        timing: 'Late evening',
        safety_precaution: 'Direct nozzle toward the stem base, not over the top foliage canopy.',
      },
      {
        category: 'biological',
        title: 'Conserve Natural Predators (Mirid Bugs & Spiders)',
        description: 'Avoid broad-spectrum synthetic insecticides which decimate Lycosa pseudoannulata spiders and Cyrtorhinus lividipennis predators.',
        timing: 'Continuous',
      },
    ],
    chemical_caution:
      'If nymph count exceeds Economic Threshold Level (ETL of 10-15 hoppers/hill), consult extension officials for CIBRC-approved selective insect growth regulators (such as Pymetrozine 50% WDG @ 0.6 g/L or Triflumezopyrim 10% SC @ 0.5 ml/L). STRICT WARNING: Do not apply broad-spectrum organophosphates, pyrethroids, or WHO Class Ia/Ib chemicals. Always wear full PPE.',
    kvk_guidance: 'Alert district agricultural extension officer if circular drying patches exceed 1 meter diameter.',
  },
  {
    id: 'rice-bacterial-blight',
    common_name: 'Bacterial Leaf Blight (BLB)',
    scientific_name: 'Xanthomonas oryzae pv. oryzae',
    crop_names: ['Paddy / Rice', 'Rice', 'Paddy'],
    type: 'bacterial_disease',
    plant_parts: ['Leaves'],
    symptom_categories: ['Spots / Lesions', 'Discoloration / Yellowing', 'Wilting / Drooping'],
    growth_stages: ['Tillering', 'Panicle Initiation', 'Flowering'],
    key_symptoms: [
      'Water-soaked stripes starting from leaf margins or tips',
      'Lesions enlarge with wavy, undulating margins and turn yellow to straw-white',
      'Milky bacterial ooze drops visible on young lesions in early morning dew',
    ],
    diagnostic_summary:
      'Vascular bacterial disease spreading through hydathodes and clipping wounds. Rapid spread during monsoon storms and cyclonic winds.',
    favorable_conditions: 'Heavy rainfall, strong wind-blown rain, deep standing water, temperatures 25-34°C.',
    immediate_actions: [
      {
        category: 'cultural',
        title: 'Delay Nitrogen Top-Dressing',
        description: 'Postpone nitrogen application until bacterial progression ceases; apply extra Potash (MOP) @ 15-20 kg/acre to strengthen cell walls.',
        timing: 'Immediate',
      },
      {
        category: 'cultural',
        title: 'Regulate Irrigation Flow',
        description: 'Do not drain water from infected plots into healthy adjacent plots.',
        timing: 'Ongoing',
      },
    ],
    ipm_remedies: [
      {
        category: 'biological',
        title: 'Pseudomonas fluorescens Spray',
        description: 'Spray talc formulation of Pseudomonas fluorescens @ 5 g/litre of water twice at 10-day intervals.',
        timing: 'Morning hours',
      },
      {
        category: 'cultural',
        title: 'Cow Dung Slurry Filtrate Spray',
        description: 'Traditional TNAU verified method: spray 20% fresh cow dung slurry supernatant (20 kg cow dung in 100 L water filtered through muslin cloth) to induce systemic resistance.',
        timing: 'Foliar application',
      },
    ],
    chemical_caution:
      'Antibiotics like Streptocycline must only be used in severe cases under agricultural officer guidance (CIBRC-approved Streptomycin sulphate + Tetracycline hydrochloride 90:10 @ 6 g / 50 litres water combined with Copper Oxychloride @ 50 g). STRICT WARNING: Strictly avoid unapproved or WHO Class Ia/Ib formulations. Always wear PPE and adhere to pre-harvest intervals.',
    kvk_guidance: 'Perform ooze test in clear water glass to verify bacterial streaming.',
  },
  {
    id: 'rice-zinc-deficiency',
    common_name: 'Zinc Deficiency (Khaira Disease)',
    scientific_name: 'Abiotic Nutrient Deficiency (Zn)',
    crop_names: ['Paddy / Rice', 'Rice', 'Paddy'],
    type: 'nutrient_deficiency',
    plant_parts: ['Leaves', 'Whole Plant'],
    symptom_categories: ['Discoloration / Yellowing', 'Spots / Lesions', 'Stunted Growth'],
    growth_stages: ['Nursery', 'Vegetative', 'Tillering'],
    key_symptoms: [
      'Rusty bronze or reddish-brown pigmentation appearing 2-3 weeks after transplanting',
      'Chlorosis along midrib of young leaves, progressing to necrotic brown blotches',
      'Uneven, stunted plant growth with poor tillering across the plot',
    ],
    diagnostic_summary:
      'Micro-nutrient deficiency prevalent in calcareous, alkaline soils or waterlogged fields with high pH where zinc becomes chemically fixed and unavailable.',
    favorable_conditions: 'Continuous submergence, high soil pH (>7.5), excessive phosphorus fertilization.',
    immediate_actions: [
      {
        category: 'cultural',
        title: 'Drain and Aerate Field',
        description: 'Drain excess water for 2-3 days to oxygenate the root rhizosphere and promote zinc mobilization.',
        timing: 'Immediate',
      },
    ],
    ipm_remedies: [
      {
        category: 'cultural',
        title: 'Foliar Zinc Sulphate + Lime Spray',
        description: 'Dissolve 500 g Zinc Sulphate (ZnSO4 21% or 33%) + 250 g unslaked lime (to neutralize acidity) in 100 litres of water per acre. Spray twice at 7-day intervals.',
        timing: 'Cool morning hours',
      },
    ],
    chemical_caution:
      'This is an abiotic nutritional disorder; do NOT apply chemical fungicides or insecticides. Only apply CIBRC/FCO approved zinc formulations. Strictly avoid WHO Class Ia/Ib toxic chemicals. Soil test before next season to incorporate basal Zinc Sulphate @ 10-15 kg/acre.',
    kvk_guidance: 'Send soil sample to nearest Soil Testing Laboratory (STL) to measure DTPA-extractable Zinc levels.',
  },

  // --- TOMATO ---
  {
    id: 'tomato-early-blight',
    common_name: 'Tomato Early Blight',
    scientific_name: 'Alternaria solani',
    crop_names: ['Tomato'],
    type: 'fungal_disease',
    plant_parts: ['Leaves', 'Stem / Stalk', 'Fruits / Grains / Pods'],
    symptom_categories: ['Spots / Lesions', 'Discoloration / Yellowing', 'Rotting / Decay'],
    growth_stages: ['Vegetative', 'Flowering', 'Fruiting / Grains / Pods'],
    key_symptoms: [
      'Circular to angular dark brown spots with characteristic concentric rings ("target board" pattern)',
      'Yellow chlorotic halos surrounding the target spots on older lower leaves',
      'Defoliation starting from bottom canopy progressing upwards; collar rot on seedling stems',
    ],
    diagnostic_summary:
      'Airborne and soil-borne fungal blight. Spores splash from infected crop residues onto lower leaves during irrigation or rain.',
    favorable_conditions: 'Warm humid weather (24-30°C), alternating wet and dry periods, stressed plants.',
    immediate_actions: [
      {
        category: 'cultural',
        title: 'Prune Lower Infected Leaves',
        description: 'Carefully prune and remove infected bottom leaves touching the soil. Sanitize pruning shears with 70% alcohol between plants.',
        timing: 'Dry morning hours',
      },
      {
        category: 'cultural',
        title: 'Switch to Drip or Furrow Irrigation',
        description: 'Avoid overhead sprinkler or splashing water which spreads Alternaria spores onto foliage.',
        timing: 'Ongoing',
      },
    ],
    ipm_remedies: [
      {
        category: 'biological',
        title: 'Trichoderma harzianum Foliar & Root Drench',
        description: 'Apply Trichoderma harzianum / viride @ 5 g/litre around root zone and spray foliage.',
        timing: 'Early morning',
      },
      {
        category: 'cultural',
        title: 'Organic Straw Mulching',
        description: 'Apply 2-inch dry straw or biodegradable mulch around plant bases to prevent soil-to-leaf rain splash.',
        timing: 'Day 2',
      },
    ],
    chemical_caution:
      'For severe infections exceeding 10% canopy damage, CIBRC approved protective fungicides include Mancozeb 75% WP @ 2 g/L or Copper Oxychloride 50% WP @ 2.5 g/L. STRICT WARNING: Zero tolerance for WHO Class Ia/Ib chemicals. Wear respirator mask and gloves.',
    kvk_guidance: 'Ensure 3-year crop rotation with non-solanaceous crops (maize, pulses, mustard).',
  },
  {
    id: 'tomato-leaf-curl',
    common_name: 'Tomato Leaf Curl Virus (ToLCV)',
    scientific_name: 'Tomato leaf curl virus (Begomovirus)',
    crop_names: ['Tomato'],
    type: 'viral_disease',
    plant_parts: ['Leaves', 'Whole Plant'],
    symptom_categories: ['Curling / Deformed Foliage', 'Discoloration / Yellowing', 'Stunted Growth'],
    growth_stages: ['Nursery', 'Vegetative', 'Flowering'],
    key_symptoms: [
      'Severe upward and inward rolling, curling, and puckering of leaf margins',
      'Vein yellowing (chlorosis) with reduced leaf blade size ("little leaf" appearance)',
      'Severe plant stunting with bushy, erect growth; flower abortion and no fruit setting',
    ],
    diagnostic_summary:
      'Devastating viral pathogen vectored persistently by the silverleaf whitefly (Bemisia tabaci). Infected plants cannot be cured; focus is strictly on vector control and infected plant eradication.',
    favorable_conditions: 'High temperatures, dry weather, abundance of whiteflies in vicinity.',
    immediate_actions: [
      {
        category: 'cultural',
        title: 'Rogue Out and Destroy Infected Plants',
        description: 'Uproot severely stunted, curled plants immediately. Place in sealed bags and burn/bury outside the field to prevent whitefly transmission.',
        timing: 'Immediate',
      },
    ],
    ipm_remedies: [
      {
        category: 'biological',
        title: 'Install Yellow Sticky Traps',
        description: 'Erect bright yellow sticky traps @ 15-20 traps/acre at canopy height to monitor and mass-trap adult whiteflies.',
        timing: 'Day 1',
      },
      {
        category: 'biological',
        title: 'Neem Oil (Azadirachtin) 1% Spray',
        description: 'Spray Azadirachtin 10,000 ppm @ 2 ml/litre of water targeting the undersides of leaves where whitefly nymphs feed.',
        timing: 'Repeat every 7 days',
      },
      {
        category: 'cultural',
        title: 'Border Crop Barrier',
        description: 'Plant 2-3 rows of tall border barrier crops like maize, sorghum, or pearl millet around tomato fields to intercept flying whiteflies.',
        timing: 'Seasonal preventive',
      },
    ],
    chemical_caution:
      'No chemical spray can cure a viral infection inside the plant tissue. Chemical intervention only targets the insect vector using CIBRC-approved options (e.g. Diafenthiuron 50% WP @ 1 g/L or Spiromesifen 22.9% SC @ 1 ml/L) if whitefly population exceeds 5 adults/leaf. STRICT WARNING: Never use banned WHO Class Ia/Ib insecticides. Wear PPE and follow strict 15-day pre-harvest intervals.',
    kvk_guidance: 'Inquire with local KVK or university for ToLCV-resistant hybrid tomato varieties (e.g., Arka Rakshak, Arka Samrat).',
  },
  {
    id: 'tomato-blossom-end-rot',
    common_name: 'Blossom End Rot (BER)',
    scientific_name: 'Abiotic Physiological Disorder (Calcium & Moisture Stress)',
    crop_names: ['Tomato'],
    type: 'nutrient_deficiency',
    plant_parts: ['Fruits / Grains / Pods'],
    symptom_categories: ['Spots / Lesions', 'Rotting / Decay'],
    growth_stages: ['Fruiting / Grains / Pods'],
    key_symptoms: [
      'Water-soaked, circular sunken depression at the blossom end (distal tip) of green fruits',
      'Spot enlarges, darkens, and turns into a dry, black, leathery sunken patch',
      'Secondary saprophytic black mold (Alternaria or Cladosporium) may colonize the dead tissue',
    ],
    diagnostic_summary:
      'Physiological disorder caused by localized calcium deficiency in rapidly expanding fruit cells, almost always triggered by irregular watering or high salinity.',
    favorable_conditions: 'Fluctuating soil moisture, prolonged dry spell followed by heavy irrigation, excessive ammonium nitrogen fertilizer.',
    immediate_actions: [
      {
        category: 'cultural',
        title: 'Regulate Irrigation Consistency',
        description: 'Provide steady, uniform irrigation. Do not allow the root zone to fluctuate between bone-dry and waterlogged.',
        timing: 'Daily',
      },
      {
        category: 'cultural',
        title: 'Remove Affected Fruits',
        description: 'Pick off and compost damaged fruits to allow plant energy to direct into newly setting healthy fruits.',
        timing: 'Immediate',
      },
    ],
    ipm_remedies: [
      {
        category: 'cultural',
        title: 'Foliar Calcium Nitrate Spray',
        description: 'Dissolve Calcium Nitrate @ 4-5 g/litre of water and spray thoroughly on developing fruit clusters twice a week.',
        timing: 'Early morning',
      },
    ],
    chemical_caution:
      'Do not apply chemical pesticides or fungicides! This is a nutritional and water management issue, not a microbial infection. Strictly avoid WHO Class Ia/Ib chemical applications. Only use CIBRC/FCO recognized foliar calcium nutrients.',
    kvk_guidance: 'Perform soil testing to evaluate pH and exchangeable calcium capacity.',
  },

  // --- COTTON ---
  {
    id: 'cotton-pink-bollworm',
    common_name: 'Pink Bollworm (PBW)',
    scientific_name: 'Pectinophora gossypiella',
    crop_names: ['Cotton'],
    type: 'pest_infestation',
    plant_parts: ['Flowers', 'Fruits / Grains / Pods'],
    symptom_categories: ['Pest / Insect Sighting', 'Rotting / Decay', 'Curling / Deformed Foliage'],
    growth_stages: ['Flowering', 'Square Formation', 'Boll Development'],
    key_symptoms: [
      'Characteristic "rosetted flowers" with petals twisted and sealed, failing to open properly',
      'Entry boreholes on green bolls quickly healing over as small dark warts',
      'Premature boll opening, locule damage, stained and unpickable discolored lint with pink caterpillars inside',
    ],
    diagnostic_summary:
      'Lepidopteran monophagous pest of cotton. Young larvae burrow into floral squares and immature bolls within 30 minutes of hatching, escaping contact insecticides.',
    favorable_conditions: 'Staggered planting, continuous mono-cropping of cotton, mild warm temperatures.',
    immediate_actions: [
      {
        category: 'cultural',
        title: 'Hand-Pick and Destroy Rosetted Flowers',
        description: 'Collect rosetted flowers daily and immerse in soapy water or crush to eliminate trapped larvae.',
        timing: 'Daily scouting',
      },
    ],
    ipm_remedies: [
      {
        category: 'biological',
        title: 'Install Gossyplure Pheromone Traps',
        description: 'Install 5-8 pheromone traps per acre for continuous monitoring. If trap catches exceed 8 moths/trap/night for 3 consecutive days, initiate IPM bio-spray.',
        timing: 'Install 45 days after sowing',
      },
      {
        category: 'biological',
        title: 'Release Trichogramma bactrae Parasitoids',
        description: 'Release egg parasitoid Trichogramma bactrae @ 60,000 eggs/acre at weekly intervals during peak flowering.',
        timing: 'Evening hours',
      },
      {
        category: 'biological',
        title: 'Neem-Based Larvicide (Azadirachtin 5%)',
        description: 'Spray Azadirachtin 5% @ 0.5 ml/L during egg-laying flush to deter oviposition.',
        timing: 'Late afternoon',
      },
    ],
    chemical_caution:
      'If ETL is crossed (>10% green bolls infested with live pink larvae), contact KVK scientist for CIBRC approved window-based rotation chemistry (such as Chlorantraniliprole 18.5% SC @ 0.3 ml/L or Emamectin Benzoate 5% SG @ 0.4 g/L). STRICT WARNING: Strictly avoid synthetic pyrethroids or WHO Class Ia/Ib chemicals. Wear full PPE.',
    kvk_guidance: 'Enforce strict 150-160 day crop termination; do not ratoon cotton crops to break pest diapause.',
  },
  {
    id: 'cotton-leaf-curl',
    common_name: 'Cotton Leaf Curl Virus (CLCuV)',
    scientific_name: 'Cotton leaf curl virus (Begomovirus)',
    crop_names: ['Cotton'],
    type: 'viral_disease',
    plant_parts: ['Leaves', 'Whole Plant'],
    symptom_categories: ['Curling / Deformed Foliage', 'Discoloration / Yellowing', 'Stunted Growth'],
    growth_stages: ['Vegetative', 'Flowering'],
    key_symptoms: [
      'Upward or downward cupping and curling of leaf margins',
      'Thickening and darkening of primary and secondary veins on underside of leaves',
      'Formation of cup-shaped leaf-like outgrowths (enations) on the underside of principal veins',
    ],
    diagnostic_summary:
      'Whitefly-vectored begomovirus causing massive reduction in boll formation and lint quality in susceptible non-certified seeds.',
    favorable_conditions: 'High whitefly vector population, hot dry climate (30-38°C).',
    immediate_actions: [
      {
        category: 'cultural',
        title: 'Eradicate Early Infected Plants',
        description: 'Rogue out infected seedlings within the first 60 days of sowing to prevent within-field vector spread.',
        timing: 'Immediate',
      },
    ],
    ipm_remedies: [
      {
        category: 'biological',
        title: 'Yellow Sticky Traps for Whitefly Vector',
        description: 'Fix 10-15 yellow sticky traps per acre at upper canopy level.',
        timing: 'Day 1',
      },
      {
        category: 'biological',
        title: 'Foliar Neem Seed Kernel Extract (NSKE 5%)',
        description: 'Spray freshly prepared 5% NSKE + 0.1% detergent to repel adult whiteflies and disrupt oviposition.',
        timing: 'Early morning',
      },
    ],
    chemical_caution:
      'No viricide exists. Only manage whitefly vector if ETL exceeds 6-8 adults/leaf using CIBRC-approved safe insect growth regulators like Pyriproxyfen 10% EC @ 2 ml/L. STRICT WARNING: Avoid unapproved or WHO Class Ia/Ib chemicals. Wear full PPE.',
    kvk_guidance: 'Always plant resistant certified hybrids recommended by ICAR-CICR.',
  },

  // --- GROUNDNUT / PEANUT ---
  {
    id: 'groundnut-tikka',
    common_name: 'Tikka Disease (Early & Late Leaf Spot)',
    scientific_name: 'Cercospora arachidicola & Phaeoisariopsis personata',
    crop_names: ['Groundnut / Peanut', 'Groundnut', 'Peanut'],
    type: 'fungal_disease',
    plant_parts: ['Leaves', 'Stem / Stalk'],
    symptom_categories: ['Spots / Lesions', 'Discoloration / Yellowing'],
    growth_stages: ['Vegetative', 'Flowering', 'Pegging', 'Pod Development'],
    key_symptoms: [
      'Early spot: circular reddish-brown to dark brown spots surrounded by a prominent bright yellow halo',
      'Late spot: small, circular carbon-black spots on lower leaf surface without prominent halo',
      'Premature, rapid defoliation leaving bare stems and severely shrivelled pods',
    ],
    diagnostic_summary:
      'Common foliar fungal complex in all groundnut growing tracts. Inoculum survives on crop residue and volunteer groundnut plants.',
    favorable_conditions: 'Prolonged leaf wetness, relative humidity >85%, temperatures 25-30°C.',
    immediate_actions: [
      {
        category: 'cultural',
        title: 'Clean Harvest Debris',
        description: 'Remove wild volunteer groundnuts and infected crop refuse from field perimeters.',
        timing: 'Continuous',
      },
    ],
    ipm_remedies: [
      {
        category: 'biological',
        title: 'Pseudomonas fluorescens / Trichoderma Spray',
        description: 'Spray talc-based Pseudomonas fluorescens @ 10 g/L or Trichoderma viride @ 5 g/L at 40 and 60 days after sowing.',
        timing: 'Morning or late afternoon',
      },
      {
        category: 'cultural',
        title: 'Balanced Fertilizer Management',
        description: 'Avoid excessive nitrogen; ensure adequate gypsum (calcium & sulfur) application @ 200 kg/acre at pegging stage.',
        timing: 'Pegging stage (40-45 DAS)',
      },
    ],
    chemical_caution:
      'If defoliation begins before pegging, spray CIBRC approved protective fungicide Mancozeb 75% WP @ 2 g/L or Hexaconazole 5% EC @ 2 ml/L under KVK supervision. STRICT WARNING: Avoid WHO Class Ia/Ib chemicals. Wear PPE and respect 25-day pre-harvest interval.',
    kvk_guidance: 'Adopt tolerant cultivars like Kadiri-9, ICGV series from ICRISAT.',
  },

  // --- MAIZE / CORN ---
  {
    id: 'maize-fall-armyworm',
    common_name: 'Fall Armyworm (FAW)',
    scientific_name: 'Spodoptera frugiperda',
    crop_names: ['Maize / Corn', 'Maize', 'Corn'],
    type: 'pest_infestation',
    plant_parts: ['Leaves', 'Stem / Stalk', 'Fruits / Grains / Pods'],
    symptom_categories: ['Pest / Insect Sighting', 'Spots / Lesions', 'Curling / Deformed Foliage'],
    growth_stages: ['Knee-High Stage', 'Whorl Stage', 'Tasseling', 'Cob Formation'],
    key_symptoms: [
      'Elongated "windowpane" feeding holes and ragged shotgun tears in whorl leaves',
      'Heavy accumulation of sawdust-like coarse larval frass (feces) deep inside the central leaf whorl',
      'Caterpillar with 4 elevated dark spots arranged in a square on the 8th abdominal segment and an inverted "Y" on head capsule',
    ],
    diagnostic_summary:
      'Highly invasive, polyphagous noctuid caterpillar. Larvae feed concealed within central whorls, devastating emerging leaves and tassels.',
    favorable_conditions: 'Warm humid conditions (20-32°C), late-sown or staggered crops.',
    immediate_actions: [
      {
        category: 'cultural',
        title: 'Hand Picking and Whorl Crushing',
        description: 'Scout whorls in morning; hand-pick egg masses (covered in cream fuzz) and crush young larvae inside central leaf funnel.',
        timing: 'Daily',
      },
      {
        category: 'cultural',
        title: 'Sand or Wood Ash Whorl Application',
        description: 'Traditional effective mechanical control: place a pinch of clean dry sand mixed with wood ash (9:1 ratio) directly into each plant whorl to desiccate young larval cuticles.',
        timing: 'Knee-high to whorl stage',
      },
    ],
    ipm_remedies: [
      {
        category: 'biological',
        title: 'Bacillus thuringiensis (Bt) or Beauveria bassiana',
        description: 'Spray Bacillus thuringiensis kurstaki @ 2 g/L or Beauveria bassiana (1x10^8 CFU/g) @ 5 g/L directly into the whorls.',
        timing: 'Late evening hours',
      },
      {
        category: 'biological',
        title: 'FAW Pheromone Traps',
        description: 'Install 5 funnel pheromone traps per acre to track male moth flights.',
        timing: 'From germination',
      },
    ],
    chemical_caution:
      'If whorl infestation exceeds 10-20% ETL, apply targeted CIBRC approved whorl insecticide like Spinetoram 11.7% SC @ 0.5 ml/L or Chlorantraniliprole 18.5% SC @ 0.4 ml/L. STRICT WARNING: Zero tolerance for WHO Class Ia/Ib pesticides. Wear PPE. Never spray during tasseling/pollination to protect honeybee pollinators.',
    kvk_guidance: 'Report severe invasive outbreak immediately to District Joint Director of Agriculture.',
  },

  // --- CHILLI / PEPPER ---
  {
    id: 'chilli-anthracnose',
    common_name: 'Chilli Anthracnose & Fruit Rot (Dieback)',
    scientific_name: 'Colletotrichum capsici',
    crop_names: ['Chilli', 'Pepper', 'Chili'],
    type: 'fungal_disease',
    plant_parts: ['Fruits / Grains / Pods', 'Stem / Stalk', 'Leaves'],
    symptom_categories: ['Spots / Lesions', 'Rotting / Decay', 'Wilting / Drooping'],
    growth_stages: ['Flowering', 'Fruiting / Grains / Pods', 'Harvesting'],
    key_symptoms: [
      'Circular sunken dark spots on ripening green or red fruits with concentric rings of black acervuli',
      'Fruit lesions turn straw-colored and become leathery; fruits drop prematurely or rot on plant',
      'Twig dieback starting from growing tips downwards with whitening of branches',
    ],
    diagnostic_summary:
      'Devastating seed-borne and air-borne fungal rot attacking mature chilli pods during warm rainy weather.',
    favorable_conditions: 'High humidity (>80%), frequent showers, temperature 28-30°C during fruit ripening.',
    immediate_actions: [
      {
        category: 'cultural',
        title: 'Pluck and Discard Infected Pods',
        description: 'Promptly pick all infected, rotting fruits and remove from the field to arrest splash spore dispersal.',
        timing: 'Immediate',
      },
      {
        category: 'cultural',
        title: 'Ensure Good Field Drainage',
        description: 'Eliminate water puddles along chilli ridges; keep rows well ventilated.',
        timing: 'Ongoing',
      },
    ],
    ipm_remedies: [
      {
        category: 'biological',
        title: 'Trichoderma viride + Pseudomonas Seed & Foliar Treatment',
        description: 'Spray talc-formulated biocontrol agents @ 5 g/litre starting from flowering stage at 15-day intervals.',
        timing: 'Early morning',
      },
    ],
    chemical_caution:
      'If dieback symptoms appear on twig tips, spray CIBRC approved Copper Oxychloride 50% WP @ 2.5 g/L or Azoxystrobin 23% SC @ 1 ml/L. STRICT WARNING: Strictly avoid WHO Class Ia/Ib chemicals. Wear face shield and protective clothes.',
    kvk_guidance: 'Source disease-free certified hybrid seeds; treat seeds with Thiram or Trichoderma before nursery sowing.',
  },

  // --- PULSES (BLACKGRAM / GREENGRAM) ---
  {
    id: 'pulse-yellow-mosaic',
    common_name: 'Yellow Mosaic Virus (MYMV)',
    scientific_name: 'Mungbean yellow mosaic virus (Geminiviridae)',
    crop_names: ['Blackgram', 'Greengram', 'Pulses', 'Redgram / Pigeonpea'],
    type: 'viral_disease',
    plant_parts: ['Leaves', 'Whole Plant'],
    symptom_categories: ['Discoloration / Yellowing', 'Stunted Growth'],
    growth_stages: ['Vegetative', 'Flowering', 'Pod Development'],
    key_symptoms: [
      'Small yellow specks on young leaves developing into alternating bright yellow and green mosaic patches',
      'Complete yellowing of leaf lamina with reduced leaf size and stunted plants',
      'Pods become thin, deformed, and produce few, shrivelled, discolored seeds',
    ],
    diagnostic_summary:
      'Viral disease transmitted persistently by whiteflies (Bemisia tabaci). Causes up to 80-100% yield loss when infection happens before flowering.',
    favorable_conditions: 'Presence of whitefly populations, warm summer or early Kharif season.',
    immediate_actions: [
      {
        category: 'cultural',
        title: 'Rogue Out Early Diseased Plants',
        description: 'Pull out and bury plants exhibiting mosaic symptoms within 30 days of sowing.',
        timing: 'Immediate',
      },
    ],
    ipm_remedies: [
      {
        category: 'biological',
        title: 'Erect Yellow Sticky Traps',
        description: 'Place 10 yellow sticky sheets per acre to trap vector whiteflies.',
        timing: 'Day 1',
      },
      {
        category: 'biological',
        title: 'Foliar Neem Oil (10,000 ppm) Spray',
        description: 'Apply Neem oil @ 2 ml/L of water at 15 and 30 days after sowing.',
        timing: 'Late evening',
      },
    ],
    chemical_caution:
      'Chemical sprays cannot cure the virus. To protect unaffected plants from whitefly vector, consult local KVK for CIBRC-approved selective sprays like Dimethoate 30% EC @ 1.5 ml/L. STRICT WARNING: Never use banned WHO Class Ia/Ib chemicals. Wear PPE.',
    kvk_guidance: 'Cultivate MYMV-resistant varieties recommended by TNAU/ICAR (e.g., VBN 4, VBN 6, VBN 8, CO 6).',
  },

  // --- SUGARCANE ---
  {
    id: 'sugarcane-red-rot',
    common_name: 'Sugarcane Red Rot ("Cancer of Sugarcane")',
    scientific_name: 'Colletotrichum falcatum',
    crop_names: ['Sugarcane'],
    type: 'fungal_disease',
    plant_parts: ['Stem / Stalk', 'Leaves', 'Whole Plant'],
    symptom_categories: ['Rotting / Decay', 'Wilting / Drooping', 'Discoloration / Yellowing'],
    growth_stages: ['Grand Growth', 'Maturity / Harvesting'],
    key_symptoms: [
      'Yellowing and drooping of the top 3rd and 4th leaves, followed by complete drying of the crown',
      'Splitting the cane longitudinally reveals brilliant red internal tissues with diagnostic white transverse bands',
      'Sour alcoholic fermentation odor emanating from split diseased canes; pith shrinks and hollows out',
    ],
    diagnostic_summary:
      'Most catastrophic fungal disease of sugarcane. Survives primarily in infected sett planting material and soil debris.',
    favorable_conditions: 'Waterlogged soils, cultivation of susceptible varieties (e.g. CoC 671), flood water spreading conidia.',
    immediate_actions: [
      {
        category: 'cultural',
        title: 'Immediately Uproot and Burn Diseased Stools',
        description: 'Dig out entire infected sugarcane stool along with root system and burn outside the field. Drench planting pit with 0.1% Carbendazim or bleaching powder.',
        timing: 'Immediate',
      },
      {
        category: 'cultural',
        title: 'Stop Field-to-Field Flow Irrigation',
        description: 'Do not allow irrigation water to flow across infected patches into healthy fields.',
        timing: 'Immediate',
      },
    ],
    ipm_remedies: [
      {
        category: 'cultural',
        title: 'Hot Water / Aerated Steam Treatment of Setts',
        description: 'Treat seed cane setts at 52°C for 30 minutes before next planting to eliminate internal mycelium.',
        timing: 'Pre-planting',
      },
      {
        category: 'biological',
        title: 'Trichoderma Soil Application',
        description: 'Apply Trichoderma viride enriched Farm Yard Manure (FYM) @ 2.5 kg Trichoderma in 250 kg FYM per acre at planting.',
        timing: 'Basal application',
      },
    ],
    chemical_caution:
      'Standing crop fungicides have very limited efficacy against deep vascular red rot. Preventative sett dipping in CIBRC approved Carbendazim 50% WP @ 1 g/L is recommended before planting. STRICT WARNING: Strict avoidance of WHO Class Ia/Ib chemicals. Wear PPE.',
    kvk_guidance: 'Plant red rot resistant sugarcane clones (Co 86032, Co 0212, Co 11015) released by ICAR-SBI Coimbatore.',
  },
];
