const colors = [
  ['bg-0', 'bg-bg-0'], ['bg-1', 'bg-bg-1'], ['bg-2', 'bg-bg-2'], ['bg-3', 'bg-bg-3'],
  ['gold', 'bg-gold'], ['gold-hi', 'bg-gold-hi'], ['saffron', 'bg-saffron'],
  ['saff-hi', 'bg-saff-hi'], ['maroon', 'bg-maroon'], ['cream', 'bg-cream'],
]
const fonts = [
  ['font-display', 'Sree Sastha Anugraha Peetam'],
  ['font-head', 'Sree Sastha Anugraha Peetam'],
  ['font-te', 'శ్రీ శాస్త్ర అనుగ్రహ పీఠం'],
  ['font-body', 'Swamiye Saranam Ayyappa'],
]

export default function StyleGuide() {
  return (
    <div className="min-h-screen bg-bg-1 p-8 text-cream font-body">
      <h1 className="font-display text-3xl text-gold-hi mb-8">Style Guide</h1>
      <h2 className="font-head text-xl text-gold mb-4">Colors</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 mb-10">
        {colors.map(([name, cls]) => (
          <div key={name} className="rounded-lg border border-gold/30 overflow-hidden">
            <div className={`${cls} h-16`} />
            <div className="p-2 text-sm">{name}</div>
          </div>
        ))}
      </div>
      <h2 className="font-head text-xl text-gold mb-4">Typography</h2>
      <div className="space-y-3 mb-10">
        {fonts.map(([cls, sample]) => (
          <div key={cls}>
            <code className="text-xs text-saff-hi">{cls}</code>
            <p className={`${cls} text-2xl`}>{sample}</p>
          </div>
        ))}
      </div>
      <h2 className="font-head text-xl text-gold mb-4">Effects</h2>
      <div className="rounded-lg bg-bg-3 p-6 shadow-gold-glow border border-gold/40 w-64">shadow-gold-glow</div>
    </div>
  )
}
