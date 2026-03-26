import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BadgeCheck,
  Check,
  ChevronRight,
  ExternalLink,
  MapPinned,
  MessagesSquare,
  Save,
  UserRound,
  Users,
  Wrench
} from 'lucide-react';

const UI_FONT = '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif';
const LABEL_FONT = '"Segoe UI", system-ui, sans-serif';
const STATUS_OPTIONS = ['not_started', 'in_progress', 'ready'];
const STATUS_LABELS = {
  not_started: 'Not started',
  in_progress: 'Needs setup',
  ready: 'Ready'
};
const MALAYSIA_STATES = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Kuala Lumpur',
  'Labuan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Perak',
  'Perlis',
  'Penang',
  'Putrajaya',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu'
];

const shellStyle = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 0,
  padding: '14px',
  gap: '12px',
  background: 'radial-gradient(circle at top right, rgba(191,219,254,0.7) 0%, rgba(191,219,254,0) 34%), linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%)',
  color: '#0f172a',
  fontFamily: UI_FONT
};

const surfaceCardStyle = {
  background: 'rgba(255,255,255,0.84)',
  border: '1px solid rgba(148,163,184,0.2)',
  borderRadius: '20px',
  boxShadow: '0 20px 44px rgba(148,163,184,0.14)'
};

const fieldCardStyle = {
  display: 'grid',
  gap: '8px',
  padding: '16px',
  borderRadius: '18px',
  border: '1px solid rgba(226,232,240,0.92)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.94) 100%)'
};

const fieldStyle = {
  width: '100%',
  border: '1px solid rgba(148,163,184,0.24)',
  borderRadius: '12px',
  background: '#ffffff',
  minHeight: '46px',
  padding: '0 14px',
  color: '#0f172a',
  fontSize: '14px',
  fontFamily: LABEL_FONT,
  outline: 'none',
  boxSizing: 'border-box'
};

const textAreaStyle = {
  ...fieldStyle,
  minHeight: '112px',
  padding: '12px 14px',
  resize: 'vertical'
};

const primaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  minHeight: '42px',
  padding: '0 16px',
  borderRadius: '14px',
  border: '1px solid rgba(29,78,216,0.2)',
  background: 'linear-gradient(180deg, rgba(37,99,235,0.16) 0%, rgba(37,99,235,0.1) 100%)',
  color: '#0f172a',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 700,
  fontFamily: LABEL_FONT
};

const secondaryButtonStyle = {
  ...primaryButtonStyle,
  background: '#fff',
  border: '1px solid rgba(148,163,184,0.24)'
};

const setupCards = [
  {
    key: 'githubStatus',
    title: 'GitHub',
    logo: '/icons/github-mark.svg',
    description: 'Save your code safely so your work does not get lost.',
    hint: 'Create a repo and push your current project.',
    url: 'https://github.com',
    cta: 'Open GitHub'
  },
  {
    key: 'vercelStatus',
    title: 'Vercel',
    logo: '/icons/vercel-mark.svg',
    description: 'Publish your app live so you can share real progress.',
    hint: 'Deploy a preview first, then add your live URL below.',
    url: 'https://vercel.com',
    cta: 'Open Vercel'
  },
  {
    key: 'supabaseStatus',
    title: 'Supabase',
    logo: '/icons/supabase-mark.svg',
    description: 'Store your app data when you are ready for forms or accounts.',
    hint: 'Create a project and keep your keys organized.',
    url: 'https://supabase.com',
    cta: 'Open Supabase'
  }
];

function statusTone(status) {
  if (status === 'ready') {
    return {
      text: '#047857',
      border: 'rgba(16,185,129,0.16)',
      background: '#ecfdf5'
    };
  }
  if (status === 'in_progress') {
    return {
      text: '#b45309',
      border: 'rgba(245,158,11,0.18)',
      background: '#fffbeb'
    };
  }
  return {
    text: '#64748b',
    border: 'rgba(148,163,184,0.18)',
    background: '#f8fafc'
  };
}

function SettingsField({ label, hint, children }) {
  return (
    <div style={fieldCardStyle}>
      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>{label}</label>
      {children}
      {hint ? <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>{hint}</div> : null}
    </div>
  );
}

function StatusPill({ status }) {
  const tone = statusTone(status);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 10px', borderRadius: '999px', border: `1px solid ${tone.border}`, background: tone.background, color: tone.text, fontSize: '11px', fontWeight: 800, letterSpacing: '0.02em' }}>
      {status === 'ready' ? <Check size={12} /> : <BadgeCheck size={12} />}
      {STATUS_LABELS[status]}
    </span>
  );
}

function BrandLogo({ src, alt }) {
  return (
    <div style={{ width: '48px', height: '48px', borderRadius: '16px', border: '1px solid rgba(226,232,240,0.9)', background: '#fff', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
      <img src={src} alt={alt} style={{ width: '28px', height: '28px', objectFit: 'contain', display: 'block' }} />
    </div>
  );
}

function StepCardHeader({ step, title, description, status, actionLabel, onAction, icon: Icon }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '18px' }}>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div style={{ width: '46px', height: '46px', borderRadius: '16px', display: 'grid', placeItems: 'center', background: 'rgba(37,99,235,0.1)', color: '#2563eb', flexShrink: 0 }}>
          <Icon size={20} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Step {step}</span>
            <StatusPill status={status} />
          </div>
          <div style={{ marginTop: '8px', fontSize: '24px', fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>{title}</div>
          <div style={{ marginTop: '8px', maxWidth: '620px', fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>{description}</div>
        </div>
      </div>
      {actionLabel ? (
        <button type="button" onClick={onAction} style={secondaryButtonStyle}>
          {actionLabel}
          <ChevronRight size={14} />
        </button>
      ) : null}
    </div>
  );
}

function SetupToolCard({ card, value, onChange, onOpenExternal }) {
  return (
    <div style={{ ...fieldCardStyle, gap: '12px', padding: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <BrandLogo src={card.logo} alt={card.title} />
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{card.title}</div>
            <div style={{ marginTop: '6px' }}>
              <StatusPill status={value} />
            </div>
          </div>
        </div>
      </div>
      <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.55 }}>{card.description}</div>
      <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>{card.hint}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '10px', alignItems: 'center' }}>
        <select value={value} onChange={(event) => onChange(card.key, event.target.value)} style={fieldStyle}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>{STATUS_LABELS[option]}</option>
          ))}
        </select>
        <button type="button" onClick={() => onOpenExternal?.(card.url)} style={{ ...secondaryButtonStyle, whiteSpace: 'nowrap' }}>
          {card.cta}
          <ExternalLink size={14} />
        </button>
      </div>
    </div>
  );
}

export default function SettingsWindowContent({
  profileForm,
  setProfileForm,
  onSubmit,
  isSaving,
  onReset,
  powerStatus,
  isNarrowScreen,
  websiteUrl,
  setWebsiteUrl,
  onOpenExternal,
  focusSectionId
}) {
  const contentScrollRef = useRef(null);
  const [activeSectionId, setActiveSectionId] = useState('settings-identity');
  const updateField = (key, value) => setProfileForm((prev) => ({ ...prev, [key]: value }));

  const stepStatus = useMemo(() => ({
    identity: profileForm.builderName && profileForm.malaysiaState ? 'ready' : (profileForm.builderName || profileForm.malaysiaState ? 'in_progress' : 'not_started'),
    setup: [profileForm.githubStatus, profileForm.vercelStatus, profileForm.supabaseStatus].every((value) => value === 'ready')
      ? 'ready'
      : [profileForm.githubStatus, profileForm.vercelStatus, profileForm.supabaseStatus].some((value) => value !== 'not_started')
        ? 'in_progress'
        : 'not_started',
    community: profileForm.guildStatus === 'ready'
      ? 'ready'
      : (profileForm.guildStatus === 'in_progress' || profileForm.guildProfileUrl || profileForm.whatsappContact ? 'in_progress' : 'not_started')
  }), [profileForm.builderName, profileForm.guildProfileUrl, profileForm.guildStatus, profileForm.malaysiaState, profileForm.githubStatus, profileForm.supabaseStatus, profileForm.vercelStatus, profileForm.whatsappContact]);

  const settingsSteps = useMemo(() => ([
    {
      id: 'settings-identity',
      key: 'identity',
      step: 1,
      title: 'Builder identity',
      subtitle: 'Name, state, and learning profile',
      purpose: 'Start with the basics so Stats can identify who is learning and what stage to optimize for.',
      icon: UserRound,
      actionLabel: stepStatus.identity === 'ready' ? 'Review next step' : 'Complete basics'
    },
    {
      id: 'settings-community',
      key: 'community',
      step: 2,
      title: 'Community',
      subtitle: 'KrackedDevs guild and contact',
      purpose: 'Make it easy to connect to the guild and leave one useful contact path.',
      icon: Users,
      actionLabel: stepStatus.community === 'ready' ? 'Go to tool setup' : 'Review guild setup'
    },
    {
      id: 'settings-setup',
      key: 'setup',
      step: 3,
      title: 'Tool setup',
      subtitle: 'GitHub, Vercel, and Supabase',
      purpose: 'Mark where your build stack stands so the product can reflect real beginner readiness.',
      icon: Wrench,
      actionLabel: null
    }
  ]), [stepStatus.community, stepStatus.identity, stepStatus.setup]);

  const completedStepsCount = settingsSteps.filter((step) => stepStatus[step.key] === 'ready').length;
  const nextStep = settingsSteps.find((step) => stepStatus[step.key] !== 'ready') || settingsSteps[settingsSteps.length - 1];
  const progressPercent = Math.round((completedStepsCount / settingsSteps.length) * 100);
  const builderInitial = (profileForm.builderName || 'A').trim().charAt(0).toUpperCase() || 'A';
  const topStatusSentence = nextStep
    ? (completedStepsCount === settingsSteps.length
      ? 'Everything important is in place. Review and save your setup.'
      : `Next recommended step: ${nextStep.title}.`)
    : 'Complete your setup and save your progress.';

  useEffect(() => {
    const container = contentScrollRef.current;
    if (!container) return undefined;

    const updateActiveSection = () => {
      const sections = settingsSteps.map((item) => document.getElementById(item.id)).filter(Boolean);
      if (!sections.length) return;

      const containerTop = container.getBoundingClientRect().top;
      let nextActive = sections[0].id;
      let closestOffset = Number.POSITIVE_INFINITY;

      sections.forEach((section) => {
        const offset = Math.abs(section.getBoundingClientRect().top - containerTop - 88);
        if (offset < closestOffset) {
          closestOffset = offset;
          nextActive = section.id;
        }
      });

      setActiveSectionId(nextActive);
    };

    updateActiveSection();
    container.addEventListener('scroll', updateActiveSection, { passive: true });

    return () => {
      container.removeEventListener('scroll', updateActiveSection);
    };
  }, [settingsSteps]);

  useEffect(() => {
    if (!focusSectionId) return;
    setActiveSectionId(focusSectionId);
    document.getElementById(focusSectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focusSectionId]);

  const goToStep = (stepId) => {
    setActiveSectionId(stepId);
    document.getElementById(stepId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={shellStyle}>
      <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: '12px' }}>
        {!isNarrowScreen ? (
          <aside className="os-thin-scroll" style={{ width: '300px', flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '2px' }}>
            <div style={{ ...surfaceCardStyle, padding: '20px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '18px', display: 'grid', placeItems: 'center', background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)', color: '#eff6ff', fontSize: '22px', fontWeight: 800 }}>
                  {builderInitial}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {profileForm.builderName || 'New builder'}
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '13px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {profileForm.malaysiaState || 'Choose your Malaysia state'}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '16px', fontSize: '13px', color: '#475569', lineHeight: 1.55 }}>
                A guided setup flow for first-time builders. Stats reads this directly and mirrors your readiness.
              </div>
            </div>

            <div style={{ ...surfaceCardStyle, padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Setup progress</div>
                  <div style={{ marginTop: '6px', fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{completedStepsCount}/{settingsSteps.length}</div>
                </div>
                <StatusPill status={completedStepsCount === settingsSteps.length ? 'ready' : 'in_progress'} />
              </div>
              <div style={{ height: '10px', background: '#dbe5f1', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)' }} />
              </div>
              <div style={{ marginTop: '12px', fontSize: '13px', color: '#475569', lineHeight: 1.55 }}>{topStatusSentence}</div>
            </div>

            <div style={{ ...surfaceCardStyle, padding: '12px' }}>
              <div style={{ padding: '6px 8px 10px', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Steps
              </div>
              <div style={{ display: 'grid', gap: '8px' }}>
                {settingsSteps.map((step) => {
                  const active = activeSectionId === step.id;
                  const status = stepStatus[step.key];
                  const tone = statusTone(status);
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => goToStep(step.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px', borderRadius: '16px', border: active ? '1px solid rgba(29,78,216,0.18)' : `1px solid ${tone.border}`, background: active ? 'rgba(37,99,235,0.08)' : tone.background, color: '#0f172a', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '12px', display: 'grid', placeItems: 'center', background: '#fff', border: '1px solid rgba(226,232,240,0.92)', fontSize: '12px', fontWeight: 800, color: '#334155', flexShrink: 0 }}>
                        {step.step}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700 }}>{step.title}</div>
                        <div style={{ marginTop: '3px', fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{STATUS_LABELS[status]}</div>
                      </div>
                      <ChevronRight size={14} color="#94a3b8" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        ) : null}

        <div ref={contentScrollRef} className="os-thin-scroll" style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto', paddingRight: '2px' }}>
          <form onSubmit={onSubmit} style={{ display: 'grid', gap: '16px', paddingBottom: '90px' }}>
            <section style={{ ...surfaceCardStyle, padding: isNarrowScreen ? '16px' : '20px', position: 'sticky', top: 0, zIndex: 3, backdropFilter: 'blur(18px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Settings flow</div>
                  <div style={{ marginTop: '6px', fontSize: isNarrowScreen ? '24px' : '28px', fontWeight: 750, color: '#0f172a', lineHeight: 1.1 }}>
                    Better setup UX for beginner builders
                  </div>
                  <div style={{ marginTop: '8px', maxWidth: '760px', fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
                    {completedStepsCount}/{settingsSteps.length} steps complete. {topStatusSentence}
                  </div>
                </div>
                <button type="submit" disabled={isSaving} style={{ ...primaryButtonStyle, opacity: isSaving ? 0.7 : 1 }}>
                  <Save size={16} />
                  {isSaving ? 'Saving...' : 'Save settings'}
                </button>
              </div>

              {isNarrowScreen ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', marginTop: '14px' }}>
                  {settingsSteps.map((step) => (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => goToStep(step.id)}
                      style={{ border: '1px solid rgba(226,232,240,0.92)', background: activeSectionId === step.id ? 'rgba(37,99,235,0.08)' : '#fff', borderRadius: '14px', padding: '10px 12px', textAlign: 'left', cursor: 'pointer' }}
                    >
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800 }}>Step {step.step}</div>
                      <div style={{ marginTop: '4px', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{step.title}</div>
                    </button>
                  ))}
                </div>
              ) : null}
            </section>

            <section id="settings-identity" style={{ ...surfaceCardStyle, padding: isNarrowScreen ? '18px' : '22px' }}>
              <StepCardHeader
                step={1}
                title="Builder identity"
                description="Start with the basics first. This is the foundation for the rest of the setup and for how Stats reflects your progress."
                status={stepStatus.identity}
                actionLabel={stepStatus.identity === 'ready' ? 'Go to community' : null}
                onAction={() => goToStep('settings-community')}
                icon={UserRound}
              />
              <div style={{ display: 'grid', gridTemplateColumns: isNarrowScreen ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
                <SettingsField label="Builder name" hint="Used in Stats, academy, and your local builder profile.">
                  <input value={profileForm.builderName} onChange={(event) => updateField('builderName', event.target.value)} style={fieldStyle} />
                </SettingsField>
                <SettingsField label="State in Malaysia" hint="Used as your location across progress and community surfaces.">
                  <select value={profileForm.malaysiaState} onChange={(event) => updateField('malaysiaState', event.target.value)} style={fieldStyle}>
                    <option value="">Choose your state</option>
                    {MALAYSIA_STATES.map((stateName) => (
                      <option key={stateName} value={stateName}>{stateName}</option>
                    ))}
                  </select>
                </SettingsField>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isNarrowScreen ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '16px', marginTop: '16px' }}>
                <SettingsField label="About yourself" hint="One short paragraph is enough. Keep it simple.">
                  <textarea value={profileForm.aboutYourself} onChange={(event) => updateField('aboutYourself', event.target.value)} rows={4} style={textAreaStyle} />
                </SettingsField>
                <SettingsField label="Program goal" hint="What do you want to build or learn next?">
                  <textarea value={profileForm.programGoal} onChange={(event) => updateField('programGoal', event.target.value)} rows={4} style={textAreaStyle} />
                </SettingsField>
              </div>
            </section>

            <section id="settings-community" style={{ ...surfaceCardStyle, padding: isNarrowScreen ? '18px' : '22px' }}>
              <StepCardHeader
                step={2}
                title="Community"
                description="Join the guild, save the relevant link if you have one, and leave one clean contact path. Keep this useful, not noisy."
                status={stepStatus.community}
                actionLabel={stepStatus.community === 'ready' ? 'Go to tool setup' : null}
                onAction={() => goToStep('settings-setup')}
                icon={Users}
              />
              <div style={{ display: 'grid', gridTemplateColumns: isNarrowScreen ? '1fr' : 'minmax(0, 1.08fr) minmax(0, 0.92fr)', gap: '16px' }}>
                <div style={{ ...fieldCardStyle, gap: '12px', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <BrandLogo src="/icons/kd-logo.svg" alt="KrackedDevs" />
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>KrackedDevs guild</div>
                        <div style={{ marginTop: '6px' }}>
                          <StatusPill status={profileForm.guildStatus} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.55 }}>
                    Join the builder community and use it as a clear checkpoint in your learning setup.
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                    Moderate guidance by default: keep one useful link and one status, not a full social profile.
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '10px', alignItems: 'center' }}>
                    <select value={profileForm.guildStatus} onChange={(event) => updateField('guildStatus', event.target.value)} style={fieldStyle}>
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>{STATUS_LABELS[option]}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => onOpenExternal?.(profileForm.guildProfileUrl || 'https://krackeddevs.com')} style={{ ...secondaryButtonStyle, whiteSpace: 'nowrap' }}>
                      Visit KrackedDevs
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '16px' }}>
                  <SettingsField label="KrackedDevs link" hint="Optional. Save a guild or profile URL if you already have one.">
                    <input value={profileForm.guildProfileUrl} onChange={(event) => updateField('guildProfileUrl', event.target.value)} style={fieldStyle} placeholder="https://krackeddevs.com" />
                  </SettingsField>
                  <SettingsField label="WhatsApp" hint="Leave one public contact for collaboration or follow-up.">
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><MessagesSquare size={16} /></span>
                      <input value={profileForm.whatsappContact} onChange={(event) => updateField('whatsappContact', event.target.value)} style={{ ...fieldStyle, paddingLeft: '42px' }} />
                    </div>
                  </SettingsField>
                </div>
              </div>
            </section>

            <section id="settings-setup" style={{ ...surfaceCardStyle, padding: isNarrowScreen ? '18px' : '22px' }}>
              <StepCardHeader
                step={3}
                title="Tool setup"
                description="Use real tool recognition here. Mark each platform as you make progress instead of treating setup like a hidden checklist."
                status={stepStatus.setup}
                actionLabel={null}
                onAction={null}
                icon={Wrench}
              />
              <div style={{ display: 'grid', gridTemplateColumns: isNarrowScreen ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: '16px' }}>
                {setupCards.map((card) => (
                  <SetupToolCard
                    key={card.key}
                    card={card}
                    value={profileForm[card.key]}
                    onChange={updateField}
                    onOpenExternal={onOpenExternal}
                  />
                ))}
              </div>
            </section>

            <div style={{ position: 'sticky', bottom: 0, zIndex: 3 }}>
              <div style={{ ...surfaceCardStyle, padding: '14px 16px', backdropFilter: 'blur(18px)', display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Save your setup</div>
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#64748b' }}>
                    {completedStepsCount}/{settingsSteps.length} steps complete. {nextStep ? `Next: ${nextStep.title}.` : ''}
                  </div>
                </div>
                <button type="submit" disabled={isSaving} style={{ ...primaryButtonStyle, opacity: isSaving ? 0.7 : 1 }}>
                  <Save size={16} />
                  {isSaving ? 'Saving...' : 'Save configuration'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
