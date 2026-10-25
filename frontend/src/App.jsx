import { useState } from 'react'
import './App.css'

const tones = [
  { value: 'rolig og tryg', label: 'Rolig' },
  { value: 'eventyrlig og blid', label: 'Eventyrlig' },
  { value: 'sjov og varm', label: 'Sjov' },
  { value: 'magisk og drømmende', label: 'Magisk' },
]

const lengthInstructions = {
  short: 'en kort godnathistorie på cirka 2 minutter',
  medium: 'en godnathistorie på cirka 5 minutter',
  long: 'en lang godnathistorie på cirka 8 minutter',
}

function App() {
  const [prompt, setPrompt] = useState('')
  const [length, setLength] = useState('medium')
  const [tone, setTone] = useState(tones[0].value)
  const [setting, setSetting] = useState('')
  const [characters, setCharacters] = useState('')
  const [story, setStory] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  async function generateStory(event) {
    event?.preventDefault()
    if (!prompt.trim() || isLoading) return

    setIsLoading(true)
    setError('')
    setIsCopied(false)

    const context = [
      setting.trim() && `Miljø og tema: ${setting.trim()}`,
      characters.trim() && `Karakterer: ${characters.trim()}`,
    ]
      .filter(Boolean)
      .join('\n')

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          skill: `Skriv ${lengthInstructions[length]} med en ${tone} stemning.`,
          context: context || undefined,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.detail || `Serveren svarede med fejl ${response.status}.`)
      }

      setStory(data.reply)
    } catch (requestError) {
      setError(
        requestError instanceof TypeError
          ? 'Kunne ikke få forbindelse til appen. Tjek, at FastAPI-serveren kører.'
          : requestError.message || 'Historien kunne ikke hentes. Prøv igen.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function copyStory() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(story)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = story
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.append(textArea)
        textArea.select()
        const copied = document.execCommand('copy')
        textArea.remove()
        if (!copied) throw new Error('Kopiering understøttes ikke i denne browser.')
      }
      setIsCopied(true)
      window.setTimeout(() => setIsCopied(false), 1800)
    } catch {
      setError('Historien kunne ikke kopieres fra denne browser.')
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Aftenro, start">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span>AFTENRO</span>
        </a>
        <span className="topbar-note">EN LILLE FORTÆLLESTUND</span>
      </header>

      <main id="top" className="workspace">
        <section className="composer" aria-labelledby="page-title">
          <div className="eyebrow"><span className="eyebrow-line" /> GODNAT, BEGGE TO</div>
          <h1 id="page-title">Hvad skal vi<br />drømme om?</h1>
          <p className="intro">Find på en lille idé. Så hjælper vi den på vej.</p>

          <form onSubmit={generateStory}>
            <label className="field-label" htmlFor="prompt">Din idé</label>
            <textarea
              id="prompt"
              className="prompt-input"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="En ræv, der leder efter nordlyset …"
              maxLength={5000}
              required
              rows={3}
            />
            <div className="prompt-meta"><span>Et par ord er nok</span><span>{prompt.length}/5000</span></div>

            <div className="field-row">
              <div className="field-group">
                <label className="field-label" htmlFor="length">Længde</label>
                <select
                  id="length"
                  className="select-input"
                  value={length}
                  onChange={(event) => setLength(event.target.value)}
                >
                  <option value="short">Kort · 2 min.</option>
                  <option value="medium">Mellem · 5 min.</option>
                  <option value="long">Lang · 8 min.</option>
                </select>
              </div>
              <div className="field-group tone-group">
                <span className="field-label">Stemning</span>
                <div className="tone-options" role="group" aria-label="Vælg stemning">
                  {tones.map((option) => (
                    <button
                      className={`tone-option${tone === option.value ? ' is-selected' : ''}`}
                      type="button"
                      key={option.value}
                      aria-pressed={tone === option.value}
                      onClick={() => setTone(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="field-row detail-row">
              <div className="field-group">
                <label className="field-label" htmlFor="setting">Sted eller tema <span>VALGFRIT</span></label>
                <input
                  id="setting"
                  className="text-input"
                  value={setting}
                  onChange={(event) => setSetting(event.target.value)}
                  placeholder="En hemmelig have"
                  maxLength={500}
                />
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="characters">Hvem er med? <span>VALGFRIT</span></label>
                <input
                  id="characters"
                  className="text-input"
                  value={characters}
                  onChange={(event) => setCharacters(event.target.value)}
                  placeholder="Mille og en lille drage"
                  maxLength={500}
                />
              </div>
            </div>

            <button className="generate-button" type="submit" disabled={!prompt.trim() || isLoading}>
              {isLoading ? <><span className="spinner" aria-hidden="true" /> Skriver historien …</> : 'Lav min historie'}
              {!isLoading && <span aria-hidden="true">→</span>}
            </button>
          </form>
        </section>

        <section className={`story-panel${story ? ' has-story' : ''}`} aria-label="Din historie" aria-live="polite">
          {error && <div className="error-message" role="alert">{error}</div>}

          {isLoading ? (
            <div className="loading-state">
              <div className="loading-mark" aria-hidden="true"><span /></div>
              <p>Der bliver fundet på noget fint</p>
              <span>Det tager lige et øjeblik</span>
            </div>
          ) : story ? (
            <article className="story-sheet">
              <div className="story-toolbar">
                <span className="story-kicker">AFTENENS FORTÆLLING</span>
                <button className="copy-button" type="button" onClick={copyStory}>
                  {isCopied ? 'Kopieret' : 'Kopiér historie'}
                </button>
              </div>
              <div className="story-text">{story}</div>
              <div className="story-footer">
                <span>SLUT GODT · SOV GODT</span>
                <button className="regenerate-button" type="button" onClick={() => generateStory()} disabled={isLoading}>
                  Lav en ny version <span aria-hidden="true">↻</span>
                </button>
              </div>
            </article>
          ) : (
            <div className="empty-state">
              <div className="book-illustration" aria-hidden="true">
                <span className="book-page page-left" />
                <span className="book-page page-right" />
                <span className="book-spine" />
                <span className="book-star star-one">✳</span>
                <span className="book-star star-two">✦</span>
                <span className="book-star star-three">·</span>
              </div>
              <span className="empty-kicker">PLADS TIL EN FORTÆLLING</span>
              <h2>En tom side<br />venter på jer.</h2>
              <p>Jeres næste lille eventyr begynder med en idé.</p>
            </div>
          )}
        </section>
      </main>

      <footer className="page-footer">
        <span>AFTENRO <span aria-hidden="true">·</span> FORTÆLLINGER TIL SENGETID</span>
        <span>SKABT HJEMME HOS JER</span>
      </footer>
    </div>
  )
}

export default App
