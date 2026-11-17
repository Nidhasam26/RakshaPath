import { useState } from 'react'
import { Check, Info, Phone, Plus, ShieldCheck, Star, Trash2, UserRound, Users } from 'lucide-react'
import { useContacts } from '../../hooks/useContacts'
import PageHeader from '../../components/PageHeader'

const emptyForm = { name: '', relationship: '', phone: '' }

function EmergencyContacts() {
  const {
    contacts,
    primaryContact,
    primaryId,
    addContact: saveContact,
    removeContact,
    setPrimaryContact,
    isMaxReached,
    maxContacts,
  } = useContacts()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const addContact = (event) => {
    event.preventDefault()
    setError('')
    const result = saveContact({
      name: form.name,
      relationship: form.relationship,
      phone: form.phone,
      requirePhone: true,
    })
    if (!result.success) {
      setError(result.error)
      return
    }
    setForm(emptyForm)
    setError('')
    setShowForm(false)
  }

  return (
    <>
      <PageHeader
        eyebrow="People you can count on"
        title="Emergency contacts"
        description="Keep trusted people close for your personal demo safety plan."
        action={
          <button
            type="button"
            className="btn btn-primary"
            disabled={isMaxReached}
            onClick={() => {
              setError('')
              setShowForm((open) => !open)
            }}
          >
            <Plus size={15} /> Add contact
          </button>
        }
      />
      <section className="grid two" style={{ marginBottom: 17 }}>
        <article className="panel stat-card">
          <div className="stat-top">
            <span>Trusted people</span>
            <span className="stat-icon">
              <Users size={17} />
            </span>
          </div>
          <div className="stat-value">
            {contacts.length}
            <span style={{ fontSize: 13, color: 'var(--muted)' }}> / {maxContacts}</span>
          </div>
          <div className="stat-foot">Saved to this browser</div>
        </article>
        <article className="panel stat-card">
          <div className="stat-top">
            <span>Primary contact</span>
            <span className="stat-icon" style={{ color: 'var(--mint)' }}>
              <ShieldCheck size={17} />
            </span>
          </div>
          <div className="stat-value" style={{ fontSize: 20 }}>
            {primaryContact?.name || 'Not selected'}
          </div>
          <div className="stat-foot">Your first call in a demo plan</div>
        </article>
      </section>

      {showForm && (
        <form className="panel panel-pad" onSubmit={addContact} style={{ marginBottom: 17 }}>
          <div className="panel-head">
            <div>
              <h2>Add someone you trust</h2>
              <p>Contact details stay in local browser storage.</p>
            </div>
            <button className="btn btn-quiet" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="contact-name">Full name</label>
              <input
                className="input"
                id="contact-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="e.g. Asha Patel"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="contact-relation">Relationship</label>
              <input
                className="input"
                id="contact-relation"
                value={form.relationship}
                onChange={(event) => setForm({ ...form, relationship: event.target.value })}
                placeholder="e.g. Sister"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="contact-phone">Phone number</label>
              <input
                className="input"
                id="contact-phone"
                type="tel"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                placeholder="+91 98765 43210"
                required
              />
            </div>
          </div>
          {error && (
            <p role="alert" style={{ color: 'var(--coral)', fontSize: 11, marginTop: 10 }}>
              {error}
            </p>
          )}
          <button className="btn btn-primary" type="submit" style={{ marginTop: 14 }}>
            Save contact <Check size={14} />
          </button>
        </form>
      )}

      <section className="panel panel-pad">
        <div className="panel-head">
          <div>
            <h2>People in your circle</h2>
            <p>Choose one primary contact for your demo plan.</p>
          </div>
          <span className="pill">{contacts.length} saved</span>
        </div>
        {!contacts.length ? (
          <div className="empty-state">
            <UserRound size={23} />
            <strong>No contacts added yet</strong>
            <span>Add someone you trust to get started.</span>
          </div>
        ) : (
          <div>
            {contacts.map((contact) => {
              const isPrimary = String(contact.id) === String(primaryId)
              return (
                <div className="row-card" key={contact.id}>
                  <span className="row-icon">
                    <UserRound size={18} />
                  </span>
                  <span className="row-main">
                    <strong>
                      {contact.name}{' '}
                      {isPrimary && (
                        <span className="pill pill-lime" style={{ marginLeft: 6 }}>
                          PRIMARY
                        </span>
                      )}
                    </strong>
                    <span>
                      {contact.relationship} · {contact.phone}
                    </span>
                  </span>
                  {contact.phone && (
                    <a
                      className="icon-btn"
                      href={`tel:${contact.phone}`}
                      title={`Call ${contact.name}`}
                      aria-label={`Call ${contact.name}`}
                    >
                      <Phone size={15} />
                    </a>
                  )}
                  {!isPrimary && (
                    <button
                      className="btn"
                      type="button"
                      onClick={() => setPrimaryContact(contact.id)}
                    >
                      <Star size={14} /> Make primary
                    </button>
                  )}
                  <button
                    className="icon-btn"
                    type="button"
                    title="Remove contact"
                    aria-label={`Remove ${contact.name}`}
                    onClick={() => removeContact(contact.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>
      <div className="notice" style={{ marginTop: 14 }}>
        <Info size={15} />
        <span>
          Demo only: these contacts are saved in this browser. RakshaPath will not send emergency messages or calls.
        </span>
      </div>
    </>
  )
}

export default EmergencyContacts
