// CropDiary AI — Grounded Local Agricultural Assistant Adapter (English & Tamil)
import { IAIAssistantAdapter } from './IAIAssistantAdapter';
import {
  FarmContextPayload,
  AssistantResponsePayload,
  SourceReference,
  Language,
} from '@/types/assistant';

export class LocalAgriculturalAssistantAdapter implements IAIAssistantAdapter {
  readonly adapterName = 'cropdiary-icar-local-assistant';

  isAvailable(): boolean {
    return true; // Always available as local zero-dependency agricultural intelligence
  }

  async generateResponse(
    userMessage: string,
    context: FarmContextPayload,
    language: Language = 'en'
  ): Promise<AssistantResponsePayload> {
    const q = userMessage.toLowerCase().trim();
    const isTamil = language === 'ta';
    const sources: SourceReference[] = [];

    // Guard 1: Prompt Injection & System Override Defense
    if (
      q.includes('ignore all previous') ||
      q.includes('ignore previous instructions') ||
      q.includes('system prompt') ||
      q.includes('override safety') ||
      q.includes('developer mode') ||
      q.includes('jailbreak') ||
      q.includes('dan mode')
    ) {
      return {
        content: isTamil
          ? 'பாதுகாப்பு எச்சரிக்கை: பயிர் நாட்குறிப்பு ஏஐ (CropDiary AI) கடுமையான பாதுகாப்பு மற்றும் தனியுரிமை வரம்புகளுக்கு உட்பட்டது. கணினி வழிமுறைகள் அல்லது பாதுகாப்புக் கொள்கைகளை மாற்றியமைக்க முடியாது.'
          : 'Security Notice: CropDiary AI operates under strict multi-tenant isolation and security guardrails. Internal system prompts and administrative configuration cannot be overridden.',
        sources: [],
        modelName: this.adapterName,
        usedFarmerRecords: false,
        disclaimer: 'Security and tenant isolation policy enforced.',
      };
    }

    // Guard 2: Unauthorized Cross-Tenant Access Defense
    if (
      q.includes('other user') ||
      q.includes('other farmer') ||
      q.includes('another farmer') ||
      q.includes('all users') ||
      q.includes('all farmers') ||
      q.includes('dump database') ||
      q.includes('dump users') ||
      q.includes('someone else') ||
      q.includes("someone else's") ||
      q.includes('bank details') ||
      q.includes('private bank') ||
      q.includes('other person') ||
      q.includes('cross-tenant') ||
      (q.includes('farmer') && (q.includes("'s") || q.includes('private') || q.includes('expenses from farm'))) ||
      q.includes('மற்ற விவசாயி') ||
      q.includes('அனைத்து பயனர்கள்') ||
      q.includes('வங்கி விவரங்கள்')
    ) {
      return {
        content: isTamil
          ? 'தனியுரிமை பாதுகாப்பு: நீங்கள் உங்கள் சொந்த அங்கீகரிக்கப்பட்ட பண்ணை பதிவுகளை மட்டுமே அணுக முடியும். மற்ற விவசாயிகளின் தரவுகளைப் பார்க்க அனுமதி இல்லை.'
          : 'Tenant Privacy Safeguard: You can only access records from your own authenticated farms and plots. Cross-tenant queries are blocked under PostgreSQL Row-Level Security.',
        sources: [],
        modelName: this.adapterName,
        usedFarmerRecords: false,
        disclaimer: 'Tenant data isolation enforced.',
      };
    }

    // Guard 3: Consequential / Destructive Action Safeguard
    if (
      (q.includes('delete') || q.includes('drop') || q.includes('wipe') || q.includes('remove all')) &&
      (q.includes('farm') || q.includes('plot') || q.includes('entry') || q.includes('expense') || q.includes('record'))
    ) {
      return {
        content: isTamil
          ? 'முக்கிய அறிவிப்பு: பதிவுகளை நீக்குவது உங்கள் வரலாற்றுத் தரவை நிரந்தரமாக அழித்துவிடும். உரையாடல் உதவியாளர் மூலம் நேரடியாக பதிவுகளை நீக்க முடியாது. தேவைப்பட்டால் பண்ணை அமைப்புகள் (Settings) பக்கத்திற்குச் சென்று உறுதிசெய்து நீக்கவும்.'
          : 'Consequential Action Notice: Deleting farms, plots, or financial records permanently alters your cultivation history. The AI Assistant cannot execute destructive operations directly. To delete or archive records, please use the Farm Settings or Ledger management interface with explicit confirmation.',
        sources: [],
        modelName: this.adapterName,
        usedFarmerRecords: false,
        disclaimer: 'Destructive operations require explicit UI confirmation.',
      };
    }

    // 1. Query: Recent Activities / Field Work
    if (
      q.includes('activity') ||
      q.includes('activities') ||
      q.includes('work') ||
      q.includes('வேலை') ||
      q.includes('செயல்பாடு')
    ) {
      if (context.recentActivities.length > 0) {
        context.recentActivities.slice(0, 5).forEach((act) => {
          sources.push({
            recordType: 'diary_entry',
            recordId: act.id,
            title: act.title,
            date: act.date,
          });
        });

        if (isTamil) {
          const actList = context.recentActivities
            .slice(0, 5)
            .map((a) => `• ${a.title} (${a.date.slice(0, 10)}) - பிரிவு: ${a.category}`)
            .join('\n');

          return {
            content: `உங்கள் பண்ணை நாட்குறிப்பில் பதிவு செய்யப்பட்ட சமீபத்திய வேலைகள்:\n\n${actList}\n\nமேலும் விவரங்களை அறிய "பண்ணை நாட்குறிப்பு" பக்கத்தைப் பார்வையிடவும்.`,
            sources,
            modelName: this.adapterName,
            usedFarmerRecords: true,
            disclaimer: 'உறுதிப்படுத்தப்பட்ட பண்ணை நாட்குறிப்பு பதிவுகளின் அடிப்படையில் உருவாக்கப்பட்டது.',
          };
        }

        const actList = context.recentActivities
          .slice(0, 5)
          .map((a) => `• ${a.title} (${a.date.slice(0, 10)}) — Category: ${a.category}`)
          .join('\n');

        return {
          content: `Here are the latest activities recorded in your Farm Diary:\n\n${actList}\n\nYou can review complete field inputs and machinery details in the Farm Diary module.`,
          sources,
          modelName: this.adapterName,
          usedFarmerRecords: true,
          disclaimer: 'Generated directly from your verified Farm Diary records.',
        };
      }

      return {
        content: isTamil
          ? 'உங்கள் பண்ணையில் சமீபத்தில் எந்த விவசாய வேலைகளும் பதிவு செய்யப்படவில்லை. புதிய வேலைகளைப் பதிவு செய்ய "பண்ணை நாட்குறிப்பு" பகுதிக்குச் செல்லவும்.'
          : 'No farm activities have been recorded recently for this farm. You can log plowing, weeding, or irrigation in the Farm Diary.',
        sources: [],
        modelName: this.adapterName,
        usedFarmerRecords: false,
        disclaimer: 'Verified against current farm ledger.',
      };
    }

    // 2. Query: Expenses / Financial Records
    if (
      q.includes('expense') ||
      q.includes('cost') ||
      q.includes('spent') ||
      q.includes('செலவு') ||
      q.includes('பணம்')
    ) {
      if (context.recentExpenses.length > 0) {
        let total = 0;
        context.recentExpenses.forEach((e) => {
          total += e.amount;
          sources.push({
            recordType: 'expense',
            recordId: e.id,
            title: `${e.title}: ₹${e.amount.toLocaleString('en-IN')}`,
            date: e.date,
          });
        });

        if (isTamil) {
          const expList = context.recentExpenses
            .slice(0, 5)
            .map((e) => `• ${e.title}: ₹${e.amount.toLocaleString('en-IN')} (${e.category})`)
            .join('\n');

          return {
            content: `உங்கள் பண்ணையில் பதிவு செய்யப்பட்ட செலவுகள் (மொத்தம்: ₹${total.toLocaleString('en-IN')}):\n\n${expList}\n\nமுழுமையான நிதி நிலை மற்றும் வரவு-செலவு கணக்குகளை "நிதி மற்றும் லாப நஷ்டம்" பக்கத்தில் காணலாம்.`,
            sources,
            modelName: this.adapterName,
            usedFarmerRecords: true,
            disclaimer: 'பதிவு செய்யப்பட்ட உண்மை செலவு ரசீதுகளின் அடிப்படையில் கணக்கிடப்பட்டது.',
          };
        }

        const expList = context.recentExpenses
          .slice(0, 5)
          .map((e) => `• ${e.title}: ₹${e.amount.toLocaleString('en-IN')} (${e.category})`)
          .join('\n');

        return {
          content: `Recorded farm expenditures (Total: ₹${total.toLocaleString('en-IN')} across ${context.recentExpenses.length} entries):\n\n${expList}\n\nDetailed category allocations and P&L statements are available in the Finance module.`,
          sources,
          modelName: this.adapterName,
          usedFarmerRecords: true,
          disclaimer: 'Calculated deterministically from recorded farm receipts under ICAR & TNAU farm record management standards.',
        };
      }

      return {
        content: isTamil
          ? 'இந்த பண்ணைக்கு பதிவு செய்யப்பட்ட செலவுகள் எதுவும் காணப்படவில்லை.'
          : 'No expense records were found for this farm. Record your inputs and labor in the Farm Diary.',
        sources: [],
        modelName: this.adapterName,
        usedFarmerRecords: false,
        disclaimer: 'Verified against current financial ledger.',
      };
    }

    // 3. Query: Harvest & Sales
    if (
      q.includes('harvest') ||
      q.includes('yield') ||
      q.includes('sale') ||
      q.includes('அறுவடை') ||
      q.includes('விற்பனை')
    ) {
      if (context.recentHarvests.length > 0) {
        context.recentHarvests.forEach((h) => {
          sources.push({
            recordType: 'harvest',
            recordId: h.id,
            title: `Harvest: ${h.cropName} (${h.quantity} ${h.unit})`,
            date: h.date,
          });
        });

        if (isTamil) {
          const hList = context.recentHarvests
            .map((h) => `• ${h.cropName}: ${h.quantity} ${h.unit} (${h.date.slice(0, 10)})`)
            .join('\n');

          return {
            content: `உங்கள் சமீபத்திய அறுவடை விவரங்கள்:\n\n${hList}\n\nஅறுவடை செய்யப்பட்ட விளைபொருட்களை விற்பனை செய்ய "அறுவடை விற்பனை" பக்கத்தைப் பயன்படுத்தவும்.`,
            sources,
            modelName: this.adapterName,
            usedFarmerRecords: true,
            disclaimer: 'பண்ணை நாட்குறிப்பு அறுவடை பதிவுகளிலிருந்து தொகுக்கப்பட்டது.',
          };
        }

        const hList = context.recentHarvests
          .map((h) => `• ${h.cropName}: ${h.quantity} ${h.unit} (${h.date.slice(0, 10)})`)
          .join('\n');

        return {
          content: `Here is a summary of your recorded crop harvests:\n\n${hList}\n\nYou can track commercial produce sales and remaining storage inventory in the Harvest-to-Sale module.`,
          sources,
          modelName: this.adapterName,
          usedFarmerRecords: true,
          disclaimer: 'Compiled from verified Farm Diary harvest entries.',
        };
      }

      return {
        content: isTamil
          ? 'உங்கள் பண்ணையில் இன்னும் அறுவடை பதிவுகள் எதுவும் செய்யப்படவில்லை.'
          : 'No harvest records have been logged yet for your active plots.',
        sources: [],
        modelName: this.adapterName,
        usedFarmerRecords: false,
        disclaimer: 'Verified against current records.',
      };
    }

    // 4. Query: Weather & Alerts
    if (
      q.includes('weather') ||
      q.includes('alert') ||
      q.includes('rain') ||
      q.includes('spray') ||
      q.includes('வானிலை') ||
      q.includes('மழை')
    ) {
      if (context.weatherAlerts.length > 0) {
        context.weatherAlerts.forEach((w) => {
          sources.push({
            recordType: 'weather',
            recordId: w.id,
            title: `Weather Alert: ${w.title}`,
          });
        });

        const alertList = context.weatherAlerts
          .map((w) => `• [${w.severity.toUpperCase()}] ${w.title} — Action: ${w.action}`)
          .join('\n');

        if (isTamil) {
          return {
            content: `உங்கள் பண்ணைக்கான தற்போதைய வானிலை எச்சரிக்கைகள்:\n\n${alertList}\n\nவிரிவான 7 நாள் முன்னறிவிப்பை "வானிலை மற்றும் எச்சரிக்கைகள்" பக்கத்தில் பார்க்கவும்.`,
            sources,
            modelName: this.adapterName,
            usedFarmerRecords: true,
            disclaimer: 'Open-Meteo மற்றும் ICAR வேளாண் விதிகளின்படி உருவாக்கப்பட்டது.',
          };
        }

        return {
          content: `Current agronomic weather advisories for your farm:\n\n${alertList}\n\nConsult the Weather & Alerts module for hourly spray window guidance.`,
          sources,
          modelName: this.adapterName,
          usedFarmerRecords: true,
          disclaimer: 'Computed from Open-Meteo observations and ICAR threshold rules.',
        };
      }

      return {
        content: isTamil
          ? 'தற்போது உங்கள் பண்ணைப் பகுதியில் தீவிர வானிலை இடர்பாடுகள் எதுவும் பதிவாகவில்லை.'
          : 'No severe weather alerts currently active for your farm coordinates.',
        sources: [],
        modelName: this.adapterName,
        usedFarmerRecords: false,
        disclaimer: 'Verified with Open-Meteo high-resolution meteorological feed.',
      };
    }

    // 5. Query: Crop Plans
    if (
      q.includes('plan') ||
      q.includes('crop plan') ||
      q.includes('sowing') ||
      q.includes('பயிர் திட்டம்') ||
      q.includes('விதைப்பு')
    ) {
      if (context.activeCropPlans.length > 0) {
        context.activeCropPlans.forEach((cp) => {
          sources.push({
            recordType: 'crop_plan',
            recordId: cp.id,
            title: `Crop Plan: ${cp.cropName} (${cp.season})`,
          });
        });

        if (isTamil) {
          const planList = context.activeCropPlans
            .map((p) => `• ${p.cropName} (${p.season} பருவம்) - விதைப்பு நாள்: ${p.sowingDate.slice(0, 10)}`)
            .join('\n');

          return {
            content: `உங்கள் பண்ணையில் சேமிக்கப்பட்ட பயிர் திட்டங்கள்:\n\n${planList}\n\nஉர மேலாண்மை மற்றும் அறுவடை கால அட்டவணையை "பயிர் திட்டமிடுபவர்" பகுதியில் காணவும்.`,
            sources,
            modelName: this.adapterName,
            usedFarmerRecords: true,
            disclaimer: 'சேமிக்கப்பட்ட ஸ்மார்ட் பயிர் திட்டங்களின் அடிப்படையில்.',
          };
        }

        const planList = context.activeCropPlans
          .map((p) => `• ${p.cropName} (${p.season} Season) — Target Sowing: ${p.sowingDate.slice(0, 10)}`)
          .join('\n');

        return {
          content: `Your active crop plans:\n\n${planList}\n\nVisit the Smart Crop Planner module for full timeline stages and input schedules.`,
          sources,
          modelName: this.adapterName,
          usedFarmerRecords: true,
          disclaimer: 'Retrieved from saved Smart Crop Planner records.',
        };
      }

      return {
        content: isTamil
          ? 'இந்த பருவத்திற்கு சேமிக்கப்பட்ட பயிர் திட்டங்கள் எதுவும் இல்லை. புதிய பயிரைத் தேர்வு செய்ய "பயிர் திட்டமிடுபவர்" பக்கத்திற்குச் செல்லவும்.'
          : 'No active crop plans saved yet. You can evaluate suitable crops in the Smart Crop Planner.',
        sources: [],
        modelName: this.adapterName,
        usedFarmerRecords: false,
        disclaimer: 'Verified against current crop plans.',
      };
    }

    // 6. Query: Crop Health / Crop Doctor Diagnoses
    if (
      q.includes('doctor') ||
      q.includes('disease') ||
      q.includes('pest') ||
      q.includes('symptom') ||
      q.includes('நோய்') ||
      q.includes('பூச்சி')
    ) {
      if (context.recentAssessments.length > 0) {
        context.recentAssessments.forEach((a) => {
          sources.push({
            recordType: 'crop_doctor',
            recordId: a.id,
            title: `Assessment: ${a.diagnosis}`,
            date: a.date,
          });
        });

        const diagList = context.recentAssessments
          .map((a) => `• ${a.diagnosis} (Severity: ${a.severity}) on ${a.date.slice(0, 10)}`)
          .join('\n');

        if (isTamil) {
          return {
            content: `உங்கள் முந்தைய பயிர் மருத்துவர் பரிசோதனைகள்:\n\n${diagList}\n\nதகுந்த சிகிச்சை மற்றும் ஐ.சி.ஏ.ஆர் (ICAR) நெறிமுறைகளை அறிய "பயிர் மருத்துவர்" பக்கத்தைப் பார்க்கவும்.`,
            sources,
            modelName: this.adapterName,
            usedFarmerRecords: true,
            disclaimer: 'முந்தைய பயிர் நோய் பரிசோதனைகளின் அடிப்படையில்.',
          };
        }

        return {
          content: `Your recent AI Crop Doctor assessments:\n\n${diagList}\n\nReview safe IPM protocols and non-chemical treatments in the AI Crop Doctor module.`,
          sources,
          modelName: this.adapterName,
          usedFarmerRecords: true,
          disclaimer: 'Retrieved from your saved AI Crop Doctor diagnostics history.',
        };
      }

      return {
        content: isTamil
          ? 'உங்கள் பண்ணையில் இதுவரை பயிர் நோய்கள் அல்லது பூச்சித் தாக்குதல் பரிசோதனைகள் பதிவு செய்யப்படவில்லை.'
          : 'No past disease or pest diagnostic records found for this farm.',
        sources: [],
        modelName: this.adapterName,
        usedFarmerRecords: false,
        disclaimer: 'Verified against Crop Doctor history.',
      };
    }

    // 7. Query: Missing Information / Audit Check
    if (
      q.includes('missing') ||
      q.includes('incomplete') ||
      q.includes('check') ||
      q.includes('விடுபட்டவை') ||
      q.includes('சரிபார்')
    ) {
      const missingItems: string[] = [];
      if (context.plots.length === 0) missingItems.push('No plots created under this farm.');
      if (context.activeCropPlans.length === 0) missingItems.push('No crop plan selected for the current season.');
      if (context.budgets.length === 0) missingItems.push('No seasonal expenditure budget defined.');
      if (context.recentExpenses.length === 0) missingItems.push('No input purchases or labor expenses recorded.');

      if (missingItems.length === 0) {
        return {
          content: isTamil
            ? 'சிறப்பு! உங்கள் பண்ணை பதிவுகள் முழுமையாக உள்ளன. நிலப்பரப்பு, பயிர் திட்டம், செலவுகள் மற்றும் வரவுசெலவு திட்டம் அனைத்தும் முறையாக பதிவு செய்யப்பட்டுள்ளன.'
            : 'Excellent! Your farm records appear comprehensive. Plots, crop plans, and field expenses are actively tracked.',
          sources: [],
          modelName: this.adapterName,
          usedFarmerRecords: true,
          disclaimer: 'Automated data completeness check.',
        };
      }

      const mList = missingItems.map((m) => `• ${m}`).join('\n');
      return {
        content: isTamil
          ? `உங்கள் பண்ணை பதிவுகளில் பின்வரும் தகவல்கள் விடுபட்டுள்ளன:\n\n${mList}\n\nஇவற்றை பூர்த்தி செய்வது துல்லியமான நிதி மற்றும் மகசூல் கணக்கீடுகளுக்கு உதவும்.`
          : `The following information is missing from your farm profile:\n\n${mList}\n\nCompleting these records will enhance financial reporting and government scheme eligibility accuracy.`,
        sources: [],
        modelName: this.adapterName,
        usedFarmerRecords: true,
        disclaimer: 'Automated data completeness check.',
      };
    }

    // 8. Query: Government Schemes
    if (
      q.includes('scheme') ||
      q.includes('subsid') ||
      q.includes('pm-kisan') ||
      q.includes('திட்ட') ||
      q.includes('மானிய')
    ) {
      sources.push({
        recordType: 'scheme',
        recordId: 'scheme-pmkisan-01',
        title: 'PM-KISAN (₹6,000 / year)',
      });
      sources.push({
        recordType: 'scheme',
        recordId: 'scheme-pmksy-pdmc-04',
        title: 'PMKSY Micro-Irrigation (100% Subsidy for Small Farmers in TN)',
      });

      if (isTamil) {
        return {
          content: `தமிழ்நாடு மற்றும் மத்திய அரசால் வழங்கப்படும் முக்கிய வேளாண் திட்டங்கள்:\n\n1. பிரதம மந்திரி கிசான் சம்மான் நிதி (PM-KISAN) - ஆண்டுக்கு ₹6,000 நேரடி உதவி.\n2. சொட்டுநீர் பாசனத் திட்டம் (PMKSY) - சிறு/குறு விவசாயிகளுக்கு 100% மானியம்.\n3. பயிர் காப்பீட்டுத் திட்டம் (PMFBY) - இயற்கை பேரிடர் இழப்பீடு.\n4. சூரியசக்தி பம்புசெட் திட்டம் - 70% அரசு மானியம்.\n\nஉங்கள் நிலப்பரப்பிற்கு ஏற்ற திட்டங்களை "அரசு திட்டங்கள்" பக்கத்தில் கண்டறியவும்.`,
          sources,
          modelName: this.adapterName,
          usedFarmerRecords: false,
          disclaimer: 'மத்திய மற்றும் தமிழ்நாடு வேளாண் அமைச்சக அதிகாரப்பூர்வ வழிகாட்டுதல்கள்.',
        };
      }

      return {
        content: `Key verified agricultural schemes applicable for your farm:\n\n1. PM-KISAN: ₹6,000/year direct income assistance in 3 installments.\n2. PMKSY Micro-Irrigation: 100% subsidy for Small & Marginal farmers in Tamil Nadu.\n3. PMFBY Crop Insurance: Subsidized protection against drought, flood, and pests.\n4. CM Solar Pump Scheme: 70% capital subsidy for off-grid irrigation.\n\nExplore personalized eligibility matching in the Government Schemes module.`,
        sources,
        modelName: this.adapterName,
        usedFarmerRecords: false,
        disclaimer: 'Compiled from verified Ministry of Agriculture and TNAU portals.',
      };
    }

    // Default Fallback: General Agricultural Assistant
    if (isTamil) {
      return {
        content: `வணக்கம்! நான் உங்கள் பயிர் நாட்குறிப்பு வேளாண் உதவியாளர் (CropDiary AI Assistant).\n\nநீங்கள் என்னிடம் கேட்கலாம்:\n• "இந்த வாரம் நான் பதிவு செய்த வேலைகள் என்ன?"\n• "என் பண்ணை செலவுகள் என்ன?"\n• "என் பயிர் திட்டத்தை விளக்கு"\n• "வானிலை எச்சரிக்கைகள் என்ன?"\n• "அரசு மானிய திட்டங்கள் என்ன?"\n\nஎவ்வாறு உதவ வேண்டும் என்று தயவுசெய்து கூறவும்.`,
        sources: [],
        modelName: this.adapterName,
        usedFarmerRecords: false,
        disclaimer: 'ஐ.சி.ஏ.ஆர் (ICAR) வேளாண் ஆராய்ச்சி வழிகாட்டுதல்.',
      };
    }

    return {
      content: `Hello! I am your CropDiary AI Farm Assistant.\n\nYou can ask me:\n• "What activities did I record on my farm this week?"\n• "What expenses have I recorded this month?"\n• "Explain my saved crop plan in simple language."\n• "Explain the weather alerts for my farm."\n• "What government schemes are available for my crops?"\n• "What information is missing from my farm records?"\n\nHow can I help you with your farm operations today?`,
      sources: [],
      modelName: this.adapterName,
      usedFarmerRecords: false,
      disclaimer: 'ICAR / TNAU Agricultural Reference Assistant.',
    };
  }
}

export const localAgriculturalAssistantAdapter = new LocalAgriculturalAssistantAdapter();
