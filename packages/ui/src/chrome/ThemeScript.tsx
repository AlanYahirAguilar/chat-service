/** Aplica el tema guardado antes del primer render (sin FOUC). */
export function ThemeScript() {
  const code = `try{var t=localStorage.getItem('relay-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}`
  return <script dangerouslySetInnerHTML={{ __html: code }} />
}
