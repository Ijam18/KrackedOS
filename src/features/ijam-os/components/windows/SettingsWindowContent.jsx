import React, { useEffect, useRef, useState } from 'react';
import {
  BadgeInfo,
  BriefcaseBusiness,
  Hash,
  Lightbulb,
  MapPinned,
  MessageSquareMore,
  MessagesSquare,
  RotateCcw,
  Save,
  ShieldCheck,
  UserRound,
  Users
} from 'lucide-react';

const UI_FONT = '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif';
const LABEL_FONT = '"Segoe UI", system-ui, sans-serif';

const shellStyle = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 0,
  padding: '14px',
  gap: '12px',
  background: 'linear-gradient(180deg, #f7faff 0%, #edf3fb 100%)',
  color: '#0f172a',
  fontFamily: UI_FONT
};

const navCardStyle = {
  background: 'rgba(255,255,255,0.82)',
  border: '1px solid rgba(148,163,184,0.24)',
  borderRadius: '18px',
  boxShadow: '0 16px 40px rgba(148,163,184,0.16)'
};

const sectionCardStyle = {
  background: 'rgba(255,255,255,0.82)',
  border: '1px solid rgba(148,163,184,0.24)',
  borderRadius: '18px',
  boxShadow: '0 16px 40px rgba(148,163,184,0.16)',
  padding: '22px'
};

const fieldStyle = {
  width: '100%',
  border: '1px solid rgba(148,163,184,0.24)',
  borderRadius: '12px',
  background: '#ffffff',
  minHeight: '44px',
  padding: '0 14px',
  color: '#0f172a',
  fontSize: '14px',
  fontFamily: LABEL_FONT,
  outline: 'none',
  boxSizing: 'border-box'
};

const textAreaStyle = {
  ...fieldStyle,
  minHeight: '104px',
  padding: '12px 14px',
  resize: 'vertical'
};

const primaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  minHeight: '36px',
  padding: '0 14px',
  borderRadius: '12px',
  border: '1px solid rgba(29,78,216,0.22)',
  background: 'rgba(37,99,235,0.12)',
  color: '#0f172a',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 700,
  fontFamily: LABEL_FONT
};

const dangerButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  minHeight: '36px',
  padding: '0 14px',
  borderRadius: '12px',
  border: '1px solid rgba(244,63,94,0.18)',
  background: 'rgba(255,241,242,0.96)',
  color: '#be123c',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 700,
  fontFamily: LABEL_FONT
};

const fieldCardStyle = {
  display: 'grid',
  gap: '8px',
  padding: '16px',
  borderRadius: '16px',
  border: '1px solid rgba(226,232,240,0.92)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.92) 100%)'
};

const sectionNav = [
  { id: 'settings-profile', label: 'Builder profile', subtitle: 'Identity and district', icon: UserRound },
  { id: 'settings-project', label: 'Project story', subtitle: 'Core idea and goals', icon: Lightbulb },
  { id: 'settings-contact', label: 'Contact links', subtitle: 'WhatsApp, Discord, Threads', icon: MessageSquareMore },
  { id: 'settings-session', label: 'Session control', subtitle: 'Local runtime state', icon: ShieldCheck }
];

function SettingsField({ label, children, hint }) {
  return (
    <div style={fieldCardStyle}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>{label}</label>
      {children}
      {hint ? <span style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.45 }}>{hint}</span> : null}
    </div>
  );
}

function SectionHeader({ eyebrow, title, description, icon: Icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', marginBottom: '18px', flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {eyebrow}
        </div>
        <div style={{ marginTop: '6px', fontSize: '22px', fontWeight: 600, color: '#0f172a' }}>
          {title}
        </div>
        {description ? (
          <div style={{ marginTop: '6px', fontSize: '13px', color: '#64748b', lineHeight: 1.55, maxWidth: '560px' }}>
            {description}
          </div>
        ) : null}
      </div>
      {Icon ? (
        <div style={{ width: '42px', height: '42px', borderRadius: '14px', display: 'grid', placeItems: 'center', background: 'rgba(37,99,235,0.1)', color: '#2563eb', flexShrink: 0 }}>
          <Icon size={18} />
        </div>
      ) : null}
    </div>
  );
}

function SummaryChip({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '16px', border: '1px solid rgba(226,232,240,0.92)', background: 'rgba(255,255,255,0.86)' }}>
      <div style={{ width: '38px', height: '38px', borderRadius: '14px', display: 'grid', placeItems: 'center', background: 'rgba(37,99,235,0.1)', color: '#2563eb', flexShrink: 0 }}>
        <Icon size={18} />
      </div>
      <div>
        <div style={{ fontSize: '12px', color: '#64748b' }}>{label}</div>
        <div style={{ marginTop: '2px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{value}</div>
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
  isNarrowScreen
}) {
  const initials = (profileForm.username || 'A').trim().charAt(0).toUpperCase() || 'A';
  const [activeSectionId, setActiveSectionId] = useState('settings-profile');
  const contentScrollRef = useRef(null);

  useEffect(() => {
    const container = contentScrollRef.current;
    if (!container) return undefined;

    const updateActiveSection = () => {
      const sections = sectionNav
        .map((item) => document.getElementById(item.id))
        .filter(Boolean);

      if (!sections.length) return;

      const containerTop = container.getBoundingClientRect().top;
      let nextActiveId = sections[0].id;
      let closestOffset = Number.POSITIVE_INFINITY;

      sections.forEach((section) => {
        const offset = Math.abs(section.getBoundingClientRect().top - containerTop - 24);
        if (offset < closestOffset) {
          closestOffset = offset;
          nextActiveId = section.id;
        }
      });

      setActiveSectionId(nextActiveId);
    };

    updateActiveSection();
    container.addEventListener('scroll', updateActiveSection, { passive: true });

    return () => {
      container.removeEventListener('scroll', updateActiveSection);
    };
  }, []);

  return (
    <div style={shellStyle}>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
      {!isNarrowScreen && (
        <aside className="os-thin-scroll" style={{ width: '270px', flexShrink: 0, padding: '0 12px 0 0', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
          <div style={{ ...navCardStyle, padding: '20px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '54px', height: '54px', borderRadius: '18px', display: 'grid', placeItems: 'center', background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)', color: '#eff6ff', fontSize: '22px', fontWeight: 700 }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '17px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profileForm.username || 'KRACKED Builder'}
                </div>
                <div style={{ marginTop: '4px', fontSize: '13px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profileForm.district || 'Set your district'}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '16px', fontSize: '13px', color: '#475569', lineHeight: 1.55 }}>
              Builder profile and local KRACKED_OS session settings in the same shell language as Files and Wallpaper.
            </div>
          </div>

          <div style={{ ...navCardStyle, padding: '12px' }}>
            <div style={{ padding: '6px 10px 10px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Categories
            </div>
            <div style={{ display: 'grid', gap: '6px' }}>
              {sectionNav.map((item, index) => {
                const Icon = item.icon;
                const active = activeSectionId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveSectionId(item.id);
                      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 12px', borderRadius: '14px', border: active ? '1px solid rgba(29,78,216,0.18)' : '1px solid transparent', background: active ? 'rgba(37,99,235,0.1)' : 'transparent', color: '#0f172a', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ width: '34px', height: '34px', borderRadius: '12px', display: 'grid', placeItems: 'center', background: active ? 'rgba(37,99,235,0.12)' : 'rgba(226,232,240,0.72)', color: active ? '#2563eb' : '#64748b', flexShrink: 0 }}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{item.label}</div>
                      <div style={{ marginTop: '2px', fontSize: '12px', color: '#64748b' }}>{item.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      )}

      <div ref={contentScrollRef} className="os-thin-scroll" style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto', padding: 0 }}>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: '16px' }}>
          <section style={{ ...sectionCardStyle, display: 'grid', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  System Settings
                </div>
                <h2 style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: 650, color: '#0f172a' }}>
                  Builder identity
                </h2>
                <p style={{ margin: '8px 0 0', maxWidth: '620px', fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
                  Manage the profile that KRACKED_OS uses across progress, academy, and local session views.
                </p>
              </div>
              <button
                type="submit"
                disabled={isSaving}
                style={{ ...primaryButtonStyle, opacity: isSaving ? 0.7 : 1 }}
              >
                <Save size={16} />
                {isSaving ? 'Saving...' : 'Save changes'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isNarrowScreen ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
              <SummaryChip icon={Users} label="Builder name" value={profileForm.username || 'Not set yet'} />
              <SummaryChip icon={MapPinned} label="District" value={profileForm.district || 'Not set yet'} />
              <SummaryChip icon={BriefcaseBusiness} label="Project title" value={profileForm.ideaTitle || 'Not set yet'} />
            </div>
          </section>

          <section id="settings-profile" style={sectionCardStyle}>
            <SectionHeader
              eyebrow="Builder Profile"
              title="Personal identity"
              description="Set the primary builder identity KRACKED_OS uses across the desktop, community view, and profile surfaces."
              icon={UserRound}
            />
            <div style={{ display: 'grid', gridTemplateColumns: isNarrowScreen ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
              <SettingsField label="Full name" hint="Displayed as your main builder name across the workspace.">
                <input value={profileForm.username} onChange={(event) => setProfileForm((prev) => ({ ...prev, username: event.target.value }))} style={fieldStyle} />
              </SettingsField>
              <SettingsField label="District" hint="Used across community, builder stats, and profile surfaces.">
                <input value={profileForm.district} onChange={(event) => setProfileForm((prev) => ({ ...prev, district: event.target.value }))} style={fieldStyle} />
              </SettingsField>
            </div>
          </section>

          <section id="settings-project" style={sectionCardStyle}>
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Project Story
              </div>
              <div style={{ marginTop: '6px', fontSize: '22px', fontWeight: 600, color: '#0f172a' }}>
                Core idea and direction
              </div>
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              <SettingsField label="Idea title">
                <input value={profileForm.ideaTitle} onChange={(event) => setProfileForm((prev) => ({ ...prev, ideaTitle: event.target.value }))} style={fieldStyle} />
              </SettingsField>
              <SettingsField label="Problem statement">
                <textarea value={profileForm.problemStatement} onChange={(event) => setProfileForm((prev) => ({ ...prev, problemStatement: event.target.value }))} rows={4} style={textAreaStyle} />
              </SettingsField>
              <div style={{ display: 'grid', gridTemplateColumns: isNarrowScreen ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
                <SettingsField label="About yourself">
                  <textarea value={profileForm.aboutYourself} onChange={(event) => setProfileForm((prev) => ({ ...prev, aboutYourself: event.target.value }))} rows={4} style={textAreaStyle} />
                </SettingsField>
                <SettingsField label="Program goal">
                  <textarea value={profileForm.programGoal} onChange={(event) => setProfileForm((prev) => ({ ...prev, programGoal: event.target.value }))} rows={4} style={textAreaStyle} />
                </SettingsField>
              </div>
            </div>
          </section>

          <section id="settings-contact" style={sectionCardStyle}>
            <SectionHeader
              eyebrow="Contact Links"
              title="Community handles"
              description="Keep the public contact points for your builder profile consistent across local runtime and community-facing surfaces."
              icon={MessageSquareMore}
            />
            <div style={{ display: 'grid', gridTemplateColumns: isNarrowScreen ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: '16px' }}>
              <SettingsField label="WhatsApp" hint="Numbers only or the format you share publicly.">
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}><MessagesSquare size={16} /></span>
                  <input value={profileForm.whatsappContact} onChange={(event) => setProfileForm((prev) => ({ ...prev, whatsappContact: event.target.value }))} style={{ ...fieldStyle, paddingLeft: '42px' }} />
                </div>
              </SettingsField>
              <SettingsField label="Discord" hint="Use the tag or username you want people to reach you with.">
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}><BadgeInfo size={16} /></span>
                  <input value={profileForm.discordTag} onChange={(event) => setProfileForm((prev) => ({ ...prev, discordTag: event.target.value }))} style={{ ...fieldStyle, paddingLeft: '42px' }} />
                </div>
              </SettingsField>
              <SettingsField label="Threads" hint="Public handle used for social profile references.">
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}><Hash size={16} /></span>
                  <input value={profileForm.threadsHandle} onChange={(event) => setProfileForm((prev) => ({ ...prev, threadsHandle: event.target.value }))} style={{ ...fieldStyle, paddingLeft: '42px' }} />
                </div>
              </SettingsField>
            </div>
          </section>

          <section id="settings-session" style={sectionCardStyle}>
            <div style={{ display: 'grid', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Session Control
                </div>
                <div style={{ marginTop: '6px', fontSize: '22px', fontWeight: 600, color: '#0f172a' }}>
                  Local runtime actions
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isNarrowScreen ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
                <div style={{ padding: '18px', borderRadius: '16px', border: '1px solid rgba(226,232,240,0.92)', background: 'rgba(248,250,252,0.9)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                    <ShieldCheck size={18} color="#2563eb" />
                    Save profile data
                  </div>
                  <p style={{ margin: '10px 0 0', fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
                    Stores your current builder profile into the local KRACKED_OS runtime state.
                  </p>
                </div>
                <div style={{ padding: '18px', borderRadius: '16px', border: '1px solid rgba(254,205,211,0.92)', background: '#fff1f2' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: 600, color: '#9f1239' }}>
                    <RotateCcw size={18} />
                    Factory reset
                  </div>
                  <p style={{ margin: '10px 0 0', fontSize: '14px', color: '#9f1239', lineHeight: 1.6 }}>
                    Clears the local OS session and returns the workspace to its default state.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{ ...primaryButtonStyle, opacity: isSaving ? 0.7 : 1 }}
                >
                  <Save size={16} />
                  {isSaving ? 'Saving...' : 'Save configuration'}
                </button>
                <button
                  type="button"
                  onClick={onReset}
                  style={dangerButtonStyle}
                >
                  <RotateCcw size={16} />
                  Factory reset OS
                </button>
              </div>
            </div>
          </section>
        </form>
      </div>
      </div>
    </div>
  );
}
