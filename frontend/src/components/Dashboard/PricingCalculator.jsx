import React, { useState, useMemo } from 'react';
import { Calculator, Copy, Check, Lightbulb, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { useToast } from '../UI/Toast';

const COMPLEXITY_MULT = { low: 1.0, medium: 1.15, high: 1.35 };
const RUSH_PCT = { normal: 0, rush: 0.25 };
const PLATFORM_FEE = 0.20;

const PricingCalculator = ({ onUseBid }) => {
  const { darkMode } = useTheme();
  const { t } = useLanguage();
  const toast = useToast();

  const [form, setForm] = useState({
    projectType: 'web',
    hours: '',
    rate: '',
    complexity: 'medium',
    urgency: 'normal',
    revisions: 2,
  });
  const [copied, setCopied] = useState(false);

  const calc = useMemo(() => {
    const hours = parseFloat(form.hours) || 0;
    const rate = parseFloat(form.rate) || 0;
    if (hours <= 0 || rate <= 0) return null;

    const baseLabor = hours * rate;
    const complexityMult = COMPLEXITY_MULT[form.complexity];
    const complexityAdj = baseLabor * (complexityMult - 1);
    const afterComplexity = baseLabor + complexityAdj;
    const revisionBuffer = afterComplexity * (Number(form.revisions) * 0.05);
    const afterRevisions = afterComplexity + revisionBuffer;
    const rushSurcharge = afterRevisions * RUSH_PCT[form.urgency];
    const beforeFees = afterRevisions + rushSurcharge;
    const platformFee = beforeFees * PLATFORM_FEE;
    const recommended = beforeFees + platformFee;

    return {
      baseLabor,
      complexityAdj,
      revisionBuffer,
      rushSurcharge,
      platformFee,
      recommended,
      low: recommended * 0.85,
      high: recommended * 1.25,
    };
  }, [form]);

  const money = (n) => `$${Math.round(n).toLocaleString()}`;

  const copyBid = () => {
    if (!calc) return;
    navigator.clipboard.writeText(money(calc.recommended));
    setCopied(true);
    toast.success(t('dashboard.calculator.copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const card = `rounded-2xl p-6 border-2 shadow-xl transition-colors duration-300 ${
    darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-indigo-100 text-slate-800'
  }`;
  const label = `block text-sm font-bold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`;
  const input = `w-full px-4 py-3 rounded-lg border-2 font-medium ${
    darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
  } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`;

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const breakdownRows = calc && [
    { label: t('dashboard.calculator.baseLabor'), value: calc.baseLabor },
    { label: t('dashboard.calculator.complexityAdj'), value: calc.complexityAdj },
    { label: t('dashboard.calculator.revisionBuffer'), value: calc.revisionBuffer },
    { label: t('dashboard.calculator.rushSurcharge'), value: calc.rushSurcharge },
    { label: t('dashboard.calculator.platformFee'), value: calc.platformFee },
  ].filter((r) => r.value > 0.5);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className={`flex items-center gap-3 mb-8 pb-6 border-b-2 ${darkMode ? 'border-slate-700' : 'border-indigo-100'}`}>
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
          <Calculator className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {t('dashboard.calculator.title')}
          </h2>
          <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('dashboard.calculator.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className={card}>
          <div className="space-y-5">
            <div>
              <label htmlFor="calc-field-1" className={label}>{t('dashboard.calculator.projectType')}</label>
              <select id="calc-field-1" value={form.projectType} onChange={(e) => set('projectType', e.target.value)} className={`${input} cursor-pointer`}>
                <option value="web">{t('dashboard.calculator.typeWeb')}</option>
                <option value="design">{t('dashboard.calculator.typeDesign')}</option>
                <option value="writing">{t('dashboard.calculator.typeWriting')}</option>
                <option value="marketing">{t('dashboard.calculator.typeMarketing')}</option>
                <option value="consulting">{t('dashboard.calculator.typeConsulting')}</option>
                <option value="other">{t('dashboard.calculator.typeOther')}</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="calc-field-2" className={label}>{t('dashboard.calculator.hours')}</label>
                <input id="calc-field-2" type="number" min="0" value={form.hours} onChange={(e) => set('hours', e.target.value)} placeholder="20" className={input} />
              </div>
              <div>
                <label htmlFor="calc-field-3" className={label}>{t('dashboard.calculator.hourlyRate')}</label>
                <input id="calc-field-3" type="number" min="0" value={form.rate} onChange={(e) => set('rate', e.target.value)} placeholder="60" className={input} />
              </div>
            </div>

            <div>
              <label id="calc-group-4" className={label}>{t('dashboard.calculator.complexity')}</label>
              <div role="group" aria-labelledby="calc-group-4" className="grid grid-cols-3 gap-2">
                {['low', 'medium', 'high'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set('complexity', c)}
                    className={`py-2.5 rounded-lg text-sm font-bold border-2 transition-all ${
                      form.complexity === c
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-400 text-white'
                        : darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    {t(`dashboard.calculator.complexity${c.charAt(0).toUpperCase() + c.slice(1)}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label id="calc-group-5" className={label}>{t('dashboard.calculator.urgency')}</label>
                <div role="group" aria-labelledby="calc-group-5" className="grid grid-cols-2 gap-2">
                  {['normal', 'rush'].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => set('urgency', u)}
                      className={`py-2.5 rounded-lg text-sm font-bold border-2 transition-all ${
                        form.urgency === u
                          ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-400 text-white'
                          : darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {t(`dashboard.calculator.urgency${u.charAt(0).toUpperCase() + u.slice(1)}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="calc-field-6" className={label}>{t('dashboard.calculator.revisions')}</label>
                <input id="calc-field-6" type="number" min="0" max="20" value={form.revisions} onChange={(e) => set('revisions', e.target.value)} className={input} />
              </div>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className={card}>
          {!calc ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Calculator className={`w-16 h-16 mb-4 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('dashboard.calculator.emptyHint')}</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="text-center mb-5">
                <div className={`text-sm font-semibold uppercase tracking-wide mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('dashboard.calculator.resultTitle')}
                </div>
                <div className="text-5xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {money(calc.recommended)}
                </div>
                <div className={`flex items-center justify-center gap-4 mt-3 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span>{t('dashboard.calculator.conservative')}: <strong>{money(calc.low)}</strong></span>
                  <span>·</span>
                  <span>{t('dashboard.calculator.premium')}: <strong>{money(calc.high)}</strong></span>
                </div>
              </div>

              {/* Breakdown */}
              <div className={`rounded-xl p-4 border-2 mb-4 ${darkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <h4 className={`text-sm font-bold mb-3 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{t('dashboard.calculator.breakdown')}</h4>
                <ul className="space-y-2">
                  {breakdownRows.map((r, i) => (
                    <li key={i} className={`flex justify-between text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      <span>{r.label}</span>
                      <span className="font-semibold">{money(r.value)}</span>
                    </li>
                  ))}
                  <li className={`flex justify-between text-sm font-bold pt-2 border-t ${darkMode ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-900'}`}>
                    <span>{t('dashboard.calculator.total')}</span>
                    <span>{money(calc.recommended)}</span>
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={copyBid}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    copied ? 'bg-green-500 text-white' : darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {copied ? <><Check className="w-4 h-4" /> {t('dashboard.calculator.copied')}</> : <><Copy className="w-4 h-4" /> {t('dashboard.calculator.copyBid')}</>}
                </button>
                {onUseBid && (
                  <button
                    onClick={() => onUseBid(money(calc.recommended))}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg transition-all"
                  >
                    <Sparkles className="w-4 h-4" /> {t('dashboard.calculator.useInProposal')}
                  </button>
                )}
              </div>

              <div className={`mt-auto flex items-start gap-2 text-xs rounded-lg p-3 ${darkMode ? 'bg-indigo-900/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{t('dashboard.calculator.tip')}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricingCalculator;
