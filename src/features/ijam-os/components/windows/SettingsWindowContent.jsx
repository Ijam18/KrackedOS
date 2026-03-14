import React from 'react';
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
  height: '100%',
  minHeight: 0,
  background: 'linear-gradient(180deg, #f8f9fc 0%, #edf2f9 100%)',
  color: '#0f172a',
  fontFamily: UI_FONT
};

const navCardStyle = {
  background: 'rgba(255,255,255,0.82)',
  border: '1px solid rgba(148,163,184,0.22)',
  borderRadius: '20px',
  boxShadow: '0 16px 40px rgba(148,163,184,0.14)'
};

const sectionCardStyle = {
  background: 'rgba(255,255,255,0.88)',
  border: '1px solid rgba(226,232,240,0.92)',
  borderRadius: '20px',
  boxShadow: '0 14px 36px rgba(148,163,184,0.12)',
  padding: '22px'
};

const fieldStyle = {
  width: '100%',
  border: '1px solid rgba(148,163,184,0.28)',
  borderRadius: '14px',
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

const sectionNav = [
  { id: 'settings-profile', label: 'Builder profile', subtitle: 'Identity and district', icon: UserRound },
  { id: 'settings-project', label: 'Project story', subtitle: 'Core idea and goals', icon: Lightbulb },
  { id: 'settings-contact', label: 'Contact links', subtitle: 'WhatsApp, Discord, Threads', icon: MessageSquareMore },
  { id: 'settings-session', label: 'Session control', subtitle: 'Local runtime state', icon: ShieldCheck }
];

function SettingsField({ label, children, hint }) {
  return (
    <div style={{ display: 'grid', gap: '8px' }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>{label}</label>
      {children}
      {hint ? <span style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.45 }}>{hint}</span> : null}
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

  return (
    <div style={shellStyle}>
      {!isNarrowScreen && (
        <aside style={{ width: '270px', flexShrink: 0, padding: '18px 14px 18px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
              Windows-style settings shell for the builder profile and local KRACKED_OS session.
            </div>
          </div>

          <div style={{ ...navCardStyle, padding: '12px' }}>
            <div style={{ padding: '6px 10px 10px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Categories
            </div>
            <div style={{ display: 'grid', gap: '6px' }}>
              {sectionNav.map((item, index) => {
                const Icon = item.icon;
                const active = index === 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
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

      <div style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto', padding: isNarrowScreen ? '16px' : '18px 18px 18px 10px' }}>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: '16px' }}>
          <section style={{ ...sectionCardStyle, display: 'grid', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minHeight: '42px', padding: '0 18px', borderRadius: '14px', border: '1px solid #2563eb', background: '#2563eb', color: '#eff6ff', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: LABEL_FONT }}
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
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Builder Profile
              </div>
              <div style={{ marginTop: '6px', fontSize: '22px', fontWeight: 600, color: '#0f172a' }}>
                Personal identity
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isNarrowScreen ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
              <SettingsField label="Full name">
                <input value={profileForm.username} onChange={(event) => setProfileForm((prev) => ({ ...prev, username: event.target.value }))} style={fieldStyle} />
              </SettingsField>
              <SettingsField label="District" hint="Used across community, builder stats, and profile surfaces.">
                <input value={profileForm.district} onChange={(event) => setProfileForm((prev) => ({ ...prev, district: event.target.value }))} style={fieldStyle} />
              </SettingsField>
            </div>
          </section>

          <section id="settings-project" style={sectionCardStyle}>
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Contact Links
              </div>
              <div style={{ marginTop: '6px', fontSize: '22px', fontWeight: 600, color: '#0f172a' }}>
                Community handles
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isNarrowScreen ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: '16px' }}>
              <SettingsField label="WhatsApp" hint="Numbers only or the format you share publicly.">
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}><MessagesSquare size={16} /></span>
                  <input value={profileForm.whatsappContact} onChange={(event) => setProfileForm((prev) => ({ ...prev, whatsappContact: event.target.value }))} style={{ ...fieldStyle, paddingLeft: '42px' }} />
                </div>
              </SettingsField>
              <SettingsField label="Discord">
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}><BadgeInfo size={16} /></span>
                  <input value={profileForm.discordTag} onChange={(event) => setProfileForm((prev) => ({ ...prev, discordTag: event.target.value }))} style={{ ...fieldStyle, paddingLeft: '42px' }} />
                </div>
              </SettingsField>
              <SettingsField label="Threads">
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
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minHeight: '42px', padding: '0 18px', borderRadius: '14px', border: '1px solid #2563eb', background: '#2563eb', color: '#eff6ff', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: LABEL_FONT }}
                >
                  <Save size={16} />
                  {isSaving ? 'Saving...' : 'Save configuration'}
                </button>
                <button
                  type="button"
                  onClick={onReset}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minHeight: '42px', padding: '0 18px', borderRadius: '14px', border: '1px solid rgba(244,63,94,0.2)', background: '#fff1f2', color: '#be123c', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: LABEL_FONT }}
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
  );
}
