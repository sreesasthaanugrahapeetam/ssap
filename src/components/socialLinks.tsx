import { useSheetRows } from '../hooks/useSheet'

type YT = { href: string; label: string }
export type Social = {
  yt: (i: number) => YT | null
  si: (kind: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube') => string | null
}

/** Social tab of the CMS. `offset` = index of this component's first .yt-btn in document order (legacy behaviour). */
export function useSocial(offset: number): Social {
  const rows = useSheetRows('social')
  const data = rows && rows.length > 1 ? rows.slice(1).filter(r => r[0] && r[1]) : []
  const ytRows = data.filter(r => r[0].toLowerCase() === 'youtube')
  return {
    yt: i => {
      if (!ytRows.length) return null
      const r = ytRows[(offset + i) % ytRows.length]
      return { href: r[1], label: '▶ ' + (r[2] || 'YouTube') }
    },
    si: kind => {
      const r = data.find(x => x[0].toLowerCase() === kind)
      return r ? r[1] : null
    },
  }
}

const L = (s: Social, k: Parameters<Social['si']>[0], d: string) => s.si(k) || d

export function SocialIcons({ social, style }: { social: Social; style?: React.CSSProperties }) {
  return (
    <div className="social-icons" style={style}>
      <a href={L(social, 'facebook', 'https://facebook.com/Devotional-Culture-273913603091696')} target="_blank" rel="noopener" className="si fb" title="Facebook"><svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
      <a href={L(social, 'twitter', 'https://twitter.com/devotional_1')} target="_blank" rel="noopener" className="si tw" title="Twitter / X"><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
      <a href={L(social, 'instagram', 'https://instagram.com/devotionalculture')} target="_blank" rel="noopener" className="si ig" title="Instagram"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none"/></svg></a>
      <a href={L(social, 'linkedin', 'https://linkedin.com/in/devotional-culture-17b053140/detail/recent-activity')} target="_blank" rel="noopener" className="si li" title="LinkedIn"><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>
      <a href={L(social, 'youtube', 'https://www.youtube.com/@chinmudratv4828')} target="_blank" rel="noopener" className="si yt" title="YouTube"><svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#c00"/></svg></a>
    </div>
  )
}

const DEF_YT = [
  { href: 'https://www.youtube.com/@chinmudratv4828', label: '▶ Chinmudra TV' },
  { href: 'https://www.youtube.com/@devotionalculture4687', label: '▶ Devotional Culture' },
]

export function YtButton({ social, index, override }: { social: Social; index: number; override?: YT | null }) {
  const v = social.yt(index) || override || DEF_YT[index]
  return <a href={v.href} target="_blank" rel="noopener" className="yt-btn">{v.label}</a>
}
